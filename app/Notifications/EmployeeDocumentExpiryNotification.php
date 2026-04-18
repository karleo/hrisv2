<?php

namespace App\Notifications;

use App\Models\EmployeeDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EmployeeDocumentExpiryNotification extends Notification
{
    use Queueable;

    public const STAGE_REMINDER = 'reminder_daily';

    public const STAGE_EXPIRED = 'expired_final';

    public function __construct(
        private readonly EmployeeDocument $document,
        private readonly string $route,
        private readonly string $stage = self::STAGE_REMINDER,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $documentName = $this->document->documentType?->name ?? $this->document->name;

        return [
            'request_code' => $documentName,
            'request_type' => 'employee_document_expiry',
            'request_date' => $this->document->expiry_date?->toDateString(),
            'route' => $this->route,
            'document_name' => $documentName,
            'expiry_date' => $this->document->expiry_date?->toDateString(),
            'document_notification_stage' => $this->stage,
            'document_status' => $this->document->status,
        ];
    }
}
