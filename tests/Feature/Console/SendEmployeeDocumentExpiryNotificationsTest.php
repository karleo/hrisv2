<?php

namespace Tests\Feature\Console;

use App\Models\DocumentType;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Models\EmployeeDocumentExpiryNotificationLog;
use App\Models\MailSetting;
use App\Models\Role;
use App\Models\User;
use App\Services\Mail\MailSettingsManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class SendEmployeeDocumentExpiryNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_uses_configured_notify_days_window(): void
    {
        Carbon::setTestNow('2026-07-05');

        MailSetting::query()->create([
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'document_expiry_email_enabled' => false,
            'document_expiry_notify_days' => 14,
            'mailer' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'notify@example.com',
            'password' => 'secret-pass',
            'from_address' => 'no-reply@example.com',
            'from_name' => 'HRIS',
        ]);
        app(MailSettingsManager::class)->forgetCache();

        $this->createHrUser();
        $employee = Employee::factory()->create();
        $documentType = DocumentType::factory()->create(['name' => 'Visa']);

        $insideWindow = $this->createDocument($employee, $documentType, '2026-07-15');
        $outsideWindow = $this->createDocument($employee, $documentType, '2026-07-25');

        $this->artisan('employee-documents:send-expiry-notifications')->assertSuccessful();

        $this->assertDatabaseHas('employee_document_expiry_notification_logs', [
            'employee_document_id' => $insideWindow->id,
        ]);
        $this->assertDatabaseMissing('employee_document_expiry_notification_logs', [
            'employee_document_id' => $outsideWindow->id,
        ]);
    }

    public function test_command_marks_expired_documents_and_sends_final_notification(): void
    {
        Carbon::setTestNow('2026-07-05');

        MailSetting::query()->create([
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'document_expiry_email_enabled' => false,
            'document_expiry_notify_days' => 30,
            'mailer' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'notify@example.com',
            'password' => 'secret-pass',
            'from_address' => 'no-reply@example.com',
            'from_name' => 'HRIS',
        ]);
        app(MailSettingsManager::class)->forgetCache();

        $this->createHrUser();
        $employee = Employee::factory()->create();
        $documentType = DocumentType::factory()->create(['name' => 'ID Card']);
        $document = $this->createDocument($employee, $documentType, '2026-07-05');

        $this->artisan('employee-documents:send-expiry-notifications')->assertSuccessful();

        $document->refresh();
        $this->assertSame(EmployeeDocument::STATUS_EXPIRED, $document->status);
        $this->assertDatabaseHas('employee_document_expiry_notification_logs', [
            'employee_document_id' => $document->id,
            'notification_stage' => EmployeeDocumentExpiryNotificationLog::STAGE_EXPIRED_FINAL,
        ]);
    }

    private function createDocument(Employee $employee, DocumentType $documentType, string $expiryDate): EmployeeDocument
    {
        return EmployeeDocument::query()->create([
            'employee_id' => $employee->id,
            'document_type_id' => $documentType->id,
            'name' => $documentType->name,
            'path' => 'employee-documents/'.$documentType->code.'.pdf',
            'original_name' => strtolower($documentType->code).'.pdf',
            'expiry_date' => $expiryDate,
            'status' => EmployeeDocument::STATUS_ACTIVE,
            'version_number' => 1,
        ]);
    }

    private function createHrUser(): User
    {
        $hrRole = Role::factory()->create([
            'slug' => 'hr',
            'name' => 'HR',
        ]);

        return User::factory()->create(['role_id' => $hrRole->id]);
    }
}
