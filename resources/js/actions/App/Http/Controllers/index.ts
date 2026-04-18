import LocaleController from './LocaleController'
import DashboardController from './DashboardController'
import DepartmentController from './DepartmentController'
import EmployeeController from './EmployeeController'
import JobPositionController from './JobPositionController'
import LeaveTypeController from './LeaveTypeController'
import CountryController from './CountryController'
import CompanyProfileController from './CompanyProfileController'
import SoftwareController from './SoftwareController'
import HardwareController from './HardwareController'
import DocumentTypeController from './DocumentTypeController'
import EmployeeTimeEntryController from './EmployeeTimeEntryController'
import WorkTimetableController from './WorkTimetableController'
import LeaveRequestController from './LeaveRequestController'
import LeaveCalendarController from './LeaveCalendarController'
import ItRequestController from './ItRequestController'
import EmployeeRequestController from './EmployeeRequestController'
import ItAssetRequestController from './ItAssetRequestController'
import NotificationController from './NotificationController'
import UserRoleController from './UserRoleController'
import RoleController from './RoleController'
import UserController from './UserController'
import Settings from './Settings'
const Controllers = {
    LocaleController: Object.assign(LocaleController, LocaleController),
DashboardController: Object.assign(DashboardController, DashboardController),
DepartmentController: Object.assign(DepartmentController, DepartmentController),
EmployeeController: Object.assign(EmployeeController, EmployeeController),
JobPositionController: Object.assign(JobPositionController, JobPositionController),
LeaveTypeController: Object.assign(LeaveTypeController, LeaveTypeController),
CountryController: Object.assign(CountryController, CountryController),
CompanyProfileController: Object.assign(CompanyProfileController, CompanyProfileController),
SoftwareController: Object.assign(SoftwareController, SoftwareController),
HardwareController: Object.assign(HardwareController, HardwareController),
DocumentTypeController: Object.assign(DocumentTypeController, DocumentTypeController),
EmployeeTimeEntryController: Object.assign(EmployeeTimeEntryController, EmployeeTimeEntryController),
WorkTimetableController: Object.assign(WorkTimetableController, WorkTimetableController),
LeaveRequestController: Object.assign(LeaveRequestController, LeaveRequestController),
LeaveCalendarController: Object.assign(LeaveCalendarController, LeaveCalendarController),
ItRequestController: Object.assign(ItRequestController, ItRequestController),
EmployeeRequestController: Object.assign(EmployeeRequestController, EmployeeRequestController),
ItAssetRequestController: Object.assign(ItAssetRequestController, ItAssetRequestController),
NotificationController: Object.assign(NotificationController, NotificationController),
UserRoleController: Object.assign(UserRoleController, UserRoleController),
RoleController: Object.assign(RoleController, RoleController),
UserController: Object.assign(UserController, UserController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers