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
                        title="Create Leave Request"
                        description="Submit a new leave request"
                    />
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:gap-4 sm:shrink-0">
                        <div className="w-full min-w-[12rem] sm:w-auto">
                            <Label className="text-sm">Request Code</Label>
                            <input
                                type="text"
                                readOnly
                                value="Auto-generated (PRL-YYYY-####)"
                                className="border-input mt-1.5 flex h-9 w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
                            />
                        </div>
                        <div className="w-full min-w-[12rem] sm:w-auto">
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

