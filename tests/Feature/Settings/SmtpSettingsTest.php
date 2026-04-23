<?php

namespace Tests\Feature\Settings;

use App\Models\MailSetting;
use App\Models\Role;
use App\Models\User;
use App\Services\Mail\MailSettingsManager;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SmtpSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_smtp_settings_page_requires_administrator(): void
    {
        $basicRoleId = Role::query()->where('slug', 'basic')->value('id');
        $user = User::factory()->create([
            'role_id' => $basicRoleId,
        ]);

        $this->actingAs($user)
            ->get(route('smtp.edit'))
            ->assertForbidden();
    }

    public function test_smtp_settings_update_encrypts_password_and_never_exposes_raw_password(): void
    {
        $admin = User::factory()->create();

        $response = $this->actingAs($admin)->put(route('smtp.update'), [
            'mail_enabled' => true,
            'workflow_email_enabled' => true,
            'provider_preset' => 'gmail',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'test@gmail.com',
            'password' => 'plain-secret-password',
            'timeout' => 30,
            'from_address' => 'no-reply@example.com',
            'from_name' => 'HRIS',
        ]);

        $response->assertRedirect(route('smtp.edit'));

        $row = MailSetting::query()->firstOrFail();
        $this->assertNotSame('plain-secret-password', $row->getRawOriginal('password'));
        $this->assertSame('plain-secret-password', $row->password);
        $this->assertTrue($row->workflow_email_enabled);

        $page = $this->actingAs($admin)->get(route('smtp.edit'));
        $page->assertOk();
        $page->assertInertia(fn (Assert $inertia) => $inertia
            ->where('settings.has_password', true)
            ->missing('settings.password')
        );
    }

    public function test_mail_settings_manager_falls_back_to_env_when_db_configuration_is_invalid(): void
    {
        config([
            'mail.default' => 'log',
            'mail.mailers.smtp.host' => '127.0.0.1',
            'mail.mailers.smtp.port' => 2525,
            'mail.from.address' => 'fallback@example.com',
            'mail.from.name' => 'Fallback Mailer',
        ]);

        MailSetting::query()->create([
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'mailer' => 'smtp',
            'host' => null,
            'port' => null,
            'from_address' => null,
            'from_name' => null,
        ]);

        /** @var MailSettingsManager $manager */
        $manager = app(MailSettingsManager::class);
        $resolved = $manager->resolved();

        $this->assertSame('env', $resolved['source']);
        $this->assertSame('127.0.0.1', $resolved['mail']['mailers']['smtp']['host']);
        $this->assertTrue($resolved['mail_enabled']);
        $this->assertFalse($resolved['workflow_email_enabled']);
    }

    public function test_mail_enabled_toggle_prevents_sync_and_queued_mail_paths(): void
    {
        Log::spy();
        config(['queue.default' => 'sync']);

        MailSetting::query()->create([
            'mail_enabled' => false,
            'workflow_email_enabled' => true,
            'mailer' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'queue@example.com',
            'password' => 'secret',
            'from_address' => 'no-reply@example.com',
            'from_name' => 'HRIS',
        ]);

        Mail::raw('sync test', function ($message): void {
            $message->to('sync@example.com')->subject('Sync');
        });

        NotificationFacade::route('mail', 'queue@example.com')
            ->notify(new class extends Notification implements ShouldQueue
            {
                public function via(object $notifiable): array
                {
                    return ['mail'];
                }

                public function toMail(object $notifiable): MailMessage
                {
                    return (new MailMessage)
                        ->subject('Queued test')
                        ->line('Queue mail path check.');
                }
            });

        Log::shouldHaveReceived('info')
            ->withArgs(function (string $message, array $context): bool {
                return $message === 'mail.delivery.skipped_disabled'
                    && in_array('sync@example.com', $context['to'] ?? [], true);
            })
            ->once();

        Log::shouldHaveReceived('info')
            ->withArgs(function (string $message, array $context): bool {
                return $message === 'mail.delivery.skipped_disabled'
                    && in_array('queue@example.com', $context['to'] ?? [], true);
            })
            ->once();
    }

    public function test_test_email_endpoint_uses_unsaved_payload_immediately_and_updates_last_test_status(): void
    {
        $admin = User::factory()->create();

        MailSetting::query()->create([
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'mailer' => 'smtp',
            'provider_preset' => 'gmail',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'stored@example.com',
            'password' => 'stored-pass',
            'from_address' => 'stored@example.com',
            'from_name' => 'Stored',
        ]);

        $response = $this->actingAs($admin)->post(route('smtp.test'), [
            'mail_enabled' => false,
            'workflow_email_enabled' => false,
            'provider_preset' => 'gmail',
            'host' => 'smtp.office365.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'draft@example.com',
            'password' => 'draft-pass',
            'timeout' => 1,
            'from_address' => 'draft@example.com',
            'from_name' => 'Draft',
            'test_email' => 'recipient@example.com',
        ]);

        $response->assertSessionHasErrors('test_email');

        $setting = MailSetting::query()->firstOrFail();
        $this->assertSame('failed', $setting->last_test_status);
        $this->assertNotNull($setting->last_tested_at);
        $this->assertStringContainsString('Mail is disabled', (string) $setting->last_test_message);
        $this->assertSame('smtp.gmail.com', $setting->host);
    }

    public function test_test_email_endpoint_is_rate_limited(): void
    {
        $admin = User::factory()->create();

        $payload = [
            'mail_enabled' => false,
            'workflow_email_enabled' => false,
            'provider_preset' => 'custom',
            'host' => 'smtp.example.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'rate@example.com',
            'password' => 'rate-pass',
            'timeout' => 1,
            'from_address' => 'rate@example.com',
            'from_name' => 'Rate',
            'test_email' => 'recipient@example.com',
        ];

        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($admin)->post(route('smtp.test'), $payload)->assertSessionHasErrors('test_email');
        }

        $this->actingAs($admin)
            ->post(route('smtp.test'), $payload)
            ->assertTooManyRequests();
    }

    public function test_workflow_email_toggle_defaults_to_false_when_not_set(): void
    {
        MailSetting::query()->create([
            'mail_enabled' => true,
            'mailer' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'default@example.com',
            'password' => 'default-pass',
            'from_address' => 'default@example.com',
            'from_name' => 'Default',
        ]);

        /** @var MailSettingsManager $manager */
        $manager = app(MailSettingsManager::class);

        $this->assertFalse($manager->isWorkflowEmailEnabled());
    }
}
