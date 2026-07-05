<?php

namespace App\Notifications;

use App\Models\EmployeeDocument;
use App\Services\Mail\MailSettingsManager;
use App\Support\RequestEmailLogger;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
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
        $channels = ['database'];
        $mailSettings = app(MailSettingsManager::class);
        $recipientEmail = (string) ($notifiable->email ?? '');

        if (! $mailSettings->isDocumentExpiryEmailEnabled()) {
            if ($recipientEmail !== '') {
                RequestEmailLogger::skipped($this->payload(), $recipientEmail, 'document_expiry', 'document_expiry_email_disabled');
            }

            return $channels;
        }

        if (! $mailSettings->isMailEnabled()) {
            if ($recipientEmail !== '') {
                RequestEmailLogger::skipped($this->payload(), $recipientEmail, 'document_expiry', 'mail_disabled');
            }

            return $channels;
        }

        if ($recipientEmail !== '') {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $documentName = $this->document->documentType?->name ?? $this->document->name;
        $employeeName = trim(($this->document->employee?->first_name ?? '').' '.($this->document->employee?->last_name ?? ''));
        $expiryDate = $this->document->expiry_date?->format('d/m/Y') ?? 'Unknown';
        $actionUrl = str_starts_with($this->route, 'http') ? $this->route : url($this->route);

        if ($this->stage === self::STAGE_EXPIRED) {
            return (new MailMessage)
                ->subject('Document expired: '.$documentName)
                ->line('The '.$documentName.' document'.($employeeName !== '' ? ' for '.$employeeName : '').' has expired.')
                ->line('Expiry date: '.$expiryDate)
                ->action('View documents', $actionUrl);
        }

        return (new MailMessage)
            ->subject('Document expiring soon: '.$documentName)
            ->line('The '.$documentName.' document'.($employeeName !== '' ? ' for '.$employeeName : '').' is expiring soon.')
            ->line('Expiry date: '.$expiryDate)
            ->action('View documents', $actionUrl);
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

    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        $documentName = $this->document->documentType?->name ?? $this->document->name;

        return [
            'request_type' => 'employee_document_expiry',
            'request_id' => $this->document->id,
            'request_code' => $documentName,
            'request_date' => $this->document->expiry_date?->toDateString(),
            'route' => $this->route,
            'document_name' => $documentName,
            'expiry_date' => $this->document->expiry_date?->toDateString(),
            'document_notification_stage' => $this->stage,
            'document_status' => $this->document->status,
        ];
    }
}
