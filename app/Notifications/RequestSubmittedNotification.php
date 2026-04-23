<?php

namespace App\Notifications;

use App\Services\Mail\MailSettingsManager;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RequestSubmittedNotification extends Notification
{
    use Queueable;

    /**
     * @param  array{
     *   request_type: string,
     *   request_id: int,
     *   request_code: string,
     *   request_date?: string,
     *   submitted_by: string,
     *   route: string,
     *   employee_photo_url?: string|null
     * }  $payload
     */
    public function __construct(private readonly array $payload) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (app(MailSettingsManager::class)->isWorkflowEmailEnabled()) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $requestType = (string) ($this->payload['request_type'] ?? 'request');
        $requestCode = (string) ($this->payload['request_code'] ?? '');
        $submittedBy = (string) ($this->payload['submitted_by'] ?? 'An employee');
        $route = (string) ($this->payload['route'] ?? url('/'));

        return (new MailMessage)
            ->subject('New '.$requestCode.' submitted for approval')
            ->line($submittedBy.' submitted a '.str_replace('_', ' ', $requestType).'.')
            ->line('Request code: '.$requestCode)
            ->action('Review request', $route);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->payload;
    }
}
