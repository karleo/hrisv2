<?php

namespace Tests\Feature\Notifications;

use App\Models\DocumentType;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Models\MailSetting;
use App\Models\RequestEmailLog;
use App\Models\User;
use App\Notifications\EmployeeDocumentExpiryNotification;
use App\Services\Mail\MailSettingsManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentExpiryEmailNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_document_expiry_notifications_use_database_channel_only_when_email_is_disabled(): void
    {
        MailSetting::query()->create([
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'document_expiry_email_enabled' => false,
            'document_expiry_notify_days' => 30,
            'mailer' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'disabled@example.com',
            'password' => 'secret-pass',
            'from_address' => 'no-reply@example.com',
            'from_name' => 'HRIS',
        ]);
        app(MailSettingsManager::class)->forgetCache();

        $document = $this->createEmployeeDocument();
        $notification = new EmployeeDocumentExpiryNotification($document, '/my-profile?tab=documents');
        $notifiable = User::factory()->create();

        $this->assertSame(['database'], $notification->via($notifiable));
        $this->assertDatabaseHas('request_email_logs', [
            'request_type' => 'employee_document_expiry',
            'request_id' => $document->id,
            'notification_type' => 'document_expiry',
            'status' => 'skipped',
            'reason' => 'document_expiry_email_disabled',
        ]);
    }

    public function test_document_expiry_notifications_include_mail_channel_when_email_is_enabled(): void
    {
        MailSetting::query()->create([
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'document_expiry_email_enabled' => true,
            'document_expiry_notify_days' => 30,
            'mailer' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'enabled@example.com',
            'password' => 'secret-pass',
            'from_address' => 'no-reply@example.com',
            'from_name' => 'HRIS',
        ]);
        app(MailSettingsManager::class)->forgetCache();

        $document = $this->createEmployeeDocument();
        $notification = new EmployeeDocumentExpiryNotification($document, '/my-profile?tab=documents');
        $notifiable = User::factory()->create();

        $this->assertSame(['database', 'mail'], $notification->via($notifiable));
        $this->assertSame(0, RequestEmailLog::query()->count());
    }

    public function test_document_expiry_notifications_use_database_channel_when_global_mail_is_disabled(): void
    {
        MailSetting::query()->create([
            'mail_enabled' => false,
            'workflow_email_enabled' => false,
            'document_expiry_email_enabled' => true,
            'document_expiry_notify_days' => 30,
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

        $document = $this->createEmployeeDocument();
        $notification = new EmployeeDocumentExpiryNotification($document, '/my-profile?tab=documents');
        $notifiable = User::factory()->create();

        $this->assertSame(['database'], $notification->via($notifiable));
        $this->assertDatabaseHas('request_email_logs', [
            'request_type' => 'employee_document_expiry',
            'request_id' => $document->id,
            'notification_type' => 'document_expiry',
            'status' => 'skipped',
            'reason' => 'mail_disabled',
        ]);
    }

    private function createEmployeeDocument(): EmployeeDocument
    {
        $employee = Employee::factory()->create();
        $documentType = DocumentType::factory()->create(['name' => 'Passport']);

        return EmployeeDocument::query()->create([
            'employee_id' => $employee->id,
            'document_type_id' => $documentType->id,
            'name' => 'Passport',
            'path' => 'employee-documents/passport.pdf',
            'original_name' => 'passport.pdf',
            'expiry_date' => now()->addDays(10)->toDateString(),
            'status' => EmployeeDocument::STATUS_ACTIVE,
            'version_number' => 1,
        ]);
    }
}
