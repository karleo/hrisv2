<?php

namespace App\Providers;

use App\Contracts\FaceVerificationContract;
use App\Services\FaceVerification\FaceVerificationService;
use App\Services\Mail\MailSettingsManager;
use Carbon\CarbonImmutable;
use Illuminate\Mail\Events\MessageSending;
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

            return true;
        });
    }
}
