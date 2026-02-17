import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import LeaveRequestController from '@/actions/App/Http/Controllers/LeaveRequestController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

type LeaveRequest = {
    id: number;
    code: string;
    employee_id: number;
    department_id: number;
    absence_types: string[];
    absence_other: string | null;
    details: string | null;
    remarks: string | null;
    date: string | null;
    period_from: string | null;
    period_to: string | null;
    days: number | null;
    status: string;
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

function toDdMmYyyy(iso: string): string
{
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return '';
    }

    const [, yyyy, mm, dd] = match;

    return `${dd}/${mm}/${yyyy}`;
}

export default function Edit({
    leaveRequest,
    employees,
    departments,
}: {
    leaveRequest: LeaveRequest;
    employees: EmployeeOption[];
    departments: DepartmentOption[];
}) {
    const requestLabel = leaveRequest.code || `Leave Request #${leaveRequest.id}`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leave Requests', href: index().url },
        {
            title: `Edit ${requestLabel}`,
            href: '#',
        },
    ];

    const initialAbsenceType =
        leaveRequest.absence_types && leaveRequest.absence_types.length > 0
            ? leaveRequest.absence_types[0]
            : '';

    const { data, setData, processing, errors, put, transform } = useForm<{
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
        employee_id: leaveRequest.employee_id,
        department_id: leaveRequest.department_id,
        absence_type: initialAbsenceType,
        absence_other: leaveRequest.absence_other ?? '',
        details: leaveRequest.details ?? '',
        remarks: leaveRequest.remarks ?? '',
        date: leaveRequest.date ?? '',
        period_from: leaveRequest.period_from ?? '',
        period_to: leaveRequest.period_to ?? '',
        status: leaveRequest.status,
    });

    const daysRequested = useMemo(() => {
        if (!data.period_from || !data.period_to) return null;
        const from = new Date(data.period_from);
        const to = new Date(data.period_to);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return null;
        return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    }, [data.period_from, data.period_to]);

    const othersSelected = data.absence_type === 'Others';

    const submitAs = (status: 'draft' | 'submitted') => (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status }));
        put(LeaveRequestController.update.put(leaveRequest.id).url);
    };

    const [dateInput, setDateInput] = useState<string>(
        data.date ? toDdMmYyyy(data.date) : '',
    );

    const dateRef = useRef<HTMLInputElement>(null);

    const openDatePicker = () => {
        const el = dateRef.current;
        if (!el) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).showPicker?.();
        el.focus();
        el.click();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${requestLabel}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Leave Requests
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={`Edit ${requestLabel}`}
                        description="Update the leave request details"
                    />
                    <div className="w-full min-w-[12rem] sm:w-auto sm:shrink-0">
                        <Label
                            htmlFor="date"
                            className="flex items-center gap-2 text-sm"
                        >
                            <Calendar className="size-4" />
                            Date (DD/MM/YYYY)
                        </Label>
                        <div className="relative mt-1.5">
                            <input
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
                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 pr-10 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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

                <form
                    className="space-y-6 w-full"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <div className="grid gap-6 lg:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="employee_id">Full Name</Label>
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
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                        <Label htmlFor="department_id">Department</Label>
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
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="absence_type">
                            Type of Absence Requested
                        </Label>
                        <select
                            id="absence_type"
                            name="absence_type"
                            required
                            value={data.absence_type}
                            onChange={(e) =>
                                setData('absence_type', e.target.value)
                            }
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">
                                Select type of absence
                            </option>
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
                                <input
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
                                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">
                                Select details
                            </option>
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
                        <textarea
                            id="remarks"
                            name="remarks"
                            rows={4}
                            value={data.remarks}
                            onChange={(e) =>
                                setData('remarks', e.target.value)
                            }
                            placeholder="Enter reason or remarks (optional)"
                            className="border-input focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.remarks} />
                    </div>

                    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                        <h3 className="text-sm font-medium">Period of absence</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="period_from">From</Label>
                                <input
                                    id="period_from"
                                    name="period_from"
                                    type="date"
                                    value={data.period_from}
                                    onChange={(e) =>
                                        setData('period_from', e.target.value)
                                    }
                                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.period_from} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="period_to">To</Label>
                                <input
                                    id="period_to"
                                    name="period_to"
                                    type="date"
                                    value={data.period_to}
                                    onChange={(e) =>
                                        setData('period_to', e.target.value)
                                    }
                                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.period_to} />
                            </div>
                        </div>
                        <div className="grid gap-2 max-w-xs">
                            <Label htmlFor="days_requested">Days requested</Label>
                            <input
                                id="days_requested"
                                type="text"
                                readOnly
                                value={
                                    daysRequested != null
                                        ? `${daysRequested} day${daysRequested !== 1 ? 's' : ''}`
                                        : '—'
                                }
                                className="border-input flex h-9 w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            disabled={processing}
                            type="button"
                            variant="outline"
                            onClick={submitAs('draft')}
                        >
                            Save
                        </Button>
                        <Button
                            disabled={processing}
                            type="button"
                            onClick={submitAs('submitted')}
                        >
                            Submit
                        </Button>
                        <Link href={index()}>
                            <Button type="button" variant="ghost">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

