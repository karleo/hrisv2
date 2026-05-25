<?php

namespace App\Services\Biometric;

use App\Enums\BiometricSyncStatus;
use App\Models\BiometricSyncLog;

final class BiometricStaleSyncLogCleaner
{
    public function markTimedOutRunningLogs(): int
    {
        return BiometricSyncLog::query()
            ->where('status', BiometricSyncStatus::Running)
            ->where('started_at', '<', now()->subMinutes(config('biometric.sync_stale_minutes', 5)))
            ->update([
                'status' => BiometricSyncStatus::Failed,
                'finished_at' => now(),
                'error_message' => 'Import did not finish (background worker on Laragon may not have run). For ADMS: confirm the terminal pushes to HRIS (Raw punches), then use Import attendance again.',
            ]);
    }

    public function supersedeRunningLogsForDevice(int $deviceId): int
    {
        return BiometricSyncLog::query()
            ->where('biometric_device_id', $deviceId)
            ->where('status', BiometricSyncStatus::Running)
            ->update([
                'status' => BiometricSyncStatus::Failed,
                'finished_at' => now(),
                'error_message' => 'Stopped because a new import was started.',
            ]);
    }
}
