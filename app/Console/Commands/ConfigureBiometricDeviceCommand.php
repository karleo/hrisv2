<?php

namespace App\Console\Commands;

use App\Enums\BiometricConnectionType;
use App\Models\BiometricDevice;
use App\Support\BiometricTimezoneOptions;
use Illuminate\Console\Command;

class ConfigureBiometricDeviceCommand extends Command
{
    protected $signature = 'biometric:configure-device
                            {id=5 : Biometric device ID to create or update}
                            {--host=192.168.1.44 : Device IP}
                            {--port=80 : Web UI port}
                            {--serial=OAE7050057042700029 : Terminal serial number}
                            {--inactive : Leave device inactive}';

    protected $description = 'Create or update an iClock device for device web report pull';

    public function handle(): int
    {
        $id = (int) $this->argument('id');
        $host = (string) $this->option('host');
        $port = (int) $this->option('port');
        $serial = (string) $this->option('serial');

        $webUsername = trim((string) config('biometric.device_web.default_username', 'administrator'));
        $webPassword = (string) config('biometric.device_web.default_password', '');

        $attributes = [
            'name' => 'Main entrance iClock990',
            'model' => 'iClock990',
            'serial_number' => $serial,
            'connection_type' => BiometricConnectionType::DeviceWebReport,
            'host' => $host,
            'port' => $port,
            'comm_key' => null,
            'timezone' => BiometricTimezoneOptions::Default,
            'is_active' => ! $this->option('inactive'),
            'last_error' => null,
            'last_sync_status' => null,
            'metadata' => [
                'protocol' => 'tcp',
                'web_username' => $webUsername,
                'web_password' => $webPassword,
            ],
        ];

        $existing = BiometricDevice::query()->find($id);

        if ($existing !== null) {
            $conflict = BiometricDevice::query()
                ->where('serial_number', $serial)
                ->where('id', '!=', $id)
                ->exists();

            if ($conflict) {
                $this->error("Serial {$serial} is already used by another device.");

                return self::FAILURE;
            }

            $existing->update($attributes);
            $device = $existing->fresh();
        } else {
            $conflict = BiometricDevice::query()->where('serial_number', $serial)->first();

            if ($conflict !== null) {
                $conflict->update($attributes);
                $device = $conflict->fresh();
                $this->warn("Updated existing device #{$device->id} (serial match) instead of creating ID {$id}.");
            } else {
                $device = new BiometricDevice($attributes);
                $device->id = $id;
                $device->save();
            }
        }

        $this->info("Biometric device configured: #{$device->id} {$device->name}");
        $this->table(
            ['Setting', 'Value'],
            [
                ['Connection', $device->connection_type->value],
                ['Host', $device->host],
                ['Port', (string) $device->port],
                ['Web URL', $device->deviceWebBaseUrl()],
                ['Serial', $device->serial_number],
                ['Web user', $device->deviceWebUsername()],
                ['Web password', $device->hasDeviceWebPassword() ? 'configured' : 'missing'],
                ['Active', $device->is_active ? 'yes' : 'no'],
                ['Timezone', $device->timezone],
            ],
        );

        $this->newLine();
        $this->line('Next:');
        $this->line("  php artisan biometric:test-device-web {$device->id}");
        $this->line("  php artisan biometric:debug-web-report {$device->id} --from=2026-05-14 --to=2026-05-22");

        return self::SUCCESS;
    }
}
