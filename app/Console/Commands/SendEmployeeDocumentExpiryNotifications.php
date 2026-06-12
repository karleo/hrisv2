<?php

namespace App\Console\Commands;

use App\Models\EmployeeDocument;
use App\Models\EmployeeDocumentExpiryNotificationLog;
use App\Models\User;
use App\Notifications\EmployeeDocumentExpiryNotification;
use App\Support\RequestApprovalScope;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendEmployeeDocumentExpiryNotifications extends Command
{
    protected $signature = 'employee-documents:send-expiry-notifications';

    protected $description = 'Send daily notifications for employee documents expiring within 30 days.';

    public function handle(RequestApprovalScope $approvalScope): int
    {
        $today = Carbon::today();
        $endDate = $today->copy()->addDays(30);

        $reminderDocuments = EmployeeDocument::query()
            ->with(['employee.user', 'documentType'])
            ->active()
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '>', $today->toDateString())
            ->whereDate('expiry_date', '<=', $endDate->toDateString())
            ->get();

        $expiringTodayDocuments = EmployeeDocument::query()
            ->with(['employee.user', 'documentType'])
            ->active()
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', $today->toDateString())
            ->get();

        $notificationsSent = 0;

        foreach ($reminderDocuments as $document) {
            $notificationsSent += $this->sendNotificationsForStage(
                $document,
                EmployeeDocumentExpiryNotificationLog::STAGE_REMINDER_DAILY,
                $approvalScope,
                $today,
            );
        }

        foreach ($expiringTodayDocuments as $document) {
            $document->update([
                'status' => EmployeeDocument::STATUS_EXPIRED,
                'archived_at' => null,
            ]);

            $notificationsSent += $this->sendNotificationsForStage(
                $document,
                EmployeeDocumentExpiryNotificationLog::STAGE_EXPIRED_FINAL,
                $approvalScope,
                $today,
            );
        }

        $this->info("Sent {$notificationsSent} employee document expiry notification(s).");

        return self::SUCCESS;
    }

    private function notificationRouteFor(User $recipient, EmployeeDocument $document): string
    {
        $employee = $document->employee;

        if ($employee !== null && $employee->user_id === $recipient->id) {
            return '/my-profile?tab=documents';
        }

        if ($employee !== null) {
            return "/employees/{$employee->id}/edit?tab=documents";
        }

        return '/employees';
    }

    private function sendNotificationsForStage(
        EmployeeDocument $document,
        string $stage,
        RequestApprovalScope $approvalScope,
        Carbon $today,
    ): int {
        $sent = 0;
        $recipients = collect($approvalScope->hrUsers())
            ->push($document->employee?->user)
            ->filter(fn ($user) => $user instanceof User)
            ->unique('id')
            ->values();

        foreach ($recipients as $recipient) {
            $alreadySentToday = EmployeeDocumentExpiryNotificationLog::query()
                ->where('employee_document_id', $document->id)
                ->where('user_id', $recipient->id)
                ->whereDate('notified_on', $today->toDateString())
                ->where('notification_stage', $stage)
                ->exists();

            if ($alreadySentToday) {
                continue;
            }

            $route = $this->notificationRouteFor($recipient, $document);

            $recipient->notify(new EmployeeDocumentExpiryNotification($document, $route, $stage));

            EmployeeDocumentExpiryNotificationLog::query()->create([
                'employee_document_id' => $document->id,
                'user_id' => $recipient->id,
                'notified_on' => $today->toDateString(),
                'notification_stage' => $stage,
            ]);

            $sent++;
        }

        return $sent;
    }
}
