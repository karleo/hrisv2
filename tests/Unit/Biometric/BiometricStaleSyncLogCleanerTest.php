<?php

namespace Tests\Unit\Biometric;

use App\Enums\BiometricSyncStatus;
use App\Enums\BiometricSyncType;
use App\Models\BiometricDevice;
use App\Models\BiometricSyncLog;
use App\Services\Biometric\BiometricStaleSyncLogCleaner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BiometricStaleSyncLogCleanerTest extends TestCase
{
    use RefreshDatabase;

    public function test_marks_timed_out_running_logs_as_failed(): void
    {
        config(['biometric.sync_stale_minutes' => 5]);

        $device = BiometricDevice::query()->create([
            'name' => 'Gate',
            'serial_number' => 'SN-STALE-1',
            'is_active' => true,
        ]);

        $log = BiometricSyncLog::query()->create([
            'biometric_device_id' => $device->id,
            'sync_type' => BiometricSyncType::Manual,
            'status' => BiometricSyncStatus::Running,
            'started_at' => now()->subMinutes(10),
        ]);

        $count = app(BiometricStaleSyncLogCleaner::class)->markTimedOutRunningLogs();

        $this->assertSame(1, $count);
        $this->assertSame(BiometricSyncStatus::Failed, $log->fresh()->status);
    }

    public function test_supersedes_running_logs_when_new_import_starts(): void
    {
        $device = BiometricDevice::query()->create([
            'name' => 'Gate',
            'serial_number' => 'SN-SUPER-1',
            'is_active' => true,
        ]);

        $log = BiometricSyncLog::query()->create([
            'biometric_device_id' => $device->id,
            'sync_type' => BiometricSyncType::Manual,
            'status' => BiometricSyncStatus::Running,
            'started_at' => now(),
        ]);

        app(BiometricStaleSyncLogCleaner::class)->supersedeRunningLogsForDevice($device->id);

        $this->assertSame(BiometricSyncStatus::Failed, $log->fresh()->status);
    }
}
