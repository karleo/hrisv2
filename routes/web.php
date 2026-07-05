<?php

use App\Http\Controllers\AccessoryController;
use App\Http\Controllers\AttendanceManagementController;
use App\Http\Controllers\Biometric\BiometricAttendanceController;
use App\Http\Controllers\BiometricSettingController;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\EmployeeAssistantController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeMessageController;
use App\Http\Controllers\EmployeeMessageTypingController;
use App\Http\Controllers\EmployeePresenceStatusController;
use App\Http\Controllers\EmployeeRequestController;
use App\Http\Controllers\EmployeeTimeEntryController;
use App\Http\Controllers\HardwareAssetValueController;
use App\Http\Controllers\HardwareController;
use App\Http\Controllers\ItAssetController;
use App\Http\Controllers\ItRequestController;
use App\Http\Controllers\JobPositionController;
use App\Http\Controllers\LeaveCalendarController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Payroll\EmployeeCompensationController;
use App\Http\Controllers\Payroll\PayAllowanceTypeController;
use App\Http\Controllers\Payroll\PayDeductionTypeController;
use App\Http\Controllers\Payroll\PayrollPeriodVerificationController;
use App\Http\Controllers\Payroll\PayrollRunController;
use App\Http\Controllers\Payroll\PayslipController;
use App\Http\Controllers\Reports\ItAssetInventoryReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SoftwareController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\WorkTimetableController;
use App\Http\Middleware\EnforceModulePermissions;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Broadcast::routes(['middleware' => ['web', 'auth', 'verified']]);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('locale', [LocaleController::class, 'update'])->name('locale.update');

    Route::post('employee-presence/heartbeat', [EmployeePresenceStatusController::class, 'heartbeat'])
        ->middleware('throttle:60,1')
        ->name('employee-presence.heartbeat');
    Route::get('employee-presence', [EmployeePresenceStatusController::class, 'index'])
        ->middleware('throttle:120,1')
        ->name('employee-presence.index');
});

