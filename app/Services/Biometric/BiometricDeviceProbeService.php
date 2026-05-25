<?php

namespace App\Services\Biometric;

use App\Enums\BiometricConnectionType;
use App\Models\BiometricDevice;
use App\Support\BiometricPushUrl;
use Mithun\PhpZkteco\Libs\ZKTeco;

final class BiometricDeviceProbeService
{
    public function __construct(
        private readonly ZkTecoConnectGuard $connectGuard,
        private readonly ZkDeviceWebReportClient $webReportClient,
    ) {}

    /**
     * Fast check for the UI (seconds). Does not try every comm key / protocol.
     *
     * @return array{
     *     device_id: int,
     *     host: string|null,
     *     port: int,
     *     connection_type: string,
     *     port_reachable: bool,
     *     ext_sockets: bool,
     *     adms_http_on_device_port: bool,
     *     pull_can_connect: bool,
     *     working_comm_key: int|null,
     *     working_protocol: string|null,
     *     attempts: list<string>,
     *     recommendation: string,
     *     push_url: string,
     *     ok: bool,
     * }
     */
    public function quickProbe(BiometricDevice $device): array
    {
        $result = $this->probe($device);

        if ($device->connection_type === BiometricConnectionType::AdmsPush) {
            $hasPush = is_string($device->metadata['last_adms_push_at'] ?? null);
            $result['ok'] = $hasPush;

            return $result;
        }

        if ($device->connection_type === BiometricConnectionType::DeviceWebReport) {
            $result['ok'] = $this->webReportLoginWorks($device);
            $result['pull_can_connect'] = $result['ok'];

            return $result;
        }

        $result['ok'] = $result['pull_can_connect'];

        return $result;
    }

    public function probe(BiometricDevice $device): array
    {
        $attempts = [];
        $pullCanConnect = false;
        $workingKey = null;
        $workingProtocol = null;

        if ($device->connection_type === BiometricConnectionType::AdmsPush) {
            $lastPush = $device->metadata['last_adms_push_at'] ?? null;

            return [
                'device_id' => $device->id,
                'host' => $device->host,
                'port' => $device->port,
                'connection_type' => $device->connection_type->value,
                'port_reachable' => true,
                'ext_sockets' => extension_loaded('sockets'),
                'adms_http_on_device_port' => false,
                'pull_can_connect' => false,
                'working_comm_key' => null,
                'working_protocol' => null,
                'attempts' => [],
                'recommendation' => $lastPush
                    ? 'ADMS push is configured. Last push at '.$lastPush.'.'
                    : 'Configure the terminal cloud server to '.BiometricPushUrl::cdataEndpoint().' (use your LAN IP, not localhost).',
                'push_url' => BiometricPushUrl::cdataEndpoint(),
                'ok' => $lastPush !== null,
            ];
        }

        if ($device->connection_type === BiometricConnectionType::DeviceWebReport) {
            return $this->deviceWebReportProbeResult($device);
        }

        $host = $device->host ?? '';
        $port = $device->port;
        $portReachable = $host !== '' && $this->portReachable($host, $port);
        $admsOnPort = $host !== '' && $this->devicePortSpeaksAdms($host, $port);

        if ($portReachable && extension_loaded('sockets') && ! $admsOnPort) {
            $protocol = $device->zkProtocol();
            $password = $device->commKeyValue();
            $connectResult = $this->tryConnect($device, $protocol, $password, 5);
            $attempts[] = strtoupper($protocol)." key {$password}: {$connectResult}";

            if ($connectResult === 'connected') {
                $pullCanConnect = true;
                $workingKey = $password;
                $workingProtocol = $protocol;
            }
        }

        $recommendation = $this->recommendation(
            $pullCanConnect,
            $admsOnPort,
            $portReachable,
            $port,
            $workingProtocol,
            $workingKey,
        );

        return [
            'device_id' => $device->id,
            'host' => $device->host,
            'port' => $port,
            'connection_type' => $device->connection_type->value,
            'port_reachable' => $portReachable,
            'ext_sockets' => extension_loaded('sockets'),
            'adms_http_on_device_port' => $admsOnPort,
            'pull_can_connect' => $pullCanConnect,
            'working_comm_key' => $workingKey,
            'working_protocol' => $workingProtocol,
            'attempts' => $attempts,
            'recommendation' => $recommendation,
            'push_url' => BiometricPushUrl::cdataEndpoint(),
            'ok' => $pullCanConnect,
        ];
    }

