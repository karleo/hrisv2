<?php

namespace App\Notifications;

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
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->line('A request has been submitted.')
            ->line($this->payload['request_code']);
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
