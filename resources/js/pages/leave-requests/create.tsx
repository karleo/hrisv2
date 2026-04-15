import { Form, Head, Link } from '@inertiajs/react';
import { Calendar, ChevronLeft, ClipboardCheck, FileText, Send, User } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { FormValidationInlineAlert } from '@/components/form-validation-inline-alert';
import InputError from '@/components/input-error';
import { SignaturePad } from '@/components/signature-pad';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type Department = { id: number; name: string };
type Employee = { id: number; first_name: string; last_name: string; department_id: number; department?: Department };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Requests', href: '/leave-requests' },
    { title: 'New request', href: '/leave-requests/create' },
];

const DETAILS_OPTIONS = ['W/ medical Report', 'W/ Out medical Report'] as const;
const DAY_TYPE_OPTIONS = [
    { value: 'full', label: 'Full Day' },
    { value: 'half', label: 'Half Day' },
] as const;

function DayTypeSegmentedControl({
    id,
    label,
    value,
    onChange,
    description,
    error,
}: {
    id: string;
    label: string;
    value: 'full' | 'half';
    onChange: (value: 'full' | 'half') => void;
    description?: string;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <div id={id} className="grid grid-cols-2 rounded-md border border-input bg-muted/20 p-1">
                {DAY_TYPE_OPTIONS.map((option) => {
                    const isActive = value === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={cn(
                                'h-9 rounded-sm text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                            )}
                            aria-pressed={isActive}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
            {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
            <InputError message={error} />
        </div>
    );
}

function calculateLeaveDays(
    periodFrom: string,
    periodTo: string,
    startDayType: 'full' | 'half',
    endDayType: 'full' | 'half',
): number | null {
    if (!periodFrom || !periodTo) {
        return null;
    }

    const from = new Date(`${periodFrom}T00:00:00`);
    const to = new Date(`${periodTo}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
        return null;
    }

    const oneDayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((to.getTime() - from.getTime()) / oneDayMs) + 1;

    if (periodFrom === periodTo) {
        return startDayType === 'half' || endDayType === 'half' ? 0.5 : 1;
    }

    let total = diffDays;
    if (startDayType === 'half') {
        total -= 0.5;
    }
    if (endDayType === 'half') {
        total -= 0.5;
    }

    return Math.max(total, 0.5);
}

export default function LeaveRequestsCreate({
    employees,
    departments,
    leaveTypes,
    defaultEmployeeId = null,
}: {
    employees: Employee[];
    departments: { id: number; name: string }[];
    leaveTypes: string[];
    defaultEmployeeId?: number | null;
}) {
    const initialEmployee = defaultEmployeeId != null ? employees.find((e) => e.id === defaultEmployeeId) : undefined;

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
        initialEmployee ? String(initialEmployee.id) : '',
    );
    const [departmentId, setDepartmentId] = useState<string>(
        initialEmployee ? String(initialEmployee.department_id) : '',
    );
    const [periodFrom, setPeriodFrom] = useState<string>('');
    const [periodTo, setPeriodTo] = useState<string>('');
    const [startDayType, setStartDayType] = useState<'full' | 'half'>('full');
    const [endDayType, setEndDayType] = useState<'full' | 'half'>('full');
    const [employeeSignatureDataUrl, setEmployeeSignatureDataUrl] = useState<string | null>(null);

    const selectedEmployee = employees.find((e) => e.id === Number(selectedEmployeeId));
    const departmentName = selectedEmployee?.department?.name ?? departments.find((d) => d.id === Number(departmentId))?.name ?? '';
    const totalLeaveDays = useMemo(
        () => calculateLeaveDays(periodFrom, periodTo, startDayType, endDayType),
        [periodFrom, periodTo, startDayType, endDayType],
    );

    const handleEmployeeChange = useCallback(
        (value: string) => {
            setSelectedEmployeeId(value);
            const emp = employees.find((e) => e.id === Number(value));
            if (emp) {
                setDepartmentId(String(emp.department_id));
            }
        },
        [employees],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New leave request" />
            <div className="flex min-h-screen flex-col bg-muted/30">
                <div className="border-b bg-card px-4 py-6 md:px-8">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
                        <Link
                            href="/leave-requests"
                            className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ChevronLeft className="size-4" />
                            Back to Leave Requests
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">New leave request</h1>
                            <p className="text-muted-foreground">
                                Save a draft first, then open the request and use Submit when it is ready to send.
                            </p>
                        </div>
                    </div>
                </div>

                <Form
                    action="/leave-requests"
                    method="post"
                    className="px-4 py-8 md:px-8"
                    options={{ preserveScroll: true }}
                >
                    {({ errors }) => (
                        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-3">
                                <FormValidationInlineAlert errors={errors as Record<string, unknown>} />
                            </div>
                            <input type="hidden" name="employee_id" value={selectedEmployeeId} />
                            <input type="hidden" name="department_id" value={departmentId} />
                            <input
                                type="hidden"
                                name="employee_signature_data_url"
                                value={employeeSignatureDataUrl ?? ''}
                            />

                            <div className="space-y-6 lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="size-4 text-muted-foreground" />
                                            Employee and Request Info
                                        </CardTitle>
                                        <CardDescription>Choose employee and core request details.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="employee_id">Employee *</Label>
                                            <Select
                                                value={selectedEmployeeId}
                                                onValueChange={handleEmployeeChange}
                                                required
                                            >
                                                <SelectTrigger id="employee_id">
                                                    <SelectValue placeholder="Select employee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {employees.map((emp) => (
                                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                                            {emp.first_name} {emp.last_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors?.employee_id} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="date" className="flex items-center gap-2">
                                                <Calendar className="size-4" />
                                                Date
                                            </Label>
                                            <Input
                                                id="date"
                                                name="date"
                                                type="date"
                                                defaultValue={new Date().toISOString().slice(0, 10)}
                                            />
                                            <InputError message={errors?.date} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Department</Label>
                                            <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                                                {departmentName || (selectedEmployeeId ? '—' : 'Select an employee first')}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="size-4 text-muted-foreground" />
                                            Leave Details
                                        </CardTitle>
                                        <CardDescription>Capture leave type, period, and notes.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="absence_type">Absence type *</Label>
                                            <select
                                                id="absence_type"
                                                name="absence_type"
                                                required
                                                className="border-input flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            >
                                                <option value="">Select type</option>
                                                {leaveTypes.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors?.absence_type} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="absence_other">Other (if Others)</Label>
                                            <Input id="absence_other" name="absence_other" placeholder="Specify" />
                                            <InputError message={errors?.absence_other} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="details">Details</Label>
                                            <select
                                                id="details"
                                                name="details"
                                                className="border-input flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            >
                                                <option value="">Select</option>
                                                {DETAILS_OPTIONS.map((d) => (
                                                    <option key={d} value={d}>
                                                        {d}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors?.details} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="period_from">Period from</Label>
                                            <Input
                                                id="period_from"
                                                name="period_from"
                                                type="date"
                                                value={periodFrom}
                                                onChange={(event) => setPeriodFrom(event.target.value)}
                                            />
                                            <InputError message={errors?.period_from} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="period_to">Period to</Label>
                                            <Input
                                                id="period_to"
                                                name="period_to"
                                                type="date"
                                                value={periodTo}
                                                onChange={(event) => setPeriodTo(event.target.value)}
                                            />
                                            <InputError message={errors?.period_to} />
                                        </div>
                                        <input type="hidden" name="start_day_type" value={startDayType} />
                                        <input type="hidden" name="end_day_type" value={endDayType} />

                                        <DayTypeSegmentedControl
                                            id="start_day_type"
                                            label="Start day type"
                                            value={startDayType}
                                            onChange={setStartDayType}
                                            error={errors?.start_day_type}
                                        />
                                        <DayTypeSegmentedControl
                                            id="end_day_type"
                                            label="End day type"
                                            value={endDayType}
                                            onChange={setEndDayType}
                                            error={errors?.end_day_type}
                                        />

                                        <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-sm sm:col-span-2">
                                            <p className="text-muted-foreground text-xs">Calculated leave duration</p>
                                            <p className="mt-1 text-base font-semibold">
                                                {totalLeaveDays === null ? 'Select period dates to calculate' : `${totalLeaveDays.toFixed(1)} day(s)`}
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Half day can only be applied to the start or end date.
                                            </p>
                                        </div>

                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="remarks">Remarks</Label>
                                            <textarea
                                                id="remarks"
                                                name="remarks"
                                                rows={4}
                                                className="border-input flex min-h-[96px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            />
                                            <InputError message={errors?.remarks} />
                                        </div>
                                    </CardContent>
                                </Card>

                            </div>

                            <div className="lg:col-span-1">
                                <div className="sticky top-6 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <ClipboardCheck className="size-4 text-muted-foreground" />
                                                Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm">
                                            <div className="rounded-md border bg-muted/30 p-2">
                                                {selectedEmployee
                                                    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                                                    : 'No employee selected'}
                                            </div>
                                            <div className="rounded-md border bg-muted/30 p-2">
                                                {departmentName || 'No department selected'}
                                            </div>
                                            <div className="rounded-md border bg-muted/30 p-2">
                                                {totalLeaveDays === null ? 'Leave duration: —' : `Leave duration: ${totalLeaveDays.toFixed(1)} day(s)`}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button type="submit" className="w-full">
                                                <Send className="mr-2 size-4" />
                                                Save as draft
                                            </Button>
                                            <Link href="/leave-requests" className="block">
                                                <Button type="button" variant="ghost" className="w-full">
                                                    Cancel
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Employee signature</CardTitle>
                                            <CardDescription>
                                                Draw and save your signature while creating the request.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <SignaturePad
                                                label="Employee signature"
                                                initialImageUrl={null}
                                                onChange={setEmployeeSignatureDataUrl}
                                            />
                                            <InputError message={errors?.employee_signature_data_url} />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
