import type { ModulePermissionsMap, NavItem } from '@/types';

export function filterNavByModuleAccess(
    items: NavItem[],
    modulePermissions: ModulePermissionsMap | undefined,
): NavItem[] {
    if (!modulePermissions) {
        return items;
    }

    return items
        .map((item) => {
            if (item.items?.length) {
                const children = filterNavByModuleAccess(
                    item.items,
                    modulePermissions,
                );
                if (children.length === 0) {
                    return null;
                }
                return { ...item, items: children };
            }
            if (
                item.module &&
                !modulePermissions[item.module]?.can_access
            ) {
                return null;
            }
            return item;
        })
        .filter((item): item is NavItem => item !== null);
}
