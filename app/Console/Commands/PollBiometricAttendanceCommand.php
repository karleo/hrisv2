<?php

namespace App\Console\Commands;

use App\Models\BiometricSetting;
use App\Services\BiometricAttendanceSyncService;
use Illuminate\Console\Command;
use Throwable;

class PollBiometricAttendanceCommand extends Command
{
    protected $signature = 'attendance:poll-biometric';

    protected $description = 'Poll biometric device and update attendance entries.';

    public function handle(BiometricAttendanceSyncService $syncService): int
    {
        $settings = BiometricSetting::current();
        if (! $settings->is_enabled) {
            $this->info('Biometric polling is disabled.');

            return self::SUCCESS;
        }

        try {
            $result = $syncService->sync($settings);
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info(sprintf(
            'Done. fetched=%d processed=%d skipped=%d',
            $result['fetched'],
            $result['processed'],
            $result['skipped']
        ));

        return self::SUCCESS;
    }
}
