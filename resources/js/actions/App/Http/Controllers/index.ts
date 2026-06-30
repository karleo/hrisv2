import LocaleController from './LocaleController'
import EmployeePresenceStatusController from './EmployeePresenceStatusController'
import DashboardController from './DashboardController'
import DepartmentController from './DepartmentController'
import EmployeeController from './EmployeeController'
import EmployeeMessageController from './EmployeeMessageController'
import EmployeeMessageTypingController from './EmployeeMessageTypingController'
import EmployeeAssistantController from './EmployeeAssistantController'
import JobPositionController from './JobPositionController'
import LeaveTypeController from './LeaveTypeController'
import CountryController from './CountryController'
import CompanyProfileController from './CompanyProfileController'
import SoftwareController from './SoftwareController'
import HardwareController from './HardwareController'
import HardwareAssetValueController from './HardwareAssetValueController'
import DocumentTypeController from './DocumentTypeController'
import EmployeeTimeEntryController from './EmployeeTimeEntryController'
import AttendanceManagementController from './AttendanceManagementController'
import Reports from './Reports'
import Payroll from './Payroll'
import Biometric from './Biometric'
import WorkTimetableController from './WorkTimetableController'
import BiometricSettingController from './BiometricSettingController'
import LeaveRequestController from './LeaveRequestController'
import LeaveCalendarController from './LeaveCalendarController'
import ItRequestController from './ItRequestController'
import EmployeeRequestController from './EmployeeRequestController'
import ItAssetController from './ItAssetController'
import AccessoryController from './AccessoryController'
import NotificationController from './NotificationController'
import UserRoleController from './UserRoleController'
import RoleController from './RoleController'
import UserController from './UserController'
import Settings from './Settings'

const Controllers = {
    LocaleController: Object.assign(LocaleController, LocaleController),
    EmployeePresenceStatusController: Object.assign(EmployeePresenceStatusController, EmployeePresenceStatusController),
    DashboardController: Object.assign(DashboardController, DashboardController),
    DepartmentController: Object.assign(DepartmentController, DepartmentController),
    EmployeeController: Object.assign(EmployeeController, EmployeeController),
    EmployeeMessageController: Object.assign(EmployeeMessageController, EmployeeMessageController),
    EmployeeMessageTypingController: Object.assign(EmployeeMessageTypingController, EmployeeMessageTypingController),
    EmployeeAssistantController: Object.assign(EmployeeAssistantController, EmployeeAssistantController),
    JobPositionController: Object.assign(JobPositionController, JobPositionController),
    LeaveTypeController: Object.assign(LeaveTypeController, LeaveTypeController),
    CountryController: Object.assign(CountryController, CountryController),
    CompanyProfileController: Object.assign(CompanyProfileController, CompanyProfileController),
    SoftwareController: Object.assign(SoftwareController, SoftwareController),
    HardwareController: Object.assign(HardwareController, HardwareController),
    HardwareAssetValueController: Object.assign(HardwareAssetValueController, HardwareAssetValueController),
    DocumentTypeController: Object.assign(DocumentTypeController, DocumentTypeController),
    EmployeeTimeEntryController: Object.assign(EmployeeTimeEntryController, EmployeeTimeEntryController),
    AttendanceManagementController: Object.assign(AttendanceManagementController, AttendanceManagementController),
    Reports: Object.assign(Reports, Reports),
    Payroll: Object.assign(Payroll, Payroll),
    Biometric: Object.assign(Biometric, Biometric),
    WorkTimetableController: Object.assign(WorkTimetableController, WorkTimetableController),
    BiometricSettingController: Object.assign(BiometricSettingController, BiometricSettingController),
    LeaveRequestController: Object.assign(LeaveRequestController, LeaveRequestController),
    LeaveCalendarController: Object.assign(LeaveCalendarController, LeaveCalendarController),
    ItRequestController: Object.assign(ItRequestController, ItRequestController),
    EmployeeRequestController: Object.assign(EmployeeRequestController, EmployeeRequestController),
    ItAssetController: Object.assign(ItAssetController, ItAssetController),
    AccessoryController: Object.assign(AccessoryController, AccessoryController),
    NotificationController: Object.assign(NotificationController, NotificationController),
    UserRoleController: Object.assign(UserRoleController, UserRoleController),
    RoleController: Object.assign(RoleController, RoleController),
    UserController: Object.assign(UserController, UserController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers