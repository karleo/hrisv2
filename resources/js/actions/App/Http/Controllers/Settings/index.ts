import ProfileController from './ProfileController'
import PasswordController from './PasswordController'
import TwoFactorAuthenticationController from './TwoFactorAuthenticationController'
import SmtpController from './SmtpController'
import AiAssistantController from './AiAssistantController'
import StorageMaintenanceController from './StorageMaintenanceController'
const Settings = {
    ProfileController: Object.assign(ProfileController, ProfileController),
PasswordController: Object.assign(PasswordController, PasswordController),
TwoFactorAuthenticationController: Object.assign(TwoFactorAuthenticationController, TwoFactorAuthenticationController),
SmtpController: Object.assign(SmtpController, SmtpController),
AiAssistantController: Object.assign(AiAssistantController, AiAssistantController),
StorageMaintenanceController: Object.assign(StorageMaintenanceController, StorageMaintenanceController),
}

export default Settings