    /**
     * Full probe (CLI). Tries all protocols and comm keys — can take several minutes.
     *
     * @return array{
     *     device_id: int,
     *     host: string|null,
     *     port: int,
     *     connection_type: string,
     *     port_reachable: bool,
     *     ext_sockets: bool,
     *     adms_http_on_device_port: bool,
     *     pull_can_connect: bool,
     *     working_comm_key: int|null,
     *     working_protocol: string|null,
     *     attempts: list<string>,
     *     recommendation: string,
     *     push_url: string,
     * }
     */
    public function fullProbe(BiometricDevice $device): array
    {
        $attempts = [];
        $pullCanConnect = false;
        $workingKey = null;
        $workingProtocol = null;

        if ($device->connection_type === BiometricConnectionType::AdmsPush) {
            $lastPush = $device->metadata['last_adms_push_at'] ?? null;

            return [
                'device_id' => $device->id,
                'host' => $device->host,
                'port' => $device->port,
                'connection_type' => $device->connection_type->value,
                'port_reachable' => true,
                'ext_sockets' => extension_loaded('sockets'),
                'adms_http_on_device_port' => false,
                'pull_can_connect' => false,
                'working_comm_key' => null,
                'working_protocol' => null,
                'attempts' => [],
                'recommendation' => $lastPush
                    ? 'ADMS push is configured. Last push at '.$lastPush.'.'
                    : 'Configure the terminal cloud server to '.BiometricPushUrl::cdataEndpoint().' (use your LAN IP, not localhost).',
                'push_url' => BiometricPushUrl::cdataEndpoint(),
            ];
        }

        $host = $device->host ?? '';
        $port = $device->port;
        $portReachable = $host !== '' && $this->portReachable($host, $port);
        $admsOnPort = $host !== '' && $this->devicePortSpeaksAdms($host, $port);

        if ($portReachable && extension_loaded('sockets') && ! $admsOnPort) {
            foreach ($device->zkProtocolsToTry() as $protocol) {
                foreach ($device->commKeyCandidates() as $password) {
                    $result = $this->tryConnect($device, $protocol, $password, 8);
                    $attempts[] = strtoupper($protocol)." key {$password}: {$result}";

                    if ($result === 'connected') {
                        $pullCanConnect = true;
                        $workingKey = $password;
                        $workingProtocol = $protocol;
                        break 2;
                    }
                }
            }
        }

        $recommendation = $this->recommendation(
            $pullCanConnect,
            $admsOnPort,
            $portReachable,
            $port,
            $workingProtocol,
            $workingKey,
        );

        return [
            'device_id' => $device->id,
            'host' => $device->host,
            'port' => $port,
            'connection_type' => $device->connection_type->value,
            'port_reachable' => $portReachable,
            'ext_sockets' => extension_loaded('sockets'),
            'adms_http_on_device_port' => $admsOnPort,
            'pull_can_connect' => $pullCanConnect,
            'working_comm_key' => $workingKey,
            'working_protocol' => $workingProtocol,
            'attempts' => $attempts,
            'recommendation' => $recommendation,
            'push_url' => BiometricPushUrl::cdataEndpoint(),
        ];
    }

    private function recommendation(
        bool $pullCanConnect,
        bool $admsOnPort,
        bool $portReachable,
        int $port,
        ?string $workingProtocol,
        ?int $workingKey,
    ): string {
        if ($pullCanConnect) {
            return "ZK pull works on {$workingProtocol} with comm key {$workingKey}. Set Protocol to ".strtoupper((string) $workingProtocol).' in the device form.';
        }

        if (! $portReachable) {
            return 'Cannot reach the device IP/port. Check LAN, firewall, and that the terminal IP is correct.';
        }

        if ($admsOnPort) {
            return 'This terminal speaks ADMS (HTTP) on port '.$port.'. Use the "Switch to ADMS push" button on the dashboard, then set the terminal cloud server to '.BiometricPushUrl::cdataEndpoint();
        }

        $localhost = BiometricPushUrl::usesLocalhost()
            ? ' Set BIOMETRIC_PUSH_BASE_URL in .env to http://YOUR_PC_LAN_IP (not localhost).'
            : '';

        return 'Port is open but ZK pull failed on the saved protocol and comm key. Use "Switch to ADMS push" on the dashboard, then on the terminal set Cloud Server to '.BiometricPushUrl::cdataEndpoint().'. For a full key scan run: php artisan biometric:probe-device'.$localhost;
    }

