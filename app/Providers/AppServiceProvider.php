<?php

namespace App\Providers;

use App\Contracts\FaceVerificationContract;
use App\Notifications\RequestSubmittedNotification;
use App\Services\FaceVerification\FaceVerificationService;
use App\Services\Mail\GraphMailSender;
use App\Services\Mail\MailSettingsManager;
use App\Support\EmployeePresence\EmployeePresenceOnlineData;
use App\Support\RequestEmailLogger;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(FaceVerificationContract::class, FaceVerificationService::class);
        $this->app->singleton(MailSettingsManager::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        Event::listen(Logout::class, function (Logout $event): void {
            EmployeePresenceOnlineData::forgetAppPresenceForUser($event->user);
        });

        Event::listen(Login::class, function (Login $event): void {
            EmployeePresenceOnlineData::forgetAppPresenceForUser($event->user);
        });

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );

        Event::listen(MessageSending::class, function (MessageSending $event): bool {
            /** @var MailSettingsManager $mailSettings */
            $mailSettings = app(MailSettingsManager::class);
            $resolved = $mailSettings->applyLatest();

            if (($resolved['mail_enabled'] ?? true) === false) {
                Log::info('mail.delivery.skipped_disabled', [
                    'mailer_source' => $resolved['source'] ?? 'unknown',
                    'subject' => $event->message->getSubject(),
                    'to' => array_keys($event->message->getTo() ?? []),
                ]);

                return false;
            }

            if (($resolved['transport_mode'] ?? 'smtp') === 'graph') {
                /** @var GraphMailSender $graphMailSender */
                $graphMailSender = app(GraphMailSender::class);
                $graphConfig = $mailSettings->graphConfig();
                if (! is_array($graphConfig)) {
                    Log::warning('mail.graph.skipped_missing_config');

                    return false;
                }

                $graphMailSender->send($event->message, $graphConfig);

                return false;
            }

            return true;
        });

        Event::listen(NotificationSent::class, function (NotificationSent $event): void {
            if ($event->channel !== 'mail') {
                return;
            }

            $payload = RequestEmailLogger::payloadFromNotification($event->notification);
            if (! is_array($payload)) {
                return;
            }

            $recipientEmail = (string) ($event->notifiable->email ?? '');
            if ($recipientEmail === '') {
                return;
            }

            RequestEmailLogger::sent(
                $payload,
                $recipientEmail,
                $event->notification instanceof RequestSubmittedNotification ? 'request_submitted' : 'request_decision',
                $event->channel
            );
        });

        Event::listen(NotificationFailed::class, function (NotificationFailed $event): void {
            if ($event->channel !== 'mail') {
                return;
            }

            $payload = RequestEmailLogger::payloadFromNotification($event->notification);
            if (! is_array($payload)) {
                return;
            }

            $recipientEmail = (string) ($event->notifiable->email ?? '');
            if ($recipientEmail === '') {
                return;
            }

            $exception = $event->data['exception'] ?? null;
            $errorMessage = $exception instanceof \Throwable ? $exception->getMessage() : null;

            RequestEmailLogger::failed(
                $payload,
                $recipientEmail,
                $event->notification instanceof RequestSubmittedNotification ? 'request_submitted' : 'request_decision',
                $event->channel,
                $errorMessage
            );
        });
    }
}
