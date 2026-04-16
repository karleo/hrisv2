import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '/users' }];

type RoleRef = {
    id: number;
    name: string;
};

type EmployeeRef = {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    face_enrolled: boolean;
    role_id: number | null;
    role: RoleRef | null;
    employee: EmployeeRef | null;
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
    filters = {},
    faceLoginVisibleOnLoginPage = true,
}: {
    users: Paginated<UserRow>;
    filters?: { search?: string };
    faceLoginVisibleOnLoginPage?: boolean;
}) {
    const { props } = usePage<{ auth: { user: { id: number } } }>();
    const currentUserId = props.auth.user.id;
    const { data: userList } = users;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Users</CardTitle>
                            <CardDescription>
                                Manage sign-in accounts, roles, and optional
                                employee links
                            </CardDescription>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-1">
                                <span className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Login Face Recognition
                                </span>
                                <Button
                                    size="sm"
                                    variant={faceLoginVisibleOnLoginPage ? 'default' : 'outline'}
                                    onClick={() =>
                                        router.patch('/users/settings/login-face-recognition', { enabled: true }, {
                                            preserveScroll: true,
                                        })
                                    }
                                    disabled={faceLoginVisibleOnLoginPage}
                                >
                                    Enabled
                                </Button>
                                <Button
                                    size="sm"
                                    variant={!faceLoginVisibleOnLoginPage ? 'destructive' : 'outline'}
                                    onClick={() =>
                                        router.patch('/users/settings/login-face-recognition', { enabled: false }, {
                                            preserveScroll: true,
                                        })
                                    }
                                    disabled={!faceLoginVisibleOnLoginPage}
                                >
                                    Disabled
                                </Button>
                            </div>
                            <DataTableToolbar
                                searchUrl="/users"
                                searchPlaceholder="Search name, email…"
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href="/users/create">
                                <Button>
                                    <Plus />
                                    Add user
                                </Button>
                            </Link>
                        </div>
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
                                        <th className="px-4 py-3 text-left font-medium">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Face Login
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Employee
                                        </th>
                                        <th className="w-24 px-4 py-3 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userList.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                {filters.search
                                                    ? 'No users match your search.'
                                                    : 'No users found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        userList.map((user) => (
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
                                                    {user.role?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            user.face_enrolled
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                                                                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                                        }`}
                                                    >
                                                        {user.face_enrolled
                                                            ? 'Enrolled'
                                                            : 'Not enrolled'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {user.employee
                                                        ? `${user.employee.employee_code} — ${user.employee.first_name} ${user.employee.last_name}`
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={`/users/${user.id}/edit`}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label="Edit"
                                                            >
                                                                <Pencil />
                                                            </Button>
                                                        </Link>
                                                        <Dialog>
                                                            <DialogTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label="Delete"
                                                                    disabled={
                                                                        user.id ===
                                                                        currentUserId
                                                                    }
                                                                >
                                                                    <Trash2 className="text-destructive" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogTitle>
                                                                    Delete user?
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Remove{' '}
                                                                    <strong>
                                                                        {
                                                                            user.email
                                                                        }
                                                                    </strong>
                                                                    ? Their
                                                                    employee
                                                                    link will be
                                                                    cleared.
                                                                </DialogDescription>
                                                                <DialogFooter>
                                                                    <DialogClose
                                                                        asChild
                                                                    >
                                                                        <Button variant="secondary">
                                                                            Cancel
                                                                        </Button>
                                                                    </DialogClose>
                                                                    <Button
                                                                        variant="destructive"
                                                                        disabled={
                                                                            user.id ===
                                                                            currentUserId
                                                                        }
                                                                        onClick={() =>
                                                                            router.delete(
                                                                                `/users/${user.id}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
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
