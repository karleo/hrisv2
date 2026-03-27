import { Head, router } from '@inertiajs/react';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'User roles', href: '/user-roles' },
];

type RoleOption = {
    id: number;
    name: string;
    slug: string;
    is_system: boolean;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    role_id: number | null;
    role: RoleOption | null;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Index({
    users,
    roles,
    filters = {},
}: {
    users: Paginated<UserRow>;
    roles: RoleOption[];
    filters?: { search?: string };
}) {
    const { data: userRows } = users;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User roles" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>User roles</CardTitle>
                            <CardDescription>
                                Assign a role to each signed-in user
                            </CardDescription>
                        </div>
                        <DataTableToolbar
                            searchUrl="/user-roles"
                            searchPlaceholder="Search name or email…"
                            filters={filters}
                            autoSearch
                            showSearchButton={false}
                        />
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Email
                                        </th>
                                        <th className="min-w-[12rem] px-4 py-3 text-left font-medium">
                                            Role
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userRows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                {filters.search
                                                    ? 'No users match your search.'
                                                    : 'No users found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        userRows.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <td className="px-4 py-3">
                                                    {user.name}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {user.email}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                        value={user.role_id ?? ''}
                                                        onChange={(e) => {
                                                            const raw =
                                                                e.target.value;
                                                            const roleId =
                                                                raw === ''
                                                                    ? null
                                                                    : Number(
                                                                          raw,
                                                                      );
                                                            router.patch(
                                                                `/user-roles/${user.id}`,
                                                                {
                                                                    role_id: roleId,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        <option value="">
                                                            No role
                                                        </option>
                                                        {roles.map((r) => (
                                                            <option
                                                                key={r.id}
                                                                value={r.id}
                                                            >
                                                                {r.name}
                                                                {r.is_system
                                                                    ? ' (system)'
                                                                    : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <DataTablePagination
                            links={users.links}
                            from={users.from}
                            to={users.to}
                            total={users.total}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
