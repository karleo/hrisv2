<?php

namespace App\Console\Commands;

use App\Models\BiometricDevice;
use Illuminate\Console\Command;

class TestBiometricDeviceWebLoginCommand extends Command
{
    protected $signature = 'biometric:test-device-web
                            {device=12 : Device ID}
                            {--force-no-session : Skip SessionID pre-fetch; login via POST /csl/check only}';

    protected $description = 'Test iClock web login (/csl/check) and report access without importing';

    public function handle(): int
    {
        $device = BiometricDevice::query()->find($this->argument('device'));

        if ($device === null) {
            $available = BiometricDevice::query()->orderBy('id')->pluck('name', 'id');

            if ($available->isEmpty()) {
                $this->error('Device not found. No biometric devices in this database.');
            } else {
                $this->error('Device not found. Available IDs: '.$available->map(fn ($name, $id) => "{$id} ({$name})")->implode(', '));
            }

            return self::FAILURE;
        }

        $this->line('Host: '.$device->host);
        $this->line('Web username: '.$device->deviceWebUsername());
        $this->line('Password configured: '.($device->hasDeviceWebPassword() ? 'yes (length '.strlen($device->deviceWebPassword()).')' : 'no'));
        $this->line('Metadata web_password set: '.(is_string($device->metadata['web_password'] ?? null) ? 'yes' : 'no'));
        $this->line('Env BIOMETRIC_DEVICE_WEB_PASSWORD set: '.(config('biometric.device_web.default_password') !== '' ? 'yes' : 'no'));
        $this->line('Force no session: '.($this->option('force-no-session') ? 'yes' : 'no'));
        $this->newLine();

        $client = app(\App\Services\Biometric\ZkDeviceWebReportClient::class);

        if ($this->option('force-no-session')) {
            $client->useForceNoSession(true);
        }

        try {
            $client->testLogin($device);
            $session = $client->lastSessionIdUsed();
            $this->info('Web login and report access OK.');
            $this->line('SessionID: '.($session ?? '(none — session optional)'));

            return self::SUCCESS;
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}
