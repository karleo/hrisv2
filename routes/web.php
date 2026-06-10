<?php

use App\Http\Controllers\Biometric\BiometricAttendanceController;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeMessageController;
use App\Http\Controllers\EmployeeMessageTypingController;
use App\Http\Controllers\EmployeePresenceStatusController;
use App\Http\Controllers\EmployeeRequestController;
use App\Http\Controllers\EmployeeTimeEntryController;
use App\Http\Controllers\HardwareAssetValueController;
use App\Http\Controllers\HardwareController;
use App\Http\Controllers\ItAssetRequestController;
use App\Http\Controllers\ItRequestController;
use App\Http\Controllers\JobPositionController;
use App\Http\Controllers\LeaveCalendarController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Reports\AttendanceReportController;
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
    Route::post('my-profile/face-login', [EmployeeController::class, 'updateProfileFaceLogin'])->name('my-profile.face-login.update');
    Route::delete('my-profile/face-login', [EmployeeController::class, 'destroyProfileFaceLogin'])->name('my-profile.face-login.destroy');
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
    Route::resource('job-positions', JobPositionController::class);
    Route::resource('leave-types', LeaveTypeController::class);
    Route::resource('countries', CountryController::class);
    Route::resource('company-profiles', CompanyProfileController::class);
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

    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('attendance', [AttendanceReportController::class, 'index'])->name('attendance');
    });

    Route::prefix('biometric-attendance')->name('biometric-attendance.')->group(function () {
        Route::get('/', [BiometricAttendanceController::class, 'dashboard'])->name('dashboard');
        Route::get('connectivity', [BiometricAttendanceController::class, 'connectivity'])->name('connectivity');
        Route::get('import', [BiometricAttendanceController::class, 'import'])->name('import');
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
    Route::resource('it-asset-requests', ItAssetRequestController::class);
    Route::post('it-asset-requests/{it_asset_request}/submit', [ItAssetRequestController::class, 'submit'])
        ->name('it-asset-requests.submit');
    Route::post('it-asset-requests/{it_asset_request}/decide', [ItAssetRequestController::class, 'decide'])
        ->name('it-asset-requests.decide');
    Route::get('it-asset-requests/{it_asset_request}/print', [ItAssetRequestController::class, 'print'])
        ->name('it-asset-requests.print');
    Route::post('it-asset-requests/{it_asset_request}/signatures', [ItAssetRequestController::class, 'updateSignatures'])
        ->name('it-asset-requests.signatures.update');
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
    Route::patch('users/settings/login-face-recognition', [UserController::class, 'updateLoginFaceRecognitionVisibility'])
        ->name('users.login-face-recognition.update');
    Route::resource('users', UserController::class)->except(['show']);
    Route::delete('users/{user}/face-login', [UserController::class, 'destroyFaceLogin'])->name('users.face-login.destroy');
});

require __DIR__.'/settings.php';
