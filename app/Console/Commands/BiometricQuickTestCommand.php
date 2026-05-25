<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class BiometricQuickTestCommand extends Command
{
    protected $signature = 'biometric
                            {device=12 : Device ID}
                            {--force-no-session : Login without requiring SessionID on GET /}';

    protected $description = 'Quick iClock web login test (alias: skips SessionID if --force-no-session)';

    public function handle(): int
    {
        return $this->call('biometric:test-device-web', [
            'device' => $this->argument('device'),
            '--force-no-session' => $this->option('force-no-session'),
        ]);
    }
}