Route::middleware(['auth', 'verified', EnforceModulePermissions::class])->group(function () {

    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::resource('departments', DepartmentController::class);
    Route::get('employees/{employee}/attendance/pdf', [EmployeeController::class, 'downloadAttendancePdf'])
        ->name('employees.attendance.pdf');
    Route::get('employees/{employee}/business-card', [EmployeeController::class, 'businessCard'])
        ->name('employees.business-card');
    Route::get('employees/{employee}/business-card/embed', [EmployeeController::class, 'businessCardEmbed'])
        ->name('employees.business-card.embed');
    Route::get('employees-template/download', [EmployeeController::class, 'downloadTemplate'])
        ->name('employees.template.download');
    Route::get('employees/export', [EmployeeController::class, 'export'])
        ->name('employees.export');
    Route::post('employees/import', [EmployeeController::class, 'import'])
        ->name('employees.import');
    Route::get('my-profile', [EmployeeController::class, 'profile'])->name('my-profile.show');
    Route::patch('my-profile', [EmployeeController::class, 'updateProfile'])->name('my-profile.update');
    Route::post('my-profile/documents', [EmployeeController::class, 'uploadProfileDocument'])->name('my-profile.documents.store');
    Route::delete('my-profile/documents/{employee_document}', [EmployeeController::class, 'destroyProfileDocument'])->name('my-profile.documents.destroy');
    Route::get('my-profile/documents/{employee_document}/view', [EmployeeController::class, 'showProfileDocument'])->name('my-profile.documents.show');
    Route::get('my-profile/attendance/pdf', [EmployeeController::class, 'downloadProfileAttendancePdf'])->name('my-profile.attendance.pdf');
    Route::resource('employees', EmployeeController::class);
    Route::patch('employees/{employee}/private-information', [EmployeeController::class, 'updatePrivateInformation'])
        ->name('employees.private-information.update');
    Route::get('employees/{employee}/documents/{employee_document}/view', [EmployeeController::class, 'showDocument'])
        ->name('employees.documents.show');
    Route::delete('employees/{employee}/documents/{employee_document}', [EmployeeController::class, 'destroyDocument'])
        ->name('employees.documents.destroy');
    Route::get('employee-messages/header', [EmployeeMessageController::class, 'header'])
        ->middleware('throttle:120,1')
        ->name('employee-messages.header');
    Route::get('employee-messages', [EmployeeMessageController::class, 'index'])
        ->name('employee-messages.index');
    Route::get('employee-messages/search', [EmployeeMessageController::class, 'searchEmployees'])
        ->name('employee-messages.search');
    Route::get('employee-messages/conversations/{conversation}', [EmployeeMessageController::class, 'showConversation'])
        ->name('employee-messages.conversations.show');
    Route::get('employee-messages/employees/{employee}', [EmployeeMessageController::class, 'showEmployee'])
        ->name('employee-messages.employees.show');
    Route::post('employee-messages', [EmployeeMessageController::class, 'store'])
        ->name('employee-messages.store');
    Route::post('employee-messages/conversations/{conversation}/read', [EmployeeMessageController::class, 'markRead'])
        ->name('employee-messages.conversations.read');
    Route::post('employee-messages/typing', [EmployeeMessageTypingController::class, 'store'])
        ->name('employee-messages.typing');
    Route::get('employee-assistant', [EmployeeAssistantController::class, 'index'])
        ->name('employee-assistant.index');
    Route::post('employee-assistant/messages', [EmployeeAssistantController::class, 'storeMessage'])
        ->middleware('throttle:20,1')
        ->name('employee-assistant.messages.store');
    Route::delete('employee-assistant/conversations/{conversation}', [EmployeeAssistantController::class, 'destroyConversation'])
        ->name('employee-assistant.conversations.destroy');
    Route::resource('job-positions', JobPositionController::class);
    Route::resource('leave-types', LeaveTypeController::class);
    Route::resource('countries', CountryController::class);
    Route::resource('company-profiles', CompanyProfileController::class);
    Route::get('company-profiles/{company_profile}/documents/{company_profile_document}/view', [CompanyProfileController::class, 'showDocument'])
        ->name('company-profiles.documents.show');
    Route::delete('company-profiles/{company_profile}/documents/{company_profile_document}', [CompanyProfileController::class, 'destroyDocument'])
        ->name('company-profiles.documents.destroy');
    Route::post('company-profiles/{company_profile}/documents/{company_profile_document}/archive', [CompanyProfileController::class, 'archiveDocument'])
        ->name('company-profiles.documents.archive');
    Route::resource('software', SoftwareController::class);
    Route::resource('hardware', HardwareController::class);
    Route::resource('hardware-asset-values', HardwareAssetValueController::class)->except(['show']);
    Route::resource('document-types', DocumentTypeController::class)
        ->except(['show'])
        ->parameters([
            'document-types' => 'document_type',
        ]);
    Route::resource('time-attendance', EmployeeTimeEntryController::class)->parameters([
        'time-attendance' => 'employee_time_entry',
    ])->only(['index', 'store', 'update', 'destroy']);
    Route::post('time-attendance/check-out', [EmployeeTimeEntryController::class, 'checkOut'])
        ->name('time-attendance.check-out');

    Route::get('attendance-management', [AttendanceManagementController::class, 'index'])
        ->name('attendance-management.index');

    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('attendance', fn () => redirect()->route('attendance-management.index', request()->query()))
            ->name('attendance');
        Route::get('it-asset-inventory', [ItAssetInventoryReportController::class, 'index'])
            ->name('it-asset-inventory');
    });

    Route::prefix('payroll')->name('payroll.')->group(function () {
        Route::get('employees/{employee}/compensation', [EmployeeCompensationController::class, 'show'])
            ->name('compensation.show');
        Route::post('employees/{employee}/compensation', [EmployeeCompensationController::class, 'store'])
            ->name('compensation.store');
        Route::put('employees/{employee}/compensation/{compensation}', [EmployeeCompensationController::class, 'update'])
            ->name('compensation.update');

        Route::resource('allowance-types', PayAllowanceTypeController::class)
            ->parameters(['allowance-types' => 'pay_allowance_type'])
            ->except(['show']);
        Route::resource('deduction-types', PayDeductionTypeController::class)
            ->parameters(['deduction-types' => 'pay_deduction_type'])
            ->except(['show']);

        Route::get('period-verifications', [PayrollPeriodVerificationController::class, 'index'])
            ->name('period-verifications.index');
        Route::post('period-verifications', [PayrollPeriodVerificationController::class, 'store'])
            ->name('period-verifications.store');
        Route::get('period-verifications/{period_verification}', [PayrollPeriodVerificationController::class, 'show'])
            ->name('period-verifications.show');
        Route::post('period-verifications/{period_verification}/verify-attendance', [PayrollPeriodVerificationController::class, 'verifyAttendance'])
            ->name('period-verifications.verify-attendance');
        Route::post('period-verifications/{period_verification}/verify-overtime', [PayrollPeriodVerificationController::class, 'verifyOvertime'])
            ->name('period-verifications.verify-overtime');
        Route::post('period-verifications/{period_verification}/reopen', [PayrollPeriodVerificationController::class, 'reopen'])
            ->name('period-verifications.reopen');
        Route::delete('period-verifications/{period_verification}', [PayrollPeriodVerificationController::class, 'destroy'])
            ->name('period-verifications.destroy');

        Route::get('runs', [PayrollRunController::class, 'index'])->name('runs.index');
        Route::post('runs', [PayrollRunController::class, 'store'])->name('runs.store');
        Route::get('runs/{run}', [PayrollRunController::class, 'show'])->name('runs.show');
        Route::post('runs/{run}/approve', [PayrollRunController::class, 'approve'])->name('runs.approve');
        Route::post('runs/{run}/mark-paid', [PayrollRunController::class, 'markPaid'])->name('runs.mark-paid');
        Route::post('runs/{run}/recalculate', [PayrollRunController::class, 'recalculate'])->name('runs.recalculate');
        Route::post('runs/{run}/revert', [PayrollRunController::class, 'revert'])->name('runs.revert');
        Route::delete('runs/{run}', [PayrollRunController::class, 'destroy'])->name('runs.destroy');
        Route::get('runs/{run}/register.pdf', [PayslipController::class, 'downloadRegister'])->name('runs.register-pdf');
        Route::get('runs/{run}/register.csv', [PayslipController::class, 'downloadRegisterCsv'])->name('runs.register-csv');
        Route::get('runs/{run}/payslips/{runEmployee}', [PayslipController::class, 'downloadPayslip'])->name('runs.payslip');

        Route::get('my-payslips', [PayslipController::class, 'myPayslips'])->name('my-payslips');
    });

    Route::prefix('biometric-attendance')->name('biometric-attendance.')->group(function () {
        Route::get('/', [BiometricAttendanceController::class, 'dashboard'])->name('dashboard');
        Route::get('connectivity', [BiometricAttendanceController::class, 'connectivity'])->name('connectivity');
        Route::get('import', [BiometricAttendanceController::class, 'import'])->name('import');
        Route::get('upload', [BiometricAttendanceController::class, 'upload'])->name('upload');
        Route::post('upload', [BiometricAttendanceController::class, 'uploadFile'])->name('upload.store');
        Route::get('punches', [BiometricAttendanceController::class, 'punches'])->name('punches');
        Route::get('sync-logs', [BiometricAttendanceController::class, 'syncLogs'])->name('sync-logs');
        Route::post('devices', [BiometricAttendanceController::class, 'storeDevice'])->name('devices.store');
        Route::patch('devices/{biometric_device}', [BiometricAttendanceController::class, 'updateDevice'])->name('devices.update');
        Route::post('sync', [BiometricAttendanceController::class, 'sync'])->name('sync');
        Route::post('remap-punches', [BiometricAttendanceController::class, 'remapPunches'])->name('remap-punches');
        Route::get('sync-status', [BiometricAttendanceController::class, 'syncStatus'])->name('sync-status');
        Route::post('devices/{biometric_device}/test', [BiometricAttendanceController::class, 'testConnection'])->name('devices.test');
        Route::post('devices/{biometric_device}/use-adms-push', [BiometricAttendanceController::class, 'useAdmsPush'])->name('devices.use-adms-push');
        Route::post('devices/{biometric_device}/use-device-web-report', [BiometricAttendanceController::class, 'useDeviceWebReport'])->name('devices.use-device-web-report');
        Route::get('devices/{biometric_device}/probe', [BiometricAttendanceController::class, 'probeDevice'])->name('devices.probe');
    });
    Route::resource('work-timetables', WorkTimetableController::class)->parameters([
        'work-timetables' => 'work_timetable',
    ]);
    Route::get('biometric-settings', [BiometricSettingController::class, 'index'])
        ->name('biometric-settings.index');
    Route::put('biometric-settings', [BiometricSettingController::class, 'update'])
        ->name('biometric-settings.update');
    Route::post('biometric-settings/test-connection', [BiometricSettingController::class, 'testConnection'])
        ->name('biometric-settings.test-connection');
    Route::post('biometric-settings/sync-now', [BiometricSettingController::class, 'syncNow'])
        ->name('biometric-settings.sync-now');
    Route::resource('leave-requests', LeaveRequestController::class);
    Route::get('leave-calendar', [LeaveCalendarController::class, 'index'])
        ->name('leave-calendar.index');
    Route::post('leave-requests/{leave_request}/submit', [LeaveRequestController::class, 'submit'])
        ->name('leave-requests.submit');
    Route::post('leave-requests/{leave_request}/decide', [LeaveRequestController::class, 'decide'])
        ->name('leave-requests.decide');
    Route::get('leave-requests/{leave_request}/print', [LeaveRequestController::class, 'print'])
        ->name('leave-requests.print');
    Route::post('leave-requests/{leave_request}/signatures', [LeaveRequestController::class, 'updateSignatures'])
        ->name('leave-requests.signatures.update');
    Route::resource('it-requests', ItRequestController::class);
    Route::post('it-requests/{it_request}/submit', [ItRequestController::class, 'submit'])
        ->name('it-requests.submit');
    Route::post('it-requests/{it_request}/decide', [ItRequestController::class, 'decide'])
        ->name('it-requests.decide');
    Route::get('it-requests/{it_request}/print', [ItRequestController::class, 'print'])
        ->name('it-requests.print');
    Route::post('it-requests/{it_request}/signatures', [ItRequestController::class, 'updateSignatures'])
        ->name('it-requests.signatures.update');
    Route::resource('employee-requests', EmployeeRequestController::class);
    Route::get('employee-requests/{employee_request}/print', [EmployeeRequestController::class, 'print'])
        ->name('employee-requests.print');
    Route::post('employee-requests/{employee_request}/submit', [EmployeeRequestController::class, 'submit'])
        ->name('employee-requests.submit');
    Route::post('employee-requests/{employee_request}/decide', [EmployeeRequestController::class, 'decide'])
        ->name('employee-requests.decide');
    Route::post('employee-requests/{employee_request}/signatures', [EmployeeRequestController::class, 'updateSignatures'])
        ->name('employee-requests.signatures.update');
    Route::get('it-assets/returns', [ItAssetController::class, 'returns'])->name('it-assets.returns');
    Route::get('it-assets/{it_asset}/print', [ItAssetController::class, 'print'])->name('it-assets.print');
    Route::get('it-assets/assignment-documents/{it_asset_assignment_document}', [ItAssetController::class, 'showAssignmentDocument'])
        ->name('it-assets.assignment-documents.show');
    Route::post('it-assets/{it_asset}/assign', [ItAssetController::class, 'assign'])->name('it-assets.assign');
    Route::post('it-assets/{it_asset}/return', [ItAssetController::class, 'returnAsset'])->name('it-assets.return');
    Route::patch('it-assets/{it_asset}/status', [ItAssetController::class, 'changeStatus'])->name('it-assets.status');
    Route::resource('it-assets', ItAssetController::class);
    Route::resource('accessories', AccessoryController::class)->except(['show']);
    Route::get('notifications/header', [NotificationController::class, 'header'])
        ->middleware('throttle:120,1')
        ->name('notifications.header');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])
        ->name('notifications.read');
    Route::delete('notifications', [NotificationController::class, 'destroyAll'])
        ->name('notifications.destroy-all');
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])
        ->name('notifications.destroy');

    Route::get('user-roles', [UserRoleController::class, 'index'])->name('user-roles.index');
    Route::patch('user-roles/{user}', [UserRoleController::class, 'update'])->name('user-roles.update');
    Route::resource('roles', RoleController::class)->except(['show']);
    Route::resource('users', UserController::class)->except(['show']);
    Route::delete('users/{user}/face-login', [UserController::class, 'destroyFaceLogin'])->name('users.face-login.destroy');
});

require __DIR__.'/settings.php';
