import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type RoleOption = {
    id: number;
    name: string;
    slug: string;
};

type EmployeeOption = {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    user_id: number | null;
};

type UserEdit = {
    id: number;
    name: string;
    email: string;
    role_id: number | null;
    employee_id: number | null;
};

function employeeLabel(
    e: EmployeeOption,
    forUserId: number,
): string {
    const base = `${e.employee_code} — ${e.first_name} ${e.last_name}`;
    if (e.user_id === null || e.user_id === forUserId) {
        return base;
    }
    return `${base} (linked)`;
}

export default function Edit({
    user,
    roles,
    employees,
}: {
    user: UserEdit;
    roles: RoleOption[];
    employees: EmployeeOption[];
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/users' },
        {
            title: user.name,
            href: `/users/${user.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors, transform } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role_id: user.role_id?.toString() ?? '',
        employee_id: user.employee_id?.toString() ?? '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${user.name}`} />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6 lg:p-8">
                <Link
                    href="/users"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to users
                </Link>

                <Heading
                    title="Edit user"
                    description="Update account details or change the linked employee."
                />

                <form
                    className="flex w-full min-w-0 flex-1 flex-col"
                    onSubmit={(e) => {
                        e.preventDefault();
                        transform((payload) => {
                            const roleId =
                                payload.role_id === ''
                                    ? null
                                    : Number(payload.role_id);
                            const employeeId =
                                payload.employee_id === ''
                                    ? null
                                    : Number(payload.employee_id);

                            if (payload.password === '') {
                                const {
                                    password: _p,
                                    password_confirmation: _c,
                                    ...rest
                                } = payload;

                                return {
                                    ...rest,
                                    role_id: roleId,
                                    employee_id: employeeId,
                                };
                            }

                            return {
                                ...payload,
                                role_id: roleId,
                                employee_id: employeeId,
                            };
                        });
                        put(`/users/${user.id}`, { preserveScroll: true });
                    }}
                >
                    <Card className="min-h-0 w-full flex-1">
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">
                                        Name{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        required
                                        maxLength={255}
                                        autoComplete="name"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        Email{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        required
                                        maxLength={255}
                                        autoComplete="email"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-0">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        New password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={data.password}
                                            onChange={(e) =>
                                                setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="new-password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((v) => !v)
                                            }
                                            className="text-muted-foreground hover:text-foreground absolute end-0 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                                            aria-label={
                                                showPassword
                                                    ? 'Hide new password'
                                                    : 'Show new password'
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff
                                                    className="size-4"
                                                    aria-hidden
                                                />
                                            ) : (
                                                <Eye
                                                    className="size-4"
                                                    aria-hidden
                                                />
                                            )}
                                        </button>
                                    </div>
                                    <div className="min-h-[1.25rem]">
                                        <InputError message={errors.password} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm new password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            type={
                                                showPasswordConfirmation
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={data.password_confirmation}
                                            onChange={(e) =>
                                                setData(
                                                    'password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="new-password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPasswordConfirmation(
                                                    (v) => !v,
                                                )
                                            }
                                            className="text-muted-foreground hover:text-foreground absolute end-0 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                                            aria-label={
                                                showPasswordConfirmation
                                                    ? 'Hide password confirmation'
                                                    : 'Show password confirmation'
                                            }
                                        >
                                            {showPasswordConfirmation ? (
                                                <EyeOff
                                                    className="size-4"
                                                    aria-hidden
                                                />
                                            ) : (
                                                <Eye
                                                    className="size-4"
                                                    aria-hidden
                                                />
                                            )}
                                        </button>
                                    </div>
                                    <div className="min-h-[1.25rem]">
                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Leave password blank to keep the current one. If
                                you set one, use at least 8 characters with upper
                                and lower case and a number; avoid your name,
                                email, and common passwords.
                            </p>

                            <div className="grid gap-2">
                                <Label htmlFor="role_id">Role</Label>
                                <select
                                    id="role_id"
                                    value={data.role_id}
                                    onChange={(e) =>
                                        setData('role_id', e.target.value)
                                    }
                                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">No role</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.role_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="employee_id">
                                    Employee{' '}
                                    <span className="text-muted-foreground">
                                        (optional)
                                    </span>
                                </Label>
                                <select
                                    id="employee_id"
                                    value={data.employee_id}
                                    onChange={(e) =>
                                        setData('employee_id', e.target.value)
                                    }
                                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">None</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {employeeLabel(emp, user.id)}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.employee_id} />
                                <p className="text-xs text-muted-foreground">
                                    Links this login to an employee record.
                                    Choosing an employee that is already linked
                                    moves the link to this user.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="mt-auto flex flex-wrap gap-3 border-t pt-6">
                            <Button disabled={processing} type="submit">
                                Save changes
                            </Button>
                            <Link href="/users">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
