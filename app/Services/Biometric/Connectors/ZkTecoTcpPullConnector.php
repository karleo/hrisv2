<?php

namespace App\Services\Biometric\Connectors;

use App\Contracts\Biometric\BiometricDeviceConnector;
use App\Enums\BiometricConnectionType;
use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricPunchNormalizer;
use App\Services\Biometric\ZkTecoConnectGuard;
use App\Support\BiometricPushUrl;
use Generator;
use Illuminate\Support\Carbon;
use Mithun\PhpZkteco\Libs\ZKTeco;
use RuntimeException;

final class ZkTecoTcpPullConnector implements BiometricDeviceConnector
{
    private const int CONNECT_TIMEOUT_SECONDS = 10;

    private ?string $lastConnectDetail = null;

    public function __construct(
        private readonly BiometricPunchNormalizer $normalizer,
        private readonly ZkTecoConnectGuard $connectGuard,
    ) {}

    public function testConnection(BiometricDevice $device): bool
    {
        $this->assertConnectable($device);

        return true;
    }

    public function fetchAttendanceLogs(
        BiometricDevice $device,
        ?Carbon $since = null,
        ?Carbon $until = null,
    ): Generator {
        if ($device->connection_type !== BiometricConnectionType::TcpPull) {
            throw new RuntimeException('Device is not configured for TCP pull sync.');
        }

        $this->assertSocketsAndHost($device);

        $errors = [];
        $protocols = $device->zkProtocolsToTry();
        $preferred = $device->zkProtocol();

        foreach ($protocols as $index => $protocol) {
            try {
                $result = $this->readAttendanceWithProtocol($device, $protocol, $since, $until, quickConnect: true);

                if ($result['yielded'] > 0) {
                    foreach ($result['punches'] as $punch) {
                        yield $punch;
                    }

                    if ($protocol !== $preferred) {
                        throw new RuntimeException(
                            "Attendance was read using {$protocol} (saved setting is {$preferred}). Edit the device and set Protocol to ".strtoupper($protocol).' to match your terminal.',
                        );
                    }

                    return;
                }

                $errors[] = strtoupper($protocol).': '.$result['message'];

                // Connected but no punches in range / empty memory — not a connection failure.
                if ($result['connected']) {
                    return;
                }
            } catch (RuntimeException $e) {
                throw $e;
            } catch (\Throwable $e) {
                $errors[] = strtoupper($protocol).': '.$e->getMessage();
            }
        }

        $hint = $this->admsHint($device);

        throw new RuntimeException(
            'Could not read attendance from the device. '.implode(' ', array_unique($errors))
            .' '.$hint
            .' Run: php artisan biometric:probe-device '.$device->id,
        );
    }

    /**
     * @return array{connected: bool, yielded: int, message: string, punches: list<\App\Services\Biometric\BiometricPunchData>}
     */
    private function readAttendanceWithProtocol(
        BiometricDevice $device,
        string $protocol,
        ?Carbon $since,
        ?Carbon $until = null,
        bool $quickConnect = false,
    ): array {
        $session = $this->openSession($device, $protocol, $quickConnect);

        if ($session === null) {
            $detail = $this->lastConnectDetail ?? 'no ZK session (wrong comm key, wrong protocol, or device uses ADMS push only).';

            return [
                'connected' => false,
                'yielded' => 0,
                'message' => $detail,
                'punches' => [],
            ];
        }

        $zk = $session['client'];
        $usedPassword = $session['password'];

        try {
            // Many ZK firmwares (including iClock) require disable before ATTLOG download.
            $zk->disableDevice();

            $records = $zk->getAttendances();

            if ($records === [] || $records === false) {
                return [
                    'connected' => true,
                    'yielded' => 0,
                    'message' => 'no attendance records on device (memory empty, log cleared, or this firmware does not expose ATTLOG over TCP). Check Report on http://'.$device->host.' — if punches exist there, use Switch to web report pull.',
                    'punches' => [],
                ];
            }

            $punches = [];
            $parsed = 0;

            foreach ($records as $record) {
                if (! is_array($record)) {
                    continue;
                }

                $parsed++;
                $punch = $this->normalizer->fromZkTecoRecord($device, $record);

                if ($punch->deviceUserId === '') {
                    continue;
                }

                if ($since !== null && $punch->punchedAt->lt($since)) {
                    continue;
                }

                if ($until !== null && $punch->punchedAt->gt($until)) {
                    continue;
                }

                $punches[] = $punch;
            }

            if ($parsed === 0) {
                return [
                    'connected' => true,
                    'yielded' => 0,
                    'message' => 'attendance payload could not be parsed.',
                    'punches' => [],
                ];
            }

            $message = count($punches) > 0 ? 'ok' : 'records found but all were filtered (date range or missing user id).';

            if ($usedPassword === 0 && $device->commKeyValue() !== 0) {
                $message .= ' Connected using comm key 0; clear the Comm key field or set it to 0 to match the device.';
            }

            return [
                'connected' => true,
                'yielded' => count($punches),
                'message' => $message,
                'punches' => $punches,
            ];
        } finally {
            try {
                $zk->enableDevice();
            } catch (\Throwable) {
                // Ignore enable failures after a failed/partial pull.
            }

            $zk->disconnect();
        }
    }

