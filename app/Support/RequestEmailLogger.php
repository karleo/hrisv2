<?php

namespace App\Support;

use App\Models\RequestEmailLog;
use App\Notifications\RequestDecisionNotification;
use App\Notifications\RequestSubmittedNotification;

final class RequestEmailLogger
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public static function skipped(array $payload, string $recipientEmail, string $notificationType, string $reason): void
    {
        self::write($payload, $recipientEmail, $notificationType, 'mail', 'skipped', $reason, null);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function sent(array $payload, string $recipientEmail, string $notificationType, string $channel): void
    {
        self::write($payload, $recipientEmail, $notificationType, $channel, 'sent', null, null);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function failed(
        array $payload,
        string $recipientEmail,
        string $notificationType,
        string $channel,
        ?string $errorMessage,
    ): void {
        self::write($payload, $recipientEmail, $notificationType, $channel, 'failed', null, $errorMessage);
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function payloadFromNotification(object $notification): ?array
    {
        if ($notification instanceof RequestSubmittedNotification || $notification instanceof RequestDecisionNotification) {
            return $notification->payload();
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private static function write(
        array $payload,
        string $recipientEmail,
        string $notificationType,
        string $channel,
        string $status,
        ?string $reason,
        ?string $errorMessage,
    ): void {
        $requestType = $payload['request_type'] ?? null;
        $requestId = $payload['request_id'] ?? null;
        if (! is_string($requestType) || $requestType === '' || ! is_numeric($requestId)) {
            return;
        }

        RequestEmailLog::query()->create([
            'request_type' => $requestType,
            'request_id' => (int) $requestId,
            'notification_type' => $notificationType,
            'recipient_email' => $recipientEmail,
            'channel' => $channel,
            'status' => $status,
            'reason' => $reason,
            'error_message' => $errorMessage,
            'performed_at' => now(),
        ]);
    }
}
