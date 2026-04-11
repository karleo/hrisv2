import { Form, Head, Link } from '@inertiajs/react';
import { Calendar, ChevronLeft, ClipboardCheck, FileText, Save, Send, User } from 'lucide-react';
import { useCallback, useState } from 'react';
import { FormValidationInlineAlert } from '@/components/form-validation-inline-alert';
import InputError from '@/components/input-error';
import {
    RequestEmployeeSignatureCard,
    leaveRequestEditSignatureVisitOnly,
} from '@/components/request-employee-signature-card';
import { RequestStatusBadge, normalizeRequestStatus } from '@/components/request-status-badge';
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
import { employeeFullName } from '@/lib/format-employee-name';
import type { BreadcrumbItem } from '@/types';

type Department = { id: number; name: string };
type Employee = { id: number; first_name: string; last_name: string; department_id: number; department?: Department };
type LeaveRequest = {
    id: number;
    code: string;
    employee_id: number;
    department_id: number;
    absence_types: string[];
    absence_other: string | null;
    details: string | null;
    date: string | null;
    period_from: string | null;
    period_to: string | null;
    remarks: string | null;
    status: string;
    employee_signature_url?: string | null;
    approved_by_signature_url?: string | null;
    employee?: { first_name: string; last_name: string };
    approved_by_employee?: { first_name: string; last_name: string } | null;
};

const ABSENCE_TYPES = [
    'Personal Leave',
    'Sick Leave',
    'Maternity Leave',
    'Emergency Leave',
    'Annual Leave',
    'Others',
] as const;

const DETAILS_OPTIONS = ['W/ medical Report', 'W/ Out medical Report'] as const;

export default function LeaveRequestsEdit({
    leaveRequest,
    employees,
    departments,
    signaturesUrl,
    submitUrl,
    canDecide,
}: {
    leaveRequest: LeaveRequest;
    employees: Employee[];
    departments: { id: number; name: string }[];
    signaturesUrl: string;
    submitUrl: string;
    canDecide: boolean;
}) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(String(leaveRequest.employee_id));
    const [departmentId, setDepartmentId] = useState<string>(String(leaveRequest.department_id));

    const selectedEmployee = employees.find((e) => e.id === Number(selectedEmployeeId));
    const departmentName = selectedEmployee?.department?.name ?? departments.find((d) => d.id === Number(departmentId))?.name ?? '';

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

    const absenceType = leaveRequest.absence_types?.[0] ?? '';
    const statusNorm = normalizeRequestStatus(leaveRequest.status);
    const isDraft = statusNorm === 'draft';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leave Requests', href: '/leave-requests' },
        { title: leaveRequest.code ?? 'Edit', href: `/leave-requests/${leaveRequest.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit leave request" />
            <div className="flex min-h-screen flex-col bg-muted/30">
                <div className="border-b bg-card px-4 py-6 md:px-8">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
                        <Link
                            href={`/leave-requests/${leaveRequest.id}`}
                            className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ChevronLeft className="size-4" />
                            Back to request
                        </Link>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Edit leave request</h1>
                                <p className="text-muted-foreground mt-1">
                                    Update details and signature for {leaveRequest.code}. Submitting still happens from
                                    the request view when the record is a draft.
                                </p>
                            </div>
                            <RequestStatusBadge status={leaveRequest.status} />
                        </div>
                    </div>
                </div>

                <Form
                    action={`/leave-requests/${leaveRequest.id}`}
                    method="post"
                    className="px-4 py-8 md:px-8"
                    options={{ preserveScroll: true }}
                >
                    {({ errors }) => (
                        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-3">
                                <FormValidationInlineAlert errors={errors as Record<string, unknown>} />
                            </div>
                            <input type="hidden" name="_method" value="PUT" />
                            <input type="hidden" name="employee_id" value={selectedEmployeeId} />
                            <input type="hidden" name="department_id" value={departmentId} />

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
                                                <SelectTrigger id="employee_id" className="h-10 w-full">
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
                                                className="h-10"
                                                defaultValue={
                                                    leaveRequest.date ?? new Date().toISOString().slice(0, 10)
                                                }
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
                                                defaultValue={absenceType}
                                                className="border-input flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            >
                                                <option value="">Select type</option>
                                                {ABSENCE_TYPES.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors?.absence_type} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="absence_other">Other (if Others)</Label>
                                            <Input
                                                id="absence_other"
                                                name="absence_other"
                                                placeholder="Specify"
                                                className="h-10"
                                                defaultValue={leaveRequest.absence_other ?? ''}
                                            />
                                            <InputError message={errors?.absence_other} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="details">Details</Label>
                                            <select
                                                id="details"
                                                name="details"
                                                defaultValue={leaveRequest.details ?? ''}
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
                                                className="h-10"
                                                defaultValue={leaveRequest.period_from ?? ''}
                                            />
                                            <InputError message={errors?.period_from} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="period_to">Period to</Label>
                                            <Input
                                                id="period_to"
                                                name="period_to"
                                                type="date"
                                                className="h-10"
                                                defaultValue={leaveRequest.period_to ?? ''}
                                            />
                                            <InputError message={errors?.period_to} />
                                        </div>

                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="remarks">Remarks</Label>
                                            <textarea
                                                id="remarks"
                                                name="remarks"
                                                rows={4}
                                                defaultValue={leaveRequest.remarks ?? ''}
                                                className="border-input flex min-h-[96px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            />
                                            <InputError message={errors?.remarks} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <RequestEmployeeSignatureCard
                                    signatureUrl={leaveRequest.employee_signature_url ?? null}
                                    signaturesUrl={signaturesUrl}
                                    visitOnly={leaveRequestEditSignatureVisitOnly}
                                    allowEmployeeSignatureEdit={statusNorm === 'draft'}
                                    additionalSignatures={[
                                        {
                                            label: 'Manager / HR signature',
                                            signatureUrl: leaveRequest.approved_by_signature_url ?? null,
                                            fieldName: 'approved_by_signature',
                                            editable: statusNorm === 'submitted' && canDecide,
                                            emptyReadonlyMessage: canDecide
                                                ? undefined
                                                : statusNorm === 'draft'
                                                  ? 'Available after the request is submitted.'
                                                  : 'Awaiting manager or HR signature.',
                                            signerName: employeeFullName(leaveRequest.approved_by_employee),
                                        },
                                    ]}
                                    employeeName={
                                        employeeFullName(leaveRequest.employee) ??
                                        employeeFullName(selectedEmployee)
                                    }
                                />
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
                                            <div>
                                                <p className="text-muted-foreground text-xs">Request</p>
                                                <p className="font-medium">{leaveRequest.code}</p>
                                            </div>
                                            <div className="rounded-md border bg-muted/30 p-2">
                                                {selectedEmployee
                                                    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                                                    : 'No employee selected'}
                                            </div>
                                            <div className="rounded-md border bg-muted/30 p-2">
                                                {departmentName || 'No department selected'}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {isDraft ? (
                                                <Link href={submitUrl} method="post" as="button" className="w-full">
                                                    <Button type="button" variant="secondary" className="w-full">
                                                        <Send className="mr-2 size-4" />
                                                        Submit request
                                                    </Button>
                                                </Link>
                                            ) : null}
                                            <Button type="submit" className="w-full">
                                                <Save className="mr-2 size-4" />
                                                Update leave request
                                            </Button>
                                            <Link href={`/leave-requests/${leaveRequest.id}`} className="block">
                                                <Button type="button" variant="ghost" className="w-full">
                                                    Cancel
                                                </Button>
                                            </Link>
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
