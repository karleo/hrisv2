<?php

namespace Tests\Feature\Notifications;

use App\Models\MailSetting;
use App\Models\RequestEmailLog;
use App\Models\User;
use App\Notifications\RequestDecisionNotification;
use App\Notifications\RequestSubmittedNotification;
use App\Services\Mail\MailSettingsManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkflowEmailNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_request_notifications_use_database_channel_only_when_workflow_email_is_disabled(): void
    {
        MailSetting::query()->create([
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'mailer' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'workflow-disabled@example.com',
            'password' => 'secret-pass',
            'from_address' => 'no-reply@example.com',
            'from_name' => 'HRIS',
        ]);
        app(MailSettingsManager::class)->forgetCache();

        $submittedNotification = new RequestSubmittedNotification([
            'request_type' => 'leave_request',
            'request_id' => 1,
            'request_code' => 'LR-1001',
            'request_date' => '2026-04-23',
            'submitted_by' => 'Test Employee',
            'route' => 'https://example.com/leave-requests/1',
        ]);

        $decisionNotification = new RequestDecisionNotification([
            'request_type' => 'leave_request',
            'request_id' => 1,
            'request_code' => 'LR-1001',
            'request_date' => '2026-04-23',
            'decision' => 'approved',
            'remarks' => null,
            'decided_at' => now()->toDateTimeString(),
            'route' => 'https://example.com/leave-requests/1',
            'employee_photo_url' => null,
        ]);

        $notifiable = User::factory()->create();

        $this->assertSame(['database'], $submittedNotification->via($notifiable));
        $this->assertSame(['database'], $decisionNotification->via($notifiable));
        $this->assertDatabaseCount('request_email_logs', 2);
        $this->assertDatabaseHas('request_email_logs', [
            'request_type' => 'leave_request',
            'request_id' => 1,
            'notification_type' => 'request_submitted',
            'status' => 'skipped',
            'reason' => 'workflow_email_disabled',
        ]);
    }

    public function test_request_notifications_include_mail_channel_when_workflow_email_is_enabled(): void
    {
        MailSetting::query()->create([
            'mail_enabled' => true,
            'workflow_email_enabled' => true,
            'mailer' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'workflow-enabled@example.com',
            'password' => 'secret-pass',
            'from_address' => 'no-reply@example.com',
            'from_name' => 'HRIS',
        ]);
        app(MailSettingsManager::class)->forgetCache();

        $submittedNotification = new RequestSubmittedNotification([
            'request_type' => 'it_request',
            'request_id' => 7,
            'request_code' => 'IT-2007',
            'request_date' => '2026-04-23',
            'submitted_by' => 'Test Employee',
            'route' => 'https://example.com/it-requests/7',
        ]);

        $decisionNotification = new RequestDecisionNotification([
            'request_type' => 'it_request',
            'request_id' => 7,
            'request_code' => 'IT-2007',
            'request_date' => '2026-04-23',
            'decision' => 'rejected',
            'remarks' => 'Insufficient information',
            'decided_at' => now()->toDateTimeString(),
            'route' => 'https://example.com/it-requests/7',
            'employee_photo_url' => null,
        ]);

        $notifiable = User::factory()->create();

        $this->assertSame(['database', 'mail'], $submittedNotification->via($notifiable));
        $this->assertSame(['database', 'mail'], $decisionNotification->via($notifiable));
        $this->assertSame(0, RequestEmailLog::query()->count());
    }

    public function test_request_notifications_use_database_channel_when_global_mail_is_disabled(): void
    {
        MailSetting::query()->create([
            'mail_enabled' => false,
            'workflow_email_enabled' => true,
            'mailer' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'global-disabled@example.com',
            'password' => 'secret-pass',
            'from_address' => 'no-reply@example.com',
            'from_name' => 'HRIS',
        ]);
        app(MailSettingsManager::class)->forgetCache();

        $submittedNotification = new RequestSubmittedNotification([
            'request_type' => 'it_asset_request',
            'request_id' => 18,
            'request_code' => 'ITA-0018',
            'request_date' => '2026-04-24',
            'submitted_by' => 'Test Employee',
            'route' => 'https://example.com/it-asset-requests/18',
        ]);

        $notifiable = User::factory()->create();
        $this->assertSame(['database'], $submittedNotification->via($notifiable));
        $this->assertDatabaseHas('request_email_logs', [
            'request_type' => 'it_asset_request',
            'request_id' => 18,
            'notification_type' => 'request_submitted',
            'status' => 'skipped',
            'reason' => 'mail_disabled',
        ]);
    }
}
