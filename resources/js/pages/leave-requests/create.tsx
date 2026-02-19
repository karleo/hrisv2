import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, FileText, User } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import LeaveRequestController from '@/actions/App/Http/Controllers/LeaveRequestController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/leave-requests';
import type { BreadcrumbItem } from '@/types';

type EmployeeOption = {
    id: number;
    first_name: string;
    last_name: string;
};

type DepartmentOption = {
    id: number;
    name: string;
};

const ABSENCE_OPTIONS = [
    'Personal Leave',
    'Sick Leave',
    'Maternity Leave',
    'Emergency Leave',
    'Annual Leave',
    'Others',
] as const;

const DETAILS_OPTIONS = [
    'W/ medical Report',
    'W/ Out medical Report',
] as const;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Requests', href: index().url },
    { title: 'Create', href: '/leave-requests/create' },
];

function todayIsoLocal(): string
{
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function toDdMmYyyy(iso: string): string
{
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return '';
    }

    const [, yyyy, mm, dd] = match;

    return `${dd}/${mm}/${yyyy}`;
}

export default function Create({
    employees,
    departments,
}: {
    employees: EmployeeOption[];
    departments: DepartmentOption[];
}) {
    const initialDate = todayIsoLocal();

    const { data, setData, post, processing, errors, transform } = useForm<{
        employee_id: number | '';
        department_id: number | '';
        absence_type: string;
        absence_other: string;
        details: string;
        remarks: string;
        date: string;
        period_from: string;
        period_to: string;
        status: string;
    }>({
        employee_id: '',
        department_id: '',
        absence_type: '',
        absence_other: '',
        details: '',
        remarks: '',
        date: initialDate,
        period_from: '',
        period_to: '',
        status: 'draft',
    });

    const daysRequested = useMemo(() => {
        if (!data.period_from || !data.period_to) return null;
        const from = new Date(data.period_from);
        const to = new Date(data.period_to);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return null;
        return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    }, [data.period_from, data.period_to]);

    const submitAs = (status: 'draft' | 'submitted') => (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status }));
        post(LeaveRequestController.store.post().url);
    };

    const [dateInput, setDateInput] = useState<string>(
        data.date ? toDdMmYyyy(data.date) : '',
    );

    const dateRef = useRef<HTMLInputElement>(null);

    const openDatePicker = () => {
        const el = dateRef.current;
        if (!el) return;

        // Some browsers won't open the picker for fully transparent inputs.
        // showPicker is supported in Chromium; focus/click is fallback.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).showPicker?.();
        el.focus();
        el.click();
    };

    const othersSelected = data.absence_type === 'Others';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Leave Request" />

            <div className="flex min-h-screen w-full flex-col bg-muted/30">
                {/* Header Section */}
                <div className="border-b bg-card px-4 py-6 md:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6">
                        <Link
                            href={index()}
                            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Leave Requests
                        </Link>

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold tracking-tight">Create Leave Request</h1>
                                <p className="text-muted-foreground">
                                    Submit a new leave request for an employee
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end lg:shrink-0">
                                <div className="min-w-[200px]">
                                    <Label className="text-sm font-medium">Request Code</Label>
                                    <Input
                                        type="text"
                                        readOnly
                                        value="Auto-generated (PRL-YYYY-####)"
                                        className="mt-1.5 bg-muted text-muted-foreground"
                                    />
                                </div>
                                <div className="min-w-[200px]">
                                    <Label
                                        htmlFor="date"
                                        className="flex items-center gap-2 text-sm font-medium"
                                    >
                                        <Calendar className="size-4" />
                                        Request Date
                                    </Label>
                                    <div className="relative mt-1.5">
                                        <Input
                                            id="date_display"
                                            type="text"
                                            readOnly
                                            placeholder="DD/MM/YYYY"
                                            value={dateInput}
                                            onClick={openDatePicker}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    openDatePicker();
                                                }
                                            }}
                                            className="pr-10 cursor-pointer"
                                        />
                                        <input
                                            id="date"
                                            name="date"
                                            type="date"
                                            ref={dateRef}
                                            value={data.date}
                                            onChange={(e) => {
                                                const iso = e.target.value;
                                                setData('date', iso);
                                                setDateInput(iso ? toDdMmYyyy(iso) : '');
                                            }}
                                            className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                        />
                                        <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    </div>
                                    <InputError message={errors.date} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 px-4 py-8 md:px-8">
                    <form
                        className="mx-auto max-w-7xl"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Left Column - Main Form */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <User className="size-5 text-muted-foreground" />
                                            <CardTitle>Employee Information</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Select the employee and department for this leave request
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="employee_id">
                                                Full Name <span className="text-destructive">*</span>
                                            </Label>
                                            <select
                                                id="employee_id"
                                                name="employee_id"
                                                required
                                                value={data.employee_id}
                                                onChange={(e) =>
                                                    setData(
                                                        'employee_id',
                                                        e.target.value
                                                            ? Number(e.target.value)
                                                            : '',
                                                    )
                                                }
                                                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">Select employee</option>
                                                {employees.map((emp) => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.first_name} {emp.last_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.employee_id} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="department_id">
                                                Department <span className="text-destructive">*</span>
                                            </Label>
                                            <select
                                                id="department_id"
                                                name="department_id"
                                                required
                                                value={data.department_id}
                                                onChange={(e) =>
                                                    setData(
                                                        'department_id',
                                                        e.target.value
                                                            ? Number(e.target.value)
                                                            : '',
                                                    )
                                                }
                                                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">Select department</option>
                                                {departments.map((dept) => (
                                                    <option key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.department_id} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <FileText className="size-5 text-muted-foreground" />
                                            <CardTitle>Leave Details</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Provide information about the type and duration of leave
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="absence_type">
                                                Type of Absence Requested <span className="text-destructive">*</span>
                                            </Label>
                                            <select
                                                id="absence_type"
                                                name="absence_type"
                                                required
                                                value={data.absence_type}
                                                onChange={(e) =>
                                                    setData('absence_type', e.target.value)
                                                }
                                                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">Select type of absence</option>
                                                {ABSENCE_OPTIONS.map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.absence_type} />

                                            {othersSelected && (
                                                <div className="mt-2 grid gap-2">
                                                    <Label htmlFor="absence_other">
                                                        If Others, please specify
                                                    </Label>
                                                    <Input
                                                        id="absence_other"
                                                        name="absence_other"
                                                        type="text"
                                                        value={data.absence_other}
                                                        onChange={(e) =>
                                                            setData(
                                                                'absence_other',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Specify the absence type"
                                                    />
                                                    <InputError message={errors.absence_other} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="details">Details</Label>
                                            <select
                                                id="details"
                                                name="details"
                                                value={data.details}
                                                onChange={(e) =>
                                                    setData('details', e.target.value)
                                                }
                                                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">Select details</option>
                                                {DETAILS_OPTIONS.map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.details} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="remarks">Reason / Remarks</Label>
                                            <Textarea
                                                id="remarks"
                                                name="remarks"
                                                rows={5}
                                                value={data.remarks}
                                                onChange={(e) =>
                                                    setData('remarks', e.target.value)
                                                }
                                                placeholder="Enter reason or remarks (optional)"
                                                className="resize-none"
                                            />
                                            <InputError message={errors.remarks} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Clock className="size-5 text-muted-foreground" />
                                            <CardTitle>Period of Absence</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Specify the start and end dates for the leave period
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="period_from">
                                                    From Date <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="period_from"
                                                    name="period_from"
                                                    type="date"
                                                    value={data.period_from}
                                                    onChange={(e) =>
                                                        setData('period_from', e.target.value)
                                                    }
                                                    className="h-10"
                                                />
                                                <InputError message={errors.period_from} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="period_to">
                                                    To Date <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="period_to"
                                                    name="period_to"
                                                    type="date"
                                                    value={data.period_to}
                                                    onChange={(e) =>
                                                        setData('period_to', e.target.value)
                                                    }
                                                    className="h-10"
                                                />
                                                <InputError message={errors.period_to} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column - Summary & Actions */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-6 space-y-6">
                                    {/* Summary Card */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-muted-foreground">
                                                    Days Requested
                                                </Label>
                                                <div className="rounded-lg border bg-muted/50 p-4">
                                                    <div className="text-3xl font-bold">
                                                        {daysRequested != null ? daysRequested : '—'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {daysRequested != null && daysRequested !== 1
                                                            ? 'days'
                                                            : 'day'}
                                                    </div>
                                                </div>
                                            </div>

                                            {data.period_from && data.period_to && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Period
                                                    </Label>
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">From:</span>
                                                            <span className="font-medium">
                                                                {new Date(data.period_from).toLocaleDateString('en-GB', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">To:</span>
                                                            <span className="font-medium">
                                                                {new Date(data.period_to).toLocaleDateString('en-GB', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {data.absence_type && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Leave Type
                                                    </Label>
                                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                        {data.absence_type}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Actions Card */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button
                                                disabled={processing}
                                                type="button"
                                                className="w-full"
                                                onClick={submitAs('submitted')}
                                                size="lg"
                                            >
                                                {processing ? 'Submitting...' : 'Submit Request'}
                                            </Button>
                                            <Button
                                                disabled={processing}
                                                type="button"
                                                variant="outline"
                                                className="w-full"
                                                onClick={submitAs('draft')}
                                                size="lg"
                                            >
                                                Save as Draft
                                            </Button>
                                            <Link href={index()} className="block">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full"
                                                    size="lg"
                                                >
                                                    Cancel
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

