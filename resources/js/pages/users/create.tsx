import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import MultiAngleFaceProfileField, {
    type FaceProfileFiles,
} from '@/components/multi-angle-face-profile-field';
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

function toOptionalPositiveInt(value: unknown): number | null {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const n = Number(value);

    if (!Number.isInteger(n) || n < 1) {
        return null;
    }

    return n;
}

function employeeLabel(
    e: EmployeeOption,
    options?: { forUserId?: number | null },
): string {
    const base = `${e.employee_code} — ${e.first_name} ${e.last_name}`;
    if (e.user_id === null || e.user_id === options?.forUserId) {
        return base;
    }
    return `${base} (linked)`;
}

const emptyFaceProfile = (): FaceProfileFiles => ({
    front: null,
    left: null,
    right: null,
});

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/users' },
    { title: 'Create', href: '/users/create' },
];

export default function Create({
    roles,
    employees,
}: {
    roles: RoleOption[];
    employees: EmployeeOption[];
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [faceGrabError, setFaceGrabError] = useState<string | null>(null);
    const [faceProfile, setFaceProfile] = useState<FaceProfileFiles>(emptyFaceProfile);

    const { data, setData, post, processing, errors, transform } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: '',
        employee_id: '',
    });

    const faceComplete =
        Boolean(faceProfile.front) &&
        Boolean(faceProfile.left) &&
        Boolean(faceProfile.right);

    transform((payload) => ({
        ...payload,
        role_id: toOptionalPositiveInt(payload.role_id),
        employee_id: toOptionalPositiveInt(payload.employee_id),
        ...(faceComplete && faceProfile.front && faceProfile.left && faceProfile.right
            ? {
                  face_capture_front: faceProfile.front,
                  face_capture_left: faceProfile.left,
                  face_capture_right: faceProfile.right,
              }
            : {}),
    }));

    const busy = processing || submitting;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create user" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6 lg:p-8">
                <Link
                    href="/users"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to users
                </Link>

                <Heading
                    title="Create user"
                    description="Add a system login. Face sign-in enrolls three angles (front, left, right) for a stronger profile. Complete those steps, then create the account. Linking an employee is optional."
                />

                <form
                    className="flex w-full min-w-0 flex-1 flex-col"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setFaceGrabError(null);
                        if (!faceComplete) {
                            setFaceGrabError(
                                'Lock all three face angles (front, left, right) before creating the user.',
                            );
                            return;
                        }
                        setSubmitting(true);
                        post('/users', {
                            forceFormData: true,
                            onFinish: () => {
                                setFaceProfile(emptyFaceProfile());
                                setSubmitting(false);
                            },
                            onError: () => {
                                setFaceGrabError(null);
                            },
                        });
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
                                        Password{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
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
                                            required
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
                                                    ? 'Hide password'
                                                    : 'Show password'
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
                                        Confirm password{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
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
                                            required
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
                                <p className="text-xs text-muted-foreground sm:col-span-2">
                                    Use at least 8 characters with upper and
                                    lower case letters and a number. Do not use
                                    your name, email, or well-known passwords
                                    (e.g. password, qwerty123).
                                </p>
                            </div>

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
                                    <option value="">
                                        Basic access (dashboard — default)
                                    </option>
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
                                            {employeeLabel(emp)}
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

                            <MultiAngleFaceProfileField
                                value={faceProfile}
                                onChange={setFaceProfile}
                                disabled={busy}
                                errors={{
                                    face_capture_front: errors.face_capture_front,
                                    face_capture_left: errors.face_capture_left,
                                    face_capture_right: errors.face_capture_right,
                                }}
                            />
                            <div
                                className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100"
                                role="status"
                            >
                                <p className="inline-flex items-center gap-2 font-medium">
                                    <AlertCircle className="size-4" aria-hidden />
                                    Face profile is not enrolled yet for this new user.
                                </p>
                                <p className="mt-1 text-xs opacity-90">
                                    Complete front, left, and right captures, then create the user to save
                                    face login enrollment.
                                </p>
                            </div>
                            {faceGrabError ? (
                                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                                    {faceGrabError}
                                </p>
                            ) : null}
                        </CardContent>
                        <CardFooter className="mt-auto flex flex-wrap gap-3 border-t pt-6">
                            <Button disabled={busy || !faceComplete} type="submit">
                                Create user
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
