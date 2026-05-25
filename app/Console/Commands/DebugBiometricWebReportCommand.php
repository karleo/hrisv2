<?php

namespace App\Console\Commands;

use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricWebReportDiagnostic;
use Illuminate\Console\Command;

class DebugBiometricWebReportCommand extends Command
{
    protected $signature = 'biometric:debug-web-report
                            {device : Device ID}
                            {--from= : Start date Y-m-d}
                            {--to= : End date Y-m-d}
                            {--no-bypass : Skip DB bypass insert test}
                            {--force-no-session : Skip SessionID pre-fetch; login via POST /csl/check only}';

    protected $description = 'End-to-end diagnostic for iClock web report import (login, report HTML, parser, DB)';

    public function handle(BiometricWebReportDiagnostic $diagnostic): int
    {
        $device = BiometricDevice::query()->find($this->argument('device'));

        if ($device === null) {
            $this->reportDeviceNotFound((string) $this->argument('device'));

            return self::FAILURE;
        }

        if ($this->option('force-no-session')) {
            app(\App\Services\Biometric\ZkDeviceWebReportClient::class)->useForceNoSession(true);
        }

        $result = $diagnostic->run(
            $device,
            $this->option('from'),
            $this->option('to'),
            ! $this->option('no-bypass'),
        );

        $this->line('LOGIN: '.$result['login']);
        $this->line('SESSION: '.$result['session']);
        $this->line('USERS: '.$result['users']);
        $this->line('REPORT_TYPE: '.$result['report_type']);
        $this->line('REPORT_HTTP: '.($result['report_http_status'] ?? '—'));
        $this->line('REPORT_LENGTH: '.$result['report_length']);
        $this->line('REPORT_ROWS: '.$result['report_rows']);
        $this->line('PARSED_PUNCHES: '.$result['parsed_punches']);
        $this->line('IN_RANGE_PUNCHES: '.$result['in_range_punches']);
        $this->line('SAVED: '.$result['saved']);
        $this->line('BYPASS_DB: '.$result['bypass_insert']);

        if ($result['error'] !== null) {
            $this->newLine();
            $this->error($result['error']);
        }

        $this->newLine();
        $this->line('Debug HTML: storage/app/biometric/debug_report.html');
        $this->line('Logs: search for REPORT_START / REPORT_RESPONSE / PARSER / punches_received');

        return $result['error'] === null && $result['parsed_punches'] > 0
            ? self::SUCCESS
            : self::FAILURE;
    }

    private function reportDeviceNotFound(string $requestedId): void
    {
        $devices = BiometricDevice::query()->orderBy('id')->get(['id', 'name', 'host']);

        if ($devices->isEmpty()) {
            $this->error("Device {$requestedId} not found. No biometric devices in this database.");
            $this->line('Add one in HRIS: Biometric attendance → Devices.');

            return;
        }

        $this->error("Device {$requestedId} not found. Available devices:");
        foreach ($devices as $available) {
            $this->line("  {$available->id} | {$available->name} | ".($available->host ?? '—'));
        }
        $this->line('Or run: php scripts/list-biometric-devices.php');
    }
}
