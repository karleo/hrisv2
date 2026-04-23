<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\SmtpUpdateRequest;
use App\Http\Requests\Settings\TestSmtpConnectionRequest;
use App\Models\MailSetting;
use App\Services\Mail\MailSettingsManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SmtpController extends Controller
{
    /**
     * @var array<string, array<string, mixed>>
     */
    private const PRESETS = [
        'custom' => [
            'label' => 'Custom SMTP',
            'host' => '',
            'port' => 587,
            'encryption' => 'tls',
            'notes' => 'Use settings provided by your email provider.',
        ],
        'gmail' => [
            'label' => 'Gmail',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'notes' => 'Use an App Password with 2FA enabled. SSL on port 465 is also supported.',
        ],
        'microsoft365' => [
            'label' => 'Microsoft 365 (Outlook)',
            'host' => 'smtp.office365.com',
            'port' => 587,
            'encryption' => 'tls',
            'notes' => 'Modern authentication policies may require SMTP AUTH to be enabled.',
        ],
        'zoho' => [
            'label' => 'Zoho Mail',
            'host' => 'smtp.zoho.com',
            'port' => 587,
            'encryption' => 'tls',
            'notes' => 'For org domains, use your region-specific SMTP host if required.',
        ],
        'yahoo' => [
            'label' => 'Yahoo Mail',
            'host' => 'smtp.mail.yahoo.com',
            'port' => 465,
            'encryption' => 'ssl',
            'notes' => 'Use an app password for third-party SMTP clients.',
        ],
        'aws_ses' => [
            'label' => 'AWS SES SMTP',
            'host' => 'email-smtp.us-east-1.amazonaws.com',
            'port' => 587,
            'encryption' => 'tls',
            'notes' => 'Replace host with your SES region endpoint and use SES SMTP credentials.',
        ],
    ];

    public function edit(Request $request, MailSettingsManager $mailSettingsManager): Response
    {
        $this->ensureAdministrator($request);

        $settings = MailSetting::singleton();
        $resolved = $mailSettingsManager->resolved();

        return Inertia::render('settings/smtp', [
            'settings' => [
                'mail_enabled' => $settings?->mail_enabled ?? true,
                'workflow_email_enabled' => $settings?->workflow_email_enabled ?? false,
                'provider_preset' => $settings?->provider_preset ?? 'custom',
                'host' => $settings?->host ?? (string) config('mail.mailers.smtp.host'),
                'port' => $settings?->port ?? (int) config('mail.mailers.smtp.port'),
                'encryption' => $settings?->encryption,
                'username' => $settings?->username,
                'timeout' => $settings?->timeout,
                'from_address' => $settings?->from_address ?? (string) config('mail.from.address'),
                'from_name' => $settings?->from_name ?? (string) config('mail.from.name'),
                'has_password' => $settings?->hasStoredPassword() ?? false,
                'last_tested_at' => $settings?->last_tested_at?->toIso8601String(),
                'last_test_status' => $settings?->last_test_status,
                'last_test_message' => $settings?->safeLastTestMessage(),
                'source' => $resolved['source'] ?? 'env',
            ],
            'presets' => self::PRESETS,
            'refreshInstructions' => [
                'Restart queue workers after SMTP changes if workers are long-running.',
                'If config is cached in production, run `php artisan config:clear` after deployment updates.',
            ],
        ]);
    }

    public function update(SmtpUpdateRequest $request, MailSettingsManager $mailSettingsManager): RedirectResponse
    {
        $this->ensureAdministrator($request);

        $validated = $request->validated();

        $settings = MailSetting::singletonOrCreate([
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'mailer' => 'smtp',
        ]);

        $settings->fill([
            'mail_enabled' => (bool) $validated['mail_enabled'],
            'workflow_email_enabled' => (bool) $validated['workflow_email_enabled'],
            'mailer' => 'smtp',
            'provider_preset' => $validated['provider_preset'] ?? 'custom',
            'host' => $validated['host'],
            'port' => (int) $validated['port'],
            'encryption' => $validated['encryption'] ?? null,
            'username' => $validated['username'] ?: null,
            'timeout' => isset($validated['timeout']) ? (int) $validated['timeout'] : null,
            'from_address' => $validated['from_address'],
            'from_name' => $validated['from_name'],
            'updated_by' => $request->user()->id,
        ]);

        if (array_key_exists('password', $validated) && is_string($validated['password']) && $validated['password'] !== '') {
            $settings->password = $validated['password'];
        }

        $settings->save();

        $mailSettingsManager->forgetCache();
        $mailSettingsManager->applyLatest();

        return to_route('smtp.edit')->with('success', 'SMTP settings updated successfully.');
    }

    public function test(TestSmtpConnectionRequest $request, MailSettingsManager $mailSettingsManager): RedirectResponse
    {
        $this->ensureAdministrator($request);

        $validated = $request->validated();
        $testAddress = (string) $validated['test_email'];

        $settings = MailSetting::singletonOrCreate([
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'mailer' => 'smtp',
        ]);

        if (! array_key_exists('password', $validated) || ! is_string($validated['password']) || $validated['password'] === '') {
            $validated['password'] = $settings->password;
        }

        try {
            $resolved = $mailSettingsManager->applyOverride($validated);
            if (($resolved['mail_enabled'] ?? true) === false) {
                throw new \RuntimeException('Mail is disabled. Enable mail before sending a test email.');
            }

            Mail::raw(
                'SMTP connection test message from '.config('app.name').'. If you received this, SMTP is configured correctly.',
                function ($message) use ($testAddress): void {
                    $message->to($testAddress)->subject('SMTP Test Email');
                }
            );

            $settings->forceFill([
                'last_tested_at' => Carbon::now(),
                'last_test_status' => 'success',
                'last_test_message' => 'Connection successful.',
                'updated_by' => $request->user()->id,
            ])->save();

            Log::info('mail.smtp_test.success', [
                'user_id' => $request->user()->id,
                'target' => $testAddress,
            ]);

            $mailSettingsManager->forgetCache();
            $mailSettingsManager->applyLatest();

            return to_route('smtp.edit')->with('success', 'Test email sent successfully.');
        } catch (Throwable $exception) {
            $settings->forceFill([
                'last_tested_at' => Carbon::now(),
                'last_test_status' => 'failed',
                'last_test_message' => mb_substr($exception->getMessage(), 0, 500),
                'updated_by' => $request->user()->id,
            ])->save();

            Log::warning('mail.smtp_test.failed', [
                'user_id' => $request->user()->id,
                'target' => $testAddress,
                'error' => $exception->getMessage(),
            ]);

            $mailSettingsManager->forgetCache();
            $mailSettingsManager->applyLatest();

            return to_route('smtp.edit')->withErrors([
                'test_email' => 'SMTP test failed: '.$exception->getMessage(),
            ]);
        }
    }

    private function ensureAdministrator(Request $request): void
    {
        $user = $request->user();

        if ($user === null || ! $user->isAdministrator()) {
            abort(403);
        }
    }
}
