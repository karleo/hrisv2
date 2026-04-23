<?php

namespace App\Notifications;

use App\Services\Mail\MailSettingsManager;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RequestDecisionNotification extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $payload  Prefer {@see \App\Support\RequestDecisionNotificationPayload::make()}
     */
    public function __construct(private readonly array $payload) {}

    /**
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

    public function toMail(object $notifiable): MailMessage
    {
        $decision = (string) ($this->payload['decision'] ?? '');
        $requestCode = (string) ($this->payload['request_code'] ?? '');
        $requestType = str_replace('_', ' ', (string) ($this->payload['request_type'] ?? 'request'));
        $route = (string) ($this->payload['route'] ?? url('/'));
        $isApproved = $decision === 'approved';

        return (new MailMessage)
            ->subject('Request '.$requestCode.' '.($isApproved ? 'approved' : 'rejected'))
            ->line('Your '.$requestType.' ('.$requestCode.') has been '.($isApproved ? 'approved' : 'rejected').'.')
            ->line((string) ($this->payload['remarks'] ?? '') !== '' ? 'Remarks: '.(string) $this->payload['remarks'] : 'No remarks were provided.')
            ->action('View request', $route);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->payload;
    }
}
