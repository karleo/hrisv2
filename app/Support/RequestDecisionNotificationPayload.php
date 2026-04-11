<?php

namespace App\Support;

use DateTimeInterface;

final class RequestDecisionNotificationPayload
{
    /**
     * Normalized payload for {@see \App\Notifications\RequestDecisionNotification} (database channel).
     * The SPA reads `decision` and `request_type` to show “Approved” / “Rejected” for the employee.
     *
     * @param  'leave_request'|'employee_request'|'it_request'|'it_asset_request'  $requestType
     * @param  'approved'|'rejected'  $decision
     * @return array{
     *     request_type: string,
     *     request_id: int,
     *     request_code: string,
     *     request_date: string,
     *     decision: string,
     *     remarks: string|null,
     *     decided_at: string|null,
     *     route: string,
     *     employee_photo_url: string|null
     * }
     */
    public static function make(
        string $requestType,
        int $requestId,
        string $requestCode,
        string $requestDate,
        string $decision,
        ?string $remarks,
        ?DateTimeInterface $decidedAt,
        string $route,
        ?string $employeePhotoUrl = null,
    ): array {
        return [
            'request_type' => $requestType,
            'request_id' => $requestId,
            'request_code' => $requestCode,
            'request_date' => $requestDate,
            'decision' => $decision,
            'remarks' => $remarks,
            'decided_at' => $decidedAt?->format('Y-m-d H:i:s'),
            'route' => $route,
            'employee_photo_url' => $employeePhotoUrl,
        ];
    }
}
