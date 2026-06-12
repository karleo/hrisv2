<?php

namespace App\Services;

use App\Models\BiometricSetting;
use Illuminate\Support\Facades\Log;

class BiometricAttendanceSyncService
{
    public function __construct(
        private readonly ZktecoIclock990Client $client,
        private readonly BiometricPunchPairingService $pairingService
    ) {}

    /**
     * @return array{processed: int, skipped: int, fetched: int}
     */
    public function sync(?BiometricSetting $setting = null): array
    {
        $setting ??= BiometricSetting::current();

        if (! $setting->is_enabled) {
            return [
                'processed' => 0,
                'skipped' => 0,
                'fetched' => 0,
            ];
        }

        $punches = $this->client->fetchPunches($setting);
        $results = $this->pairingService->applyPunches($setting, $punches);

        $setting->forceFill([
            'last_polled_at' => now(),
            'last_log_cursor' => $punches === [] ? $setting->last_log_cursor : (string) end($punches)['log_id'],
        ])->save();

        Log::info('Biometric poll completed.', [
            'fetched' => count($punches),
            'processed' => $results['processed'],
            'skipped' => $results['skipped'],
        ]);

        return [
            'processed' => $results['processed'],
            'skipped' => $results['skipped'],
            'fetched' => count($punches),
        ];
    }
}