    private function assertConnectable(BiometricDevice $device): void
    {
        $this->assertSocketsAndHost($device);

        $host = $device->host;
        $port = $device->port;
        $preferred = $device->zkProtocol();

        if (! $this->canReachHost($host, $port)) {
            throw new RuntimeException(
                "Cannot open a network connection to {$host}:{$port}. Ensure Laragon is on the same LAN as the terminal, the IP is correct, and Windows Firewall allows outbound traffic on port {$port}.",
            );
        }

        $admsHint = $this->detectAdmsHttpOnPort($host, $port);

        if ($admsHint !== null) {
            throw new RuntimeException($admsHint);
        }

        $errors = [];

        foreach ($device->zkProtocolsToTry() as $protocol) {
            $session = $this->openSession($device, $protocol);

            if ($session !== null) {
                $usedPassword = $session['password'];

                try {
                    if ($protocol !== $preferred) {
                        throw new RuntimeException(
                            "Connected using {$protocol} (saved setting is {$preferred}). Edit the device and set Protocol to ".strtoupper($protocol).' to match your terminal.',
                        );
                    }

                    if ($usedPassword === 0 && $device->commKeyValue() !== 0) {
                        throw new RuntimeException(
                            'Connected using comm key 0, but this device is saved with a different comm key. Clear the Comm key field (or set 0) unless your terminal admin password is non-zero.',
                        );
                    }

                    return;
                } finally {
                    $session['client']->disconnect();
                }
            }

            $errors[] = strtoupper($protocol).': '.($this->lastConnectDetail ?? 'session rejected');
        }

        throw new RuntimeException(
            'Could not connect to the device. '.implode(' ', array_unique($errors))
            .' '.$this->admsHint($device)
            .' Run: php artisan biometric:probe-device '.$device->id,
        );
    }

    private function assertSocketsAndHost(BiometricDevice $device): void
    {
        if (! extension_loaded('sockets')) {
            throw new RuntimeException(
                'PHP sockets extension (ext-sockets) is not enabled. Enable it in Laragon → PHP → Extensions for both Apache and CLI, then restart Apache.',
            );
        }

        if ($device->host === null || $device->host === '') {
            throw new RuntimeException('Device host (IP) is not configured.');
        }
    }

    /**
     * @return array{client: ZKTeco, password: int}|null
     */
    private function openSession(BiometricDevice $device, string $protocol, bool $quickConnect = false): ?array
    {
        $this->lastConnectDetail = null;
        $failures = [];

        $keys = $quickConnect
            ? array_values(array_unique([$device->commKeyValue(), 0]))
            : $device->commKeyCandidates();

        foreach ($keys as $index => $password) {
            if ($index > 0) {
                sleep(2);
            }

            for ($attempt = 1; $attempt <= 3; $attempt++) {
                $zk = $this->makeClient($device, $protocol, $password);

                try {
                    if ($this->connectGuard->connect($zk)) {
                        return [
                            'client' => $zk,
                            'password' => $password,
                        ];
                    }

                    $failures[] = "key {$password} try {$attempt}: no reply or auth failed";
                } catch (\Throwable $e) {
                    $failures[] = "key {$password} try {$attempt}: {$e->getMessage()}";
                }

                $zk->disconnect();

                if ($attempt < 3) {
                    usleep(800_000);
                }
            }
        }

        if ($failures !== []) {
            $this->lastConnectDetail = strtoupper($protocol).' ('.implode('; ', $failures).')';
        }

        return null;
    }

    private function canReachHost(string $host, int $port): bool
    {
        $socket = @fsockopen($host, $port, $errno, $errstr, 3);

        if ($socket === false) {
            return false;
        }

        fclose($socket);

        return true;
    }

    private function detectAdmsHttpOnPort(string $host, int $port): ?string
    {
        $url = "http://{$host}:{$port}/iclock/cdata?SN=probe";
        $context = stream_context_create([
            'http' => [
                'timeout' => 3,
                'ignore_errors' => true,
            ],
        ]);

        $body = @file_get_contents($url, false, $context);

        if ($body === false || $body === '') {
            return null;
        }

        if (str_contains($body, 'GET OPTION FROM') || str_contains($body, 'OK')) {
            return 'Port '.$port.' on '.$host.' is ADMS (HTTP), not ZK pull. Use dashboard "Switch to ADMS push", then terminal Cloud Server → '.BiometricPushUrl::cdataEndpoint();
        }

        return null;
    }

    private function admsHint(BiometricDevice $device): string
    {
        return 'If pull never works: use dashboard "Switch to ADMS push", then terminal Cloud Server → '.BiometricPushUrl::cdataEndpoint().' (set BIOMETRIC_PUSH_BASE_URL to your LAN IP in .env).';
    }

    private function makeClient(BiometricDevice $device, string $protocol, ?int $password = null): ZKTeco
    {
        if ($device->host === null || $device->host === '') {
            throw new RuntimeException('Device host is not configured.');
        }

        return new ZKTeco(
            host: $device->host,
            port: $device->port,
            shouldPing: false,
            timeout: self::CONNECT_TIMEOUT_SECONDS,
            password: $password ?? $device->commKeyValue(),
            protocol: $protocol,
        );
    }
}
