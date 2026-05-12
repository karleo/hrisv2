<?php

namespace App\Support;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeMessageController;
use App\Http\Controllers\EmployeeMessageTypingController;
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
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SoftwareController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\WorkTimetableController;

final class ModulePermissionRegistry
{
    /**
     * @var array<class-string, array<string, array{0: PermissionModule, 1: ModuleAbility}>>
     */
    private const CONTROLLER_ACTIONS = [
        DepartmentController::class => [
            'index' => [PermissionModule::Departments, ModuleAbility::View],
            'create' => [PermissionModule::Departments, ModuleAbility::Create],
            'store' => [PermissionModule::Departments, ModuleAbility::Create],
            'show' => [PermissionModule::Departments, ModuleAbility::View],
            'edit' => [PermissionModule::Departments, ModuleAbility::Update],
            'update' => [PermissionModule::Departments, ModuleAbility::Update],
            'destroy' => [PermissionModule::Departments, ModuleAbility::Delete],
        ],
        EmployeeController::class => [
            'index' => [PermissionModule::Employees, ModuleAbility::View],
            'create' => [PermissionModule::Employees, ModuleAbility::Create],
            'store' => [PermissionModule::Employees, ModuleAbility::Create],
            'downloadTemplate' => [PermissionModule::Employees, ModuleAbility::View],
            'export' => [PermissionModule::Employees, ModuleAbility::View],
            'import' => [PermissionModule::Employees, ModuleAbility::Create],
            'businessCard' => [PermissionModule::Employees, ModuleAbility::View],
            'businessCardEmbed' => [PermissionModule::Employees, ModuleAbility::View],
            'show' => [PermissionModule::Employees, ModuleAbility::View],
            'edit' => [PermissionModule::Employees, ModuleAbility::Update],
            'update' => [PermissionModule::Employees, ModuleAbility::Update],
            'updatePrivateInformation' => [PermissionModule::Employees, ModuleAbility::Update],
            'showDocument' => [PermissionModule::Employees, ModuleAbility::View],
            'destroy' => [PermissionModule::Employees, ModuleAbility::Delete],
            'destroyDocument' => [PermissionModule::Employees, ModuleAbility::Delete],
        ],
        EmployeeMessageController::class => [
            'index' => [PermissionModule::EmployeeMessages, ModuleAbility::View],
            'searchEmployees' => [PermissionModule::EmployeeMessages, ModuleAbility::View],
            'showConversation' => [PermissionModule::EmployeeMessages, ModuleAbility::View],
            'showEmployee' => [PermissionModule::EmployeeMessages, ModuleAbility::View],
            'store' => [PermissionModule::EmployeeMessages, ModuleAbility::Create],
            'markRead' => [PermissionModule::EmployeeMessages, ModuleAbility::Update],
        ],
        EmployeeMessageTypingController::class => [
            'store' => [PermissionModule::EmployeeMessages, ModuleAbility::Create],
        ],
        JobPositionController::class => [
            'index' => [PermissionModule::JobPositions, ModuleAbility::View],
            'create' => [PermissionModule::JobPositions, ModuleAbility::Create],
            'store' => [PermissionModule::JobPositions, ModuleAbility::Create],
            'show' => [PermissionModule::JobPositions, ModuleAbility::View],
            'edit' => [PermissionModule::JobPositions, ModuleAbility::Update],
            'update' => [PermissionModule::JobPositions, ModuleAbility::Update],
            'destroy' => [PermissionModule::JobPositions, ModuleAbility::Delete],
        ],
        LeaveTypeController::class => [
            'index' => [PermissionModule::LeaveTypes, ModuleAbility::View],
            'create' => [PermissionModule::LeaveTypes, ModuleAbility::Create],
            'store' => [PermissionModule::LeaveTypes, ModuleAbility::Create],
            'show' => [PermissionModule::LeaveTypes, ModuleAbility::View],
            'edit' => [PermissionModule::LeaveTypes, ModuleAbility::Update],
            'update' => [PermissionModule::LeaveTypes, ModuleAbility::Update],
            'destroy' => [PermissionModule::LeaveTypes, ModuleAbility::Delete],
        ],
        CountryController::class => [
            'index' => [PermissionModule::Countries, ModuleAbility::View],
            'create' => [PermissionModule::Countries, ModuleAbility::Create],
            'store' => [PermissionModule::Countries, ModuleAbility::Create],
            'show' => [PermissionModule::Countries, ModuleAbility::View],
            'edit' => [PermissionModule::Countries, ModuleAbility::Update],
            'update' => [PermissionModule::Countries, ModuleAbility::Update],
            'destroy' => [PermissionModule::Countries, ModuleAbility::Delete],
        ],
        CompanyProfileController::class => [
            'index' => [PermissionModule::CompanyProfiles, ModuleAbility::View],
            'create' => [PermissionModule::CompanyProfiles, ModuleAbility::Create],
            'store' => [PermissionModule::CompanyProfiles, ModuleAbility::Create],
            'show' => [PermissionModule::CompanyProfiles, ModuleAbility::View],
            'edit' => [PermissionModule::CompanyProfiles, ModuleAbility::Update],
            'update' => [PermissionModule::CompanyProfiles, ModuleAbility::Update],
            'destroy' => [PermissionModule::CompanyProfiles, ModuleAbility::Delete],
        ],
        SoftwareController::class => [
            'index' => [PermissionModule::Software, ModuleAbility::View],
            'create' => [PermissionModule::Software, ModuleAbility::Create],
            'store' => [PermissionModule::Software, ModuleAbility::Create],
            'show' => [PermissionModule::Software, ModuleAbility::View],
            'edit' => [PermissionModule::Software, ModuleAbility::Update],
            'update' => [PermissionModule::Software, ModuleAbility::Update],
            'destroy' => [PermissionModule::Software, ModuleAbility::Delete],
        ],
        HardwareController::class => [
            'index' => [PermissionModule::Hardware, ModuleAbility::View],
            'create' => [PermissionModule::Hardware, ModuleAbility::Create],
            'store' => [PermissionModule::Hardware, ModuleAbility::Create],
            'show' => [PermissionModule::Hardware, ModuleAbility::View],
            'edit' => [PermissionModule::Hardware, ModuleAbility::Update],
            'update' => [PermissionModule::Hardware, ModuleAbility::Update],
            'destroy' => [PermissionModule::Hardware, ModuleAbility::Delete],
        ],
        HardwareAssetValueController::class => [
            'index' => [PermissionModule::Hardware, ModuleAbility::View],
            'create' => [PermissionModule::Hardware, ModuleAbility::Create],
            'store' => [PermissionModule::Hardware, ModuleAbility::Create],
            'edit' => [PermissionModule::Hardware, ModuleAbility::Update],
            'update' => [PermissionModule::Hardware, ModuleAbility::Update],
            'destroy' => [PermissionModule::Hardware, ModuleAbility::Delete],
        ],
        DocumentTypeController::class => [
            'index' => [PermissionModule::DocumentTypes, ModuleAbility::View],
            'create' => [PermissionModule::DocumentTypes, ModuleAbility::Create],
            'store' => [PermissionModule::DocumentTypes, ModuleAbility::Create],
            'show' => [PermissionModule::DocumentTypes, ModuleAbility::View],
            'edit' => [PermissionModule::DocumentTypes, ModuleAbility::Update],
            'update' => [PermissionModule::DocumentTypes, ModuleAbility::Update],
            'destroy' => [PermissionModule::DocumentTypes, ModuleAbility::Delete],
        ],
        LeaveRequestController::class => [
            'index' => [PermissionModule::LeaveRequests, ModuleAbility::View],
            'create' => [PermissionModule::LeaveRequests, ModuleAbility::Create],
            'store' => [PermissionModule::LeaveRequests, ModuleAbility::Create],
            'show' => [PermissionModule::LeaveRequests, ModuleAbility::View],
            'edit' => [PermissionModule::LeaveRequests, ModuleAbility::Update],
            'update' => [PermissionModule::LeaveRequests, ModuleAbility::Update],
            'destroy' => [PermissionModule::LeaveRequests, ModuleAbility::Update],
            'print' => [PermissionModule::LeaveRequests, ModuleAbility::View],
            'submit' => [PermissionModule::LeaveRequests, ModuleAbility::Create],
            'decide' => [PermissionModule::LeaveRequests, ModuleAbility::Update],
            'updateSignatures' => [PermissionModule::LeaveRequests, ModuleAbility::View],
        ],
        LeaveCalendarController::class => [
            'index' => [PermissionModule::LeaveCalendar, ModuleAbility::View],
        ],
        ItRequestController::class => [
            'index' => [PermissionModule::ItRequests, ModuleAbility::View],
            'create' => [PermissionModule::ItRequests, ModuleAbility::Create],
            'store' => [PermissionModule::ItRequests, ModuleAbility::Create],
            'show' => [PermissionModule::ItRequests, ModuleAbility::View],
            'edit' => [PermissionModule::ItRequests, ModuleAbility::Update],
            'update' => [PermissionModule::ItRequests, ModuleAbility::Update],
            'destroy' => [PermissionModule::ItRequests, ModuleAbility::Update],
            'submit' => [PermissionModule::ItRequests, ModuleAbility::Create],
            'decide' => [PermissionModule::ItRequests, ModuleAbility::Update],
            'updateSignatures' => [PermissionModule::ItRequests, ModuleAbility::Update],
        ],
        EmployeeRequestController::class => [
            'index' => [PermissionModule::EmployeeRequests, ModuleAbility::View],
            'create' => [PermissionModule::EmployeeRequests, ModuleAbility::Create],
            'store' => [PermissionModule::EmployeeRequests, ModuleAbility::Create],
            'show' => [PermissionModule::EmployeeRequests, ModuleAbility::View],
            'edit' => [PermissionModule::EmployeeRequests, ModuleAbility::Update],
            'update' => [PermissionModule::EmployeeRequests, ModuleAbility::Update],
            'destroy' => [PermissionModule::EmployeeRequests, ModuleAbility::Update],
            'print' => [PermissionModule::EmployeeRequests, ModuleAbility::View],
            'submit' => [PermissionModule::EmployeeRequests, ModuleAbility::Create],
            'decide' => [PermissionModule::EmployeeRequests, ModuleAbility::Update],
            'updateSignatures' => [PermissionModule::EmployeeRequests, ModuleAbility::Update],
        ],
        ItAssetRequestController::class => [
            'index' => [PermissionModule::ItAssetRequests, ModuleAbility::View],
            'create' => [PermissionModule::ItAssetRequests, ModuleAbility::Create],
            'store' => [PermissionModule::ItAssetRequests, ModuleAbility::Create],
            'show' => [PermissionModule::ItAssetRequests, ModuleAbility::View],
            'edit' => [PermissionModule::ItAssetRequests, ModuleAbility::Update],
            'update' => [PermissionModule::ItAssetRequests, ModuleAbility::Update],
            'destroy' => [PermissionModule::ItAssetRequests, ModuleAbility::Update],
            'submit' => [PermissionModule::ItAssetRequests, ModuleAbility::Create],
            'decide' => [PermissionModule::ItAssetRequests, ModuleAbility::Update],
            'updateSignatures' => [PermissionModule::ItAssetRequests, ModuleAbility::Update],
        ],
        RoleController::class => [
            'index' => [PermissionModule::RoleManagement, ModuleAbility::View],
            'create' => [PermissionModule::RoleManagement, ModuleAbility::Create],
            'store' => [PermissionModule::RoleManagement, ModuleAbility::Create],
            'edit' => [PermissionModule::RoleManagement, ModuleAbility::Update],
            'update' => [PermissionModule::RoleManagement, ModuleAbility::Update],
            'destroy' => [PermissionModule::RoleManagement, ModuleAbility::Delete],
        ],
        UserRoleController::class => [
            'index' => [PermissionModule::RoleManagement, ModuleAbility::View],
            'update' => [PermissionModule::RoleManagement, ModuleAbility::Update],
        ],
        UserController::class => [
            'index' => [PermissionModule::UserManagement, ModuleAbility::View],
            'create' => [PermissionModule::UserManagement, ModuleAbility::Create],
            'store' => [PermissionModule::UserManagement, ModuleAbility::Create],
            'edit' => [PermissionModule::UserManagement, ModuleAbility::Update],
            'update' => [PermissionModule::UserManagement, ModuleAbility::Update],
            'updateLoginFaceRecognitionVisibility' => [PermissionModule::UserManagement, ModuleAbility::Update],
            'destroy' => [PermissionModule::UserManagement, ModuleAbility::Delete],
        ],
        EmployeeTimeEntryController::class => [
            'index' => [PermissionModule::TimeAttendance, ModuleAbility::View],
            'store' => [PermissionModule::TimeAttendance, ModuleAbility::CheckIn],
            'update' => [PermissionModule::TimeAttendance, ModuleAbility::Update],
            'destroy' => [PermissionModule::TimeAttendance, ModuleAbility::Delete],
            'checkOut' => [PermissionModule::TimeAttendance, ModuleAbility::CheckOut],
        ],
        WorkTimetableController::class => [
            'index' => [PermissionModule::WorkTimetables, ModuleAbility::View],
            'create' => [PermissionModule::WorkTimetables, ModuleAbility::Create],
            'store' => [PermissionModule::WorkTimetables, ModuleAbility::Create],
            'edit' => [PermissionModule::WorkTimetables, ModuleAbility::Update],
            'update' => [PermissionModule::WorkTimetables, ModuleAbility::Update],
            'destroy' => [PermissionModule::WorkTimetables, ModuleAbility::Delete],
        ],
    ];

    /**
     * @return array{0: PermissionModule, 1: ModuleAbility}|null
     */
    public static function forControllerAction(string $controller, string $method): ?array
    {
        return self::CONTROLLER_ACTIONS[$controller][$method] ?? null;
    }
}
