<?php

namespace App\Enums;

enum PermissionModule: string
{
    case Dashboard = 'dashboard';
    case RoleManagement = 'role_management';
    case UserManagement = 'user_management';
    case Departments = 'departments';
    case Employees = 'employees';
    case JobPositions = 'job_positions';
    case LeaveTypes = 'leave_types';
    case Countries = 'countries';
    case CompanyProfiles = 'company_profiles';
    case Software = 'software';
    case Hardware = 'hardware';
    case LeaveRequests = 'leave_requests';
    case ItRequests = 'it_requests';
    case EmployeeRequests = 'employee_requests';
    case ItAssetRequests = 'it_asset_requests';
    case LeaveCalendar = 'leave_calendar';
    case TimeAttendance = 'time_attendance';
    case WorkTimetables = 'work_timetables';
    case ActivityLogs = 'activity_logs';

    public function label(): string
    {
        return match ($this) {
            self::Dashboard => 'Dashboard',
            self::RoleManagement => 'Roles & access',
            self::UserManagement => 'Users',
            self::Departments => 'Departments',
            self::Employees => 'Employees',
            self::JobPositions => 'Job positions',
            self::LeaveTypes => 'Leave types',
            self::Countries => 'Countries',
            self::CompanyProfiles => 'Company profiles',
            self::Software => 'Software',
            self::Hardware => 'Hardware',
            self::LeaveRequests => 'Leave requests',
            self::ItRequests => 'IT requests',
            self::EmployeeRequests => 'Employee requests',
            self::ItAssetRequests => 'IT asset requests',
            self::LeaveCalendar => 'Leave calendar',
            self::TimeAttendance => 'Time & attendance',
            self::WorkTimetables => 'Work timetables',
            self::ActivityLogs => 'Activity logs',
        };
    }
}
