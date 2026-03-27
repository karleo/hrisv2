import { Checkbox } from '@/components/ui/checkbox';

export type ModuleMeta = {
    key: string;
    label: string;
};

export type PermissionFlags = {
    can_access: boolean;
    can_view: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
};

type Errors = Record<string, string>;

type Props = {
    modules: ModuleMeta[];
    permissions: Record<string, PermissionFlags>;
    onChange: (moduleKey: string, field: keyof PermissionFlags, value: boolean) => void;
    errors?: Errors;
    disabled?: boolean;
};

const columns: { key: keyof PermissionFlags; label: string }[] = [
    { key: 'can_access', label: 'Access' },
    { key: 'can_view', label: 'View' },
    { key: 'can_create', label: 'Create' },
    { key: 'can_update', label: 'Update' },
    { key: 'can_delete', label: 'Delete' },
];

export function RolePermissionMatrix({
    modules,
    permissions,
    onChange,
    errors = {},
    disabled = false,
}: Props) {
    return (
        <div className="rounded-md border">
            <div className="max-h-[min(28rem,70vh)] overflow-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium">
                                Module
                            </th>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="px-2 py-2 text-center font-medium"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {modules.map((mod) => {
                            const row = permissions[mod.key] ?? {
                                can_access: false,
                                can_view: false,
                                can_create: false,
                                can_update: false,
                                can_delete: false,
                            };
                            return (
                                <tr
                                    key={mod.key}
                                    className="border-b last:border-0 hover:bg-muted/30"
                                >
                                    <td className="sticky left-0 z-10 bg-background px-3 py-2 font-medium">
                                        {mod.label}
                                    </td>
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-2 py-2 text-center">
                                            <div className="flex justify-center">
                                                <Checkbox
                                                    disabled={disabled}
                                                    checked={row[col.key]}
                                                    onCheckedChange={(v) =>
                                                        onChange(
                                                            mod.key,
                                                            col.key,
                                                            v === true,
                                                        )
                                                    }
                                                    aria-label={`${mod.label} ${col.label}`}
                                                />
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {typeof errors.permissions === 'string' && errors.permissions && (
                <p className="border-t px-3 py-2 text-sm text-destructive">
                    {errors.permissions}
                </p>
            )}
        </div>
    );
}

export function buildEmptyPermissions(
    modules: ModuleMeta[],
): Record<string, PermissionFlags> {
    const out: Record<string, PermissionFlags> = {};
    for (const m of modules) {
        out[m.key] = {
            can_access: false,
            can_view: false,
            can_create: false,
            can_update: false,
            can_delete: false,
        };
    }
    return out;
}

export function PermissionMatrixLegend() {
    return (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Permission hints</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
                <li>
                    <strong>Access</strong> — show the module in the sidebar.
                </li>
                <li>
                    <strong>View / Create / Update / Delete</strong> — require
                    Access and map to listing, new records, edits, and deletion.
                </li>
            </ul>
        </div>
    );
}
