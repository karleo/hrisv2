<?php

namespace App\Console\Commands;

use App\Enums\BiometricConnectionType;
use App\Models\BiometricDevice;
use App\Support\BiometricPushUrl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class ConfigureBiometricAdmsCommand extends Command
{
    protected $signature = 'biometric:configure-adms
                            {device=12 : Biometric device ID}
                            {--timezone=Asia/Dubai : Device timezone for date ranges}';

    protected $description = 'Apply ADMS push settings in HRIS and print iClock terminal setup steps';

    public function handle(): int
    {
        $pushBase = config('biometric.push_base_url');

        if (! is_string($pushBase) || $pushBase === '') {
            $this->error('Set BIOMETRIC_PUSH_BASE_URL=http://YOUR_PC_LAN_IP:8000 in .env (not localhost).');

            return self::FAILURE;
        }

        if (BiometricPushUrl::usesLocalhost()) {
            $this->error('BIOMETRIC_PUSH_BASE_URL must not use localhost — the iClock cannot reach it.');

            return self::FAILURE;
        }

        $device = BiometricDevice::query()->find($this->argument('device'));

        if ($device === null) {
            $this->error('Device not found.');

            return self::FAILURE;
        }

        $timezone = (string) $this->option('timezone');

        $device->update([
            'connection_type' => BiometricConnectionType::AdmsPush,
            'is_active' => true,
            'timezone' => $timezone,
            'last_error' => null,
            'last_sync_status' => null,
            'metadata' => array_merge($device->metadata ?? [], [
                'protocol' => 'tcp',
                'switched_to_adms_at' => now()->toIso8601String(),
            ]),
        ]);

        $device->refresh();
        $cdataUrl = BiometricPushUrl::cdataEndpoint();
        $testUrl = $cdataUrl.'?SN='.$device->serial_number;

        $this->info("HRIS configured for device #{$device->id} ({$device->name})");
        $this->line("  Connection: {$device->connection_type->value}");
        $this->line('  Active: '.($device->is_active ? 'yes' : 'no'));
        $this->line("  Timezone: {$device->timezone}");
        $this->line("  Serial: {$device->serial_number}");
        $this->line("  Push URL: {$cdataUrl}");
        $this->newLine();

        $this->warn('On the iClock990 terminal (physical device):');
        $this->line('  1. Menu → Communication → Cloud Server (or ADMS)');
        $this->line("  2. Server URL / address: {$cdataUrl}");
        $this->line("  3. Device serial must be: {$device->serial_number}");
        $this->line('  4. Enable cloud server / ADMS, save, wait 1–2 minutes');
        $this->line('  5. Punch in/out on the device');
        $this->newLine();

        $this->line('Testing HRIS endpoint from this PC…');

        $lanOk = $this->probeUrl($testUrl);

        if ($lanOk) {
            $this->info('Endpoint OK on LAN — configure the terminal with the URL above, then punch.');
        }

        if (! $lanOk) {
            $localPort80 = 'http://127.0.0.1/iclock/cdata?SN='.$device->serial_number;
            $localPort8000 = 'http://127.0.0.1:8000/iclock/cdata?SN='.$device->serial_number;

            if ($this->probeUrl($localPort80)) {
                $this->warn('Laragon works on this PC (port 80) but the iClock cannot reach '.$pushBase);
                $this->line('Use on the terminal: '.$cdataUrl);
                $this->line('Ensure Laragon Apache is running and Windows Firewall allows port 80 (private).');
                $this->line('Your PC LAN IP is correct; 192.168.1.44 is the device IP, not the HRIS server.');
            } elseif ($this->probeUrl($localPort8000)) {
                $this->warn('HRIS responds on 127.0.0.1:8000 but NOT on your LAN IP.');
                $this->line('Stop artisan serve and use Laragon (hrisv2.test) or run: composer run serve-lan');
            } else {
                $this->error('HRIS is not responding. Start Laragon Apache or php artisan serve.');
            }
        }

        $punchCount = $device->punches()->count();
        $this->newLine();
        $this->line("Punches in database for this device: {$punchCount}");

        if ($punchCount === 0) {
            $this->warn('After configuring the terminal, punch once then check Biometric → Raw punches.');
        }

        return self::SUCCESS;
    }

    private function probeUrl(string $url): bool
    {
        try {
            $response = Http::timeout(5)->get($url);
            $body = $response->body();

            return $response->successful()
                && (str_contains($body, 'GET OPTION FROM') || str_contains($body, 'OK'));
        } catch (\Throwable) {
            return false;
        }
    }
}
