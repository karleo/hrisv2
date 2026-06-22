export type ModulePermissionFlags = {
    can_access: boolean;
    can_view: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
    can_check_in: boolean;
    can_check_out: boolean;
    can_verify: boolean;
};

export type ModulePermissionsMap = Record<string, ModulePermissionFlags>;
