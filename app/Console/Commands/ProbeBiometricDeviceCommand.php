<?php

namespace App\Console\Commands;

use App\Models\BiometricDevice;
use App\Services\Biometric\ZkTecoConnectGuard;
use App\Support\BiometricPushUrl;
use Illuminate\Console\Command;
use Mithun\PhpZkteco\Libs\ZKTeco;

class ProbeBiometricDeviceCommand extends Command
{
    protected $signature = 'biometric:probe-device {device? : Biometric device ID (omit to list devices)}';

    protected $description = 'Test ZKTeco TCP/UDP connection and comm keys for a biometric device';

    public function handle(ZkTecoConnectGuard $connectGuard): int
    {
        $id = $this->argument('device');

        if ($id === null || $id === '') {
            $devices = BiometricDevice::query()->orderBy('id')->get(['id', 'name', 'host', 'serial_number']);

            if ($devices->isEmpty()) {
                $this->warn('No biometric devices in the database.');

                return self::SUCCESS;
            }

            $this->table(['ID', 'Name', 'Host', 'Serial'], $devices->map(fn ($d) => [
                $d->id,
                $d->name,
                $d->host,
                $d->serial_number,
            ])->all());
            $this->line('Run: php artisan biometric:probe-device <id>');

            return self::SUCCESS;
        }

        $device = BiometricDevice::query()->findOrFail($id);

        $this->info("Device #{$device->id}: {$device->name}");
        $this->line("  Host: {$device->host}:{$device->port}");
        $this->line('  Serial: '.$device->serial_number);
        $this->line('  Protocol (saved): '.$device->zkProtocol());
        $this->line('  Comm key (saved): '.$device->commKeyValue());
        $this->line('  Connection: '.$device->connection_type->value);
        $this->line('  ext-sockets: '.(extension_loaded('sockets') ? 'yes' : 'NO — enable in php.ini'));
        $this->line('  PHP: '.PHP_BINARY.' ('.PHP_SAPI.')');
        $this->line('  php.ini: '.(php_ini_loaded_file() ?: 'unknown'));

        if ($device->connection_type->value === 'adms_push') {
            $lastPush = $device->metadata['last_adms_push_at'] ?? null;
            $this->info('ADMS push — terminal cloud server URL: '.BiometricPushUrl::cdataEndpoint());
            $this->line('  Last push received: '.($lastPush ?: 'never'));
            $this->line('  Punches in DB: '.$device->punches()->count());
            $this->line('  Run: php artisan biometric:configure-adms '.$device->id);

            return self::SUCCESS;
        }

        if ($device->host === null || $device->host === '') {
            $this->error('Host is empty.');

            return self::FAILURE;
        }

        $portOpen = @fsockopen($device->host, $device->port, $errno, $errstr, 3);

        if ($portOpen === false) {
            $this->error("Port {$device->port} not reachable: {$errstr} ({$errno})");

            return self::FAILURE;
        }

        fclose($portOpen);
        $this->info("Port {$device->port} is reachable (TCP).");

        foreach ($device->zkProtocolsToTry() as $protocol) {
            foreach ($device->commKeyCandidates() as $password) {
                $result = $this->tryConnect($device, $protocol, $password, $connectGuard);
                $this->line("  [{$protocol}] comm key {$password}: {$result}");
            }
        }

        $this->newLine();
        $this->comment('If all attempts fail: set Comm key to 0 on device (MENU → Comm), try TCP, disable other software using the device, or switch connection type to ADMS push in HRIS.');

        return self::SUCCESS;
    }

    private function tryConnect(
        BiometricDevice $device,
        string $protocol,
        int $password,
        ZkTecoConnectGuard $connectGuard,
    ): string {
        if (! extension_loaded('sockets')) {
            return 'skipped (no ext-sockets)';
        }

        try {
            $zk = new ZKTeco(
                host: $device->host,
                port: $device->port,
                shouldPing: false,
                timeout: 10,
                password: $password,
                protocol: $protocol,
            );

            $result = $zk->connect();

            if ($connectGuard->connectSucceeded($result)) {
                $zk->disconnect();

                return 'CONNECTED (code '.$result.')';
            }

            $zk->disconnect();

            return 'failed (code '.var_export($result, true).')';
        } catch (\Throwable $e) {
            return 'error: '.$e->getMessage();
        }
    }
}
