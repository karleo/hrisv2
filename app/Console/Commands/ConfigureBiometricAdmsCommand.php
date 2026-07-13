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
                            {--timezone=Asia/Dubai : Device timezone for date ranges}
                            {--cloud : Clear LAN host IP (AWS/cloud — terminal must push; HRIS cannot pull)}';

    protected $description = 'Apply ADMS push settings in HRIS and print iClock terminal setup steps';

    public function handle(): int
    {
        $pushBase = config('biometric.push_base_url');

        if (! is_string($pushBase) || $pushBase === '') {
            $this->error('Set BIOMETRIC_PUSH_BASE_URL to your public HRIS URL (AWS) or PC LAN IP (Laragon), not localhost.');

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
        $clearHost = (bool) $this->option('cloud');

        $device->update([
            'connection_type' => BiometricConnectionType::AdmsPush,
            'is_active' => true,
            'timezone' => $timezone,
            'host' => $clearHost ? null : $device->host,
            'last_error' => null,
            'last_sync_status' => null,
            'metadata' => array_merge($device->metadata ?? [], [
                'protocol' => 'tcp',
                'switched_to_adms_at' => now()->toIso8601String(),
                'cloud_adms' => $clearHost,
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

        if ($clearHost) {
            $this->warn('Cloud mode: device host IP cleared. AWS cannot pull from a private LAN IP.');
        }

        $this->warn('On the iClock terminal (Menu → Communication → ADMS):');
        $this->line('  1. Enable ADMS = ON');
        $this->line('  2. If the menu has one Server URL field, use: '.$cdataUrl);
        $this->line('  3. If the menu has separate fields:');
        $this->line('       Server address / IP: '.BiometricPushUrl::hostForDeviceMenu());
        $this->line('       Port: '.BiometricPushUrl::portForDeviceMenu());
        $this->line('       HTTPS / SSL: '.(BiometricPushUrl::usesHttps() ? 'ON' : 'OFF'));
        $this->line("  4. Device serial must be: {$device->serial_number}");
        $this->line('  5. Save, wait 1–2 minutes, punch once');
        $this->line('  6. Staging Connectivity → Last push must update to a NEW time, then Import attendance');
        $this->line('  7. Prefer HTTP on the terminal. Staging must NOT 301 /iclock to HTTPS (see deploy/iclock-http.nginx.conf).');
        $this->line('  8. If HTTPS never connects, use: http://'.BiometricPushUrl::hostForDeviceMenu().'/iclock/cdata');
        $this->newLine();
        $this->line('If ADMS never updates Last push: on Laragon (same LAN), web-report Import, then:');
        $this->line("  php artisan biometric:relay-punches {$device->id} --url={$cdataUrl} --from=YYYY-MM-DD --to=YYYY-MM-DD");
        $this->newLine();

        $this->line('Testing push endpoint from this PC…');

        $endpointOk = $this->probeUrl($testUrl);

        if ($endpointOk) {
            $this->info('Endpoint OK — configure the terminal with the URL above, then punch.');
        }

        if (! $endpointOk) {
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
                $this->error('Push URL is not responding from this PC. Confirm BIOMETRIC_PUSH_BASE_URL and that AWS/Laragon is up.');
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