    private function portReachable(string $host, int $port): bool
    {
        $socket = @fsockopen($host, $port, $errno, $errstr, 3);

        if ($socket === false) {
            return false;
        }

        fclose($socket);

        return true;
    }

    private function devicePortSpeaksAdms(string $host, int $port): bool
    {
        $url = "http://{$host}:{$port}/iclock/cdata?SN=probe";
        $context = stream_context_create([
            'http' => ['timeout' => 4, 'ignore_errors' => true],
        ]);
        $body = @file_get_contents($url, false, $context);

        if (! is_string($body) || $body === '') {
            return false;
        }

        return str_contains($body, 'GET OPTION FROM') || str_contains($body, 'OK');
    }

    private function tryConnect(BiometricDevice $device, string $protocol, int $password, int $timeoutSeconds = 5): string
    {
        try {
            $zk = new ZKTeco(
                host: (string) $device->host,
                port: $device->port,
                shouldPing: false,
                timeout: $timeoutSeconds,
                password: $password,
                protocol: $protocol,
            );

            if ($this->connectGuard->connectSucceeded($zk->connect())) {
                $zk->disconnect();

                return 'connected';
            }

            $zk->disconnect();

            return 'auth failed';
        } catch (\Throwable $e) {
            return $e->getMessage();
        }
    }

    private function webReportLoginWorks(BiometricDevice $device): bool
    {
        try {
            $this->webReportClient->testLogin($device);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @return array{
     *     device_id: int,
     *     host: string|null,
     *     port: int,
     *     connection_type: string,
     *     port_reachable: bool,
     *     ext_sockets: bool,
     *     adms_http_on_device_port: bool,
     *     pull_can_connect: bool,
     *     working_comm_key: int|null,
     *     working_protocol: string|null,
     *     attempts: list<string>,
     *     recommendation: string,
     *     push_url: string,
     *     ok: bool,
     * }
     */
    private function deviceWebReportProbeResult(BiometricDevice $device): array
    {
        $host = $device->host ?? '';
        $webPort = $device->deviceWebPort();
        $portReachable = $host !== '' && $this->portReachable($host, $webPort);
        $deviceWebUrl = $host !== '' ? rtrim($device->deviceWebBaseUrl(), '/') : null;
        $attempts = [];

        if (! $portReachable) {
            $attempts[] = 'HTTP port '.$webPort.' not reachable on '.$host;
        } else {
            $attempts[] = 'HTTP port '.$webPort.' reachable';
        }

        try {
            $this->webReportClient->testLogin($device);
            $attempts[] = 'Web login and attendance report OK';

            return [
                'device_id' => $device->id,
                'host' => $device->host,
                'port' => $webPort,
                'connection_type' => $device->connection_type->value,
                'port_reachable' => $portReachable,
                'ext_sockets' => extension_loaded('sockets'),
                'adms_http_on_device_port' => false,
                'pull_can_connect' => true,
                'working_comm_key' => null,
                'working_protocol' => null,
                'attempts' => $attempts,
                'recommendation' => 'Web report pull is working. Use Import attendance with the same dates you use in Report on the device at '.$deviceWebUrl.' (e.g. 2026-05-14 to 2026-05-22). Optional: for live punches, also set terminal cloud server to '.BiometricPushUrl::cdataEndpoint().'.',
                'push_url' => BiometricPushUrl::cdataEndpoint(),
                'ok' => true,
            ];
        } catch (\Throwable $exception) {
            $attempts[] = 'Web login failed: '.$exception->getMessage();

            return [
                'device_id' => $device->id,
                'host' => $device->host,
                'port' => $webPort,
                'connection_type' => $device->connection_type->value,
                'port_reachable' => $portReachable,
                'ext_sockets' => extension_loaded('sockets'),
                'adms_http_on_device_port' => false,
                'pull_can_connect' => false,
                'working_comm_key' => null,
                'working_protocol' => null,
                'attempts' => $attempts,
                'recommendation' => $exception->getMessage(),
                'push_url' => BiometricPushUrl::cdataEndpoint(),
                'ok' => false,
            ];
        }
    }
}
