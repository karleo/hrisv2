<?php

namespace App\Services\Biometric;

use Illuminate\Support\Facades\Cache;

final class BiometricRelayStatusStore
{
    private const string CACHE_KEY = 'biometric.relay.status';

    /**
     * @return array{
     *     last_relay_at: ?string,
     *     last_successful_upload_at: ?string,
     *     pending_retries: int,
     *     status: string,
     *     serial_number: ?string,
     *     punches_pulled: int,
     *     punches_relayed: int,
     *     failures: int,
     *     watermark: ?string,
     *     updated_at: ?string
     * }
     */
    public function get(): array
    {
        $cached = Cache::get(self::CACHE_KEY);

        if (! is_array($cached)) {
            return $this->empty();
        }

        return array_merge($this->empty(), $cached);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *     last_relay_at: ?string,
     *     last_successful_upload_at: ?string,
     *     pending_retries: int,
     *     status: string,
     *     serial_number: ?string,
     *     punches_pulled: int,
     *     punches_relayed: int,
     *     failures: int,
     *     watermark: ?string,
     *     updated_at: ?string
     * }
     */
    public function put(array $payload): array
    {
        $current = $this->get();

        $status = [
            'last_relay_at' => isset($payload['last_relay_at']) && is_string($payload['last_relay_at'])
                ? $payload['last_relay_at']
                : $current['last_relay_at'],
            'last_successful_upload_at' => array_key_exists('last_successful_upload_at', $payload)
                ? (is_string($payload['last_successful_upload_at']) ? $payload['last_successful_upload_at'] : null)
                : $current['last_successful_upload_at'],
            'pending_retries' => isset($payload['pending_retries'])
                ? (int) $payload['pending_retries']
                : $current['pending_retries'],
            'status' => isset($payload['status']) && is_string($payload['status'])
                ? $payload['status']
                : $current['status'],
            'serial_number' => isset($payload['serial_number']) && is_string($payload['serial_number'])
                ? $payload['serial_number']
                : $current['serial_number'],
            'punches_pulled' => isset($payload['punches_pulled'])
                ? (int) $payload['punches_pulled']
                : $current['punches_pulled'],
            'punches_relayed' => isset($payload['punches_relayed'])
                ? (int) $payload['punches_relayed']
                : $current['punches_relayed'],
            'failures' => isset($payload['failures'])
                ? (int) $payload['failures']
                : $current['failures'],
            'watermark' => isset($payload['watermark']) && is_string($payload['watermark'])
                ? $payload['watermark']
                : $current['watermark'],
            'updated_at' => now()->toIso8601String(),
        ];

        Cache::forever(self::CACHE_KEY, $status);

        return $status;
    }

    /**
     * @return array{
     *     last_relay_at: ?string,
     *     last_successful_upload_at: ?string,
     *     pending_retries: int,
     *     status: string,
     *     serial_number: ?string,
     *     punches_pulled: int,
     *     punches_relayed: int,
     *     failures: int,
     *     watermark: ?string,
     *     updated_at: ?string
     * }
     */
    private function empty(): array
    {
        return [
            'last_relay_at' => null,
            'last_successful_upload_at' => null,
            'pending_retries' => 0,
            'status' => 'unknown',
            'serial_number' => null,
            'punches_pulled' => 0,
            'punches_relayed' => 0,
            'failures' => 0,
            'watermark' => null,
            'updated_at' => null,
        ];
    }
}
