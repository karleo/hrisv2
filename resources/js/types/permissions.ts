export type ModulePermissionFlags = {
    can_access: boolean;
    can_view: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
};

export type ModulePermissionsMap = Record<string, ModulePermissionFlags>;
