import { Form, Head, Link, useForm } from '@inertiajs/react';
import { Ban, Calendar, Save } from 'lucide-react';
import { ActivityLogTimeline, type ActivityLogTimelineEntry } from '@/components/activity-log-timeline';
import { FormValidationInlineAlert } from '@/components/form-validation-inline-alert';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import {
    RequestEmployeeSignatureCard,
    employeeRequestEditSignatureVisitOnly,
} from '@/components/request-employee-signature-card';
import { normalizeRequestStatus } from '@/components/request-status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { employeeFullName } from '@/lib/format-employee-name';
import { useI18n } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';

const inputClassName =
    'border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

type EmployeeOption = {
    id: number;
    first_name: string;
    last_name: string;
    department_id: number | null;
    job_position_id: number | null;
};

type DepartmentOption = {
    id: number;
    name: string;
};

type JobPositionOption = {
    id: number;
    name: string;
};

type EmployeeRequest = {
    id: number;
    employee_id: number;
    job_position_id: number;
    department_id: number;
    date: string;
    date_of_joining: string;
    status: string;
    departure_date: string | null;
    arrival_date: string | null;
    preferred_airlines: string | null;
    last_encashment_date: string | null;
    bag_allowance: string | null;
    ticket_booking?: boolean;
    passport_request?: boolean;
    ticket_encashment?: boolean;
    amount_2000?: boolean;
    amount_1000?: boolean;
    leave_salary?: string | null;
    passport_ack_airline_name?: string | null;
    passport_ack_home_country?: string | null;
    passport_ack_departure_date_time?: string | null;
    passport_ack_home_country_departure_date_time?: string | null;
    employee_signature_url?: string | null;
    approved_by_signature_url?: string | null;
    ceo_signature_url?: string | null;
    employee?: { first_name: string; last_name: string };
    approved_by_employee?: { first_name: string; last_name: string } | null;
};

export default function Edit({
    employeeRequest,
    employees,
    departments,
    jobPositions,
    signaturesUrl,
    canDecide,
    cancelUrl,
    canCancel = false,
    canViewActivityLogs = false,
    activityLogs,
}: {
    employeeRequest: EmployeeRequest;
    employees: EmployeeOption[];
    departments: DepartmentOption[];
    jobPositions: JobPositionOption[];
    signaturesUrl: string;
    canDecide: boolean;
    cancelUrl: string;
    canCancel?: boolean;
    canViewActivityLogs?: boolean;
    activityLogs: ActivityLogTimelineEntry[];
}) {
    const { t } = useI18n();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employee Requests', href: '/employee-requests' },
        { title: `Edit #${employeeRequest.id}`, href: '#' },
    ];

    const { data, setData, processing, errors, put, transform } = useForm<{
        employee_id: number | '';
        job_position_id: number | '';
        department_id: number | '';
        date: string;
        date_of_joining: string;
        status: string;
        departure_date: string;
        arrival_date: string;
        preferred_airlines: string;
        last_encashment_date: string;
        bag_allowance: string;
        ticket_booking: boolean;
        passport_request: boolean;
        ticket_encashment: boolean;
        amount_2000: boolean;
        amount_1000: boolean;
        leave_salary: string;
        passport_ack_airline_name: string;
        passport_ack_home_country: string;
        passport_ack_departure_date_time: string;
        passport_ack_home_country_departure_date_time: string;
    }>({
        employee_id: employeeRequest.employee_id,
        job_position_id: employeeRequest.job_position_id,
        department_id: employeeRequest.department_id,
        date: employeeRequest.date,
        date_of_joining: employeeRequest.date_of_joining,
        status: employeeRequest.status,
        departure_date: employeeRequest.departure_date ?? '',
        arrival_date: employeeRequest.arrival_date ?? '',
        preferred_airlines: employeeRequest.preferred_airlines ?? '',
        last_encashment_date: employeeRequest.last_encashment_date ?? '',
        bag_allowance: employeeRequest.bag_allowance ?? '',
        ticket_booking: Boolean(employeeRequest.ticket_booking),
        passport_request: Boolean(employeeRequest.passport_request),
        ticket_encashment: Boolean(employeeRequest.ticket_encashment),
        amount_2000: Boolean(employeeRequest.amount_2000),
        amount_1000: Boolean(employeeRequest.amount_1000),
        leave_salary: employeeRequest.leave_salary ?? '',
        passport_ack_airline_name: employeeRequest.passport_ack_airline_name ?? '',
        passport_ack_home_country: employeeRequest.passport_ack_home_country ?? '',
        passport_ack_departure_date_time: employeeRequest.passport_ack_departure_date_time ?? '',
        passport_ack_home_country_departure_date_time: employeeRequest.passport_ack_home_country_departure_date_time ?? '',
    });

    const selectedEmployee = employees.find((item) => item.id === data.employee_id);

    const submitAs = (status: 'draft' | 'submitted') => (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status }));
        put(`/employee-requests/${employeeRequest.id}`);
    };

    const saveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status: data.status || employeeRequest.status }));
        put(`/employee-requests/${employeeRequest.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Employee Request #${employeeRequest.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href="/employee-requests"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    ← Back to Employee Requests
                </Link>

                <Heading
                    title={`Employee Request #${employeeRequest.id}`}
                    description="Update employee information, request details, and signature."
                />
                <div className="flex justify-end">
                    <Button type="button" onClick={saveChanges} disabled={processing}>
                        <Save className="mr-2 size-4" />
                        Save changes
                    </Button>
                </div>
                {canCancel ? (
                    <div className="flex justify-end">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button type="button" variant="destructive">
                                    <Ban className="mr-2 size-4" />
                                    Cancel request
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>Cancel employee request?</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to cancel this employee request? This record will stay in the system.
                                </DialogDescription>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">
                                            Keep request
                                        </Button>
                                    </DialogClose>
                                    <Form
                                        action={cancelUrl}
                                        method="delete"
                                        options={{ preserveScroll: true }}
                                        className="contents"
                                    >
                                        {({ processing: cancelling }) => (
                                            <Button type="submit" variant="destructive" disabled={cancelling}>
                                                Cancel request
                                            </Button>
                                        )}
                                    </Form>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : null}

                <form
                    className="flex w-full max-w-4xl flex-col gap-6"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <FormValidationInlineAlert errors={errors as Record<string, unknown>} />
                    <Card>
                        <CardHeader>
                            <CardTitle>Employee information</CardTitle>
                            <CardDescription>
                                Select the employee and their role details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="employee_id">Employee</Label>
                                <select
                                    id="employee_id"
                                    name="employee_id"
                                    required
                                    value={data.employee_id}
                                    onChange={(e) => {
                                        const employeeId = e.target.value ? Number(e.target.value) : '';
                                        const employee = employees.find((item) => item.id === employeeId);

                                        setData((previous) => ({
                                            ...previous,
                                            employee_id: employeeId,
                                            department_id: employee?.department_id ?? '',
                                            job_position_id: employee?.job_position_id ?? '',
                                        }));
                                    }}
                                    className={inputClassName}
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
                                <Label htmlFor="job_position_id">Job position</Label>
                                <input
                                    id="job_position_id"
                                    type="text"
                                    readOnly
                                    value={
                                        data.job_position_id
                                            ? (jobPositions.find((position) => position.id === data.job_position_id)?.name ?? '')
                                            : ''
                                    }
                                    placeholder="Select employee first"
                                    className={inputClassName}
                                />
                                <input type="hidden" name="job_position_id" value={data.job_position_id} />
                                <InputError message={errors.job_position_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="department_id">Department</Label>
                                <input
                                    id="department_id"
                                    type="text"
                                    readOnly
                                    value={
                                        data.department_id
                                            ? (departments.find((department) => department.id === data.department_id)?.name ?? '')
                                            : ''
                                    }
                                    placeholder="Select employee first"
                                    className={inputClassName}
                                />
                                <input type="hidden" name="department_id" value={data.department_id} />
                                <InputError message={errors.department_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date" className="flex items-center gap-2">
                                    <Calendar className="size-4" />
                                    Date
                                </Label>
                                <div className="relative">
                                    <input
                                        id="date"
                                        name="date"
                                        type="date"
                                        required
                                        value={data.date}
                                        onChange={(e) =>
                                            setData('date', e.target.value)
                                        }
                                        className={inputClassName + ' pr-9'}
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <InputError message={errors.date} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date_of_joining" className="flex items-center gap-2">
                                    <Calendar className="size-4" />
                                    Date of joining
                                </Label>
                                <div className="relative">
                                    <input
                                        id="date_of_joining"
                                        name="date_of_joining"
                                        type="date"
                                        required
                                        value={data.date_of_joining}
                                        onChange={(e) =>
                                            setData(
                                                'date_of_joining',
                                                e.target.value
                                            )
                                        }
                                        className={inputClassName + ' pr-9'}
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <InputError message={errors.date_of_joining} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Request details</CardTitle>
                            <CardDescription>
                                Travel and allowance information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 p-5">
                                <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-foreground">
                                            Request type
                                        </p>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="flex cursor-pointer items-center gap-3 text-sm leading-none">
                                                <Checkbox
                                                    id="edit_ticket_booking"
                                                    checked={data.ticket_booking}
                                                    onCheckedChange={(v) =>
                                                        setData('ticket_booking', v === true)
                                                    }
                                                />
                                                <span>Ticket booking</span>
                                            </label>
                                            <label className="flex cursor-pointer items-center gap-3 text-sm leading-none">
                                                <Checkbox
                                                    id="edit_passport_request"
                                                    checked={data.passport_request}
                                                    onCheckedChange={(v) =>
                                                        setData('passport_request', v === true)
                                                    }
                                                />
                                                <span>Passport</span>
                                            </label>
                                            <label className="flex cursor-pointer items-center gap-3 text-sm leading-none">
                                                <Checkbox
                                                    id="edit_ticket_encashment"
                                                    checked={data.ticket_encashment}
                                                    onCheckedChange={(v) =>
                                                        setData('ticket_encashment', v === true)
                                                    }
                                                />
                                                <span>Ticket encashment</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-end gap-3 border-t border-border pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                                        <p className="text-sm font-semibold text-foreground">Amount</p>
                                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-md border border-border/80 bg-background/80 px-4 py-3">
                                            <label className="flex cursor-pointer items-center gap-2.5 text-sm tabular-nums">
                                                <span className="min-w-[2.5rem] font-medium">2000</span>
                                                <Checkbox
                                                    id="edit_amount_2000"
                                                    checked={data.amount_2000}
                                                    onCheckedChange={(v) =>
                                                        setData((prev) => ({
                                                            ...prev,
                                                            amount_2000: v === true,
                                                            amount_1000: v === true ? false : prev.amount_1000,
                                                        }))
                                                    }
                                                />
                                            </label>
                                            <label className="flex cursor-pointer items-center gap-2.5 text-sm tabular-nums">
                                                <span className="min-w-[2.5rem] font-medium">1000</span>
                                                <Checkbox
                                                    id="edit_amount_1000"
                                                    checked={data.amount_1000}
                                                    onCheckedChange={(v) =>
                                                        setData((prev) => ({
                                                            ...prev,
                                                            amount_1000: v === true,
                                                            amount_2000: v === true ? false : prev.amount_2000,
                                                        }))
                                                    }
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="departure_date" className="flex items-center gap-2">
                                    <Calendar className="size-4 shrink-0" />
                                    Departure date
                                </Label>
                                <div className="relative w-full">
                                    <input
                                        id="departure_date"
                                        name="departure_date"
                                        type="date"
                                        value={data.departure_date}
                                        onChange={(e) =>
                                            setData(
                                                'departure_date',
                                                e.target.value
                                            )
                                        }
                                        className={inputClassName + ' w-full pr-9'}
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <InputError message={errors.departure_date} />
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="arrival_date" className="flex items-center gap-2">
                                    <Calendar className="size-4 shrink-0" />
                                    Arrival date
                                </Label>
                                <div className="relative w-full">
                                    <input
                                        id="arrival_date"
                                        name="arrival_date"
                                        type="date"
                                        value={data.arrival_date}
                                        onChange={(e) =>
                                            setData(
                                                'arrival_date',
                                                e.target.value
                                            )
                                        }
                                        className={inputClassName + ' w-full pr-9'}
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <InputError message={errors.arrival_date} />
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="preferred_airlines">Preferred airlines</Label>
                                <input
                                    id="preferred_airlines"
                                    name="preferred_airlines"
                                    type="text"
                                    value={data.preferred_airlines}
                                    onChange={(e) =>
                                        setData(
                                            'preferred_airlines',
                                            e.target.value
                                        )
                                    }
                                    className={inputClassName + ' w-full placeholder:text-muted-foreground'}
                                    placeholder="e.g. Qatar Airways, Emirates"
                                />
                                <InputError message={errors.preferred_airlines} />
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="last_encashment_date" className="flex items-center gap-2">
                                    <Calendar className="size-4 shrink-0" />
                                    Last encashment date
                                </Label>
                                <div className="relative w-full">
                                    <input
                                        id="last_encashment_date"
                                        name="last_encashment_date"
                                        type="date"
                                        value={data.last_encashment_date}
                                        onChange={(e) =>
                                            setData(
                                                'last_encashment_date',
                                                e.target.value
                                            )
                                        }
                                        className={inputClassName + ' w-full pr-9'}
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <InputError message={errors.last_encashment_date} />
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="bag_allowance">Bag allowance</Label>
                                <input
                                    id="bag_allowance"
                                    name="bag_allowance"
                                    type="text"
                                    value={data.bag_allowance}
                                    onChange={(e) =>
                                        setData('bag_allowance', e.target.value)
                                    }
                                    placeholder="e.g. 30kg"
                                    className={inputClassName + ' w-full placeholder:text-muted-foreground'}
                                />
                                <InputError message={errors.bag_allowance} />
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="leave_salary">Leave salary</Label>
                                <input
                                    id="leave_salary"
                                    name="leave_salary"
                                    type="text"
                                    value={data.leave_salary}
                                    onChange={(e) =>
                                        setData('leave_salary', e.target.value)
                                    }
                                    placeholder="Amount or details (optional)"
                                    className={inputClassName + ' w-full placeholder:text-muted-foreground'}
                                />
                                <InputError message={errors.leave_salary} />
                            </div>
                            <div className="grid gap-4 sm:col-span-2">
                                <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-4">
                                    <p className="text-sm font-semibold text-foreground">
                                        Passport acknowledgement / remarks / flight details
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        This is to acknowledge that I received my passport in good condition. Signed below with date.
                                    </p>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <div className="grid min-w-0 gap-2">
                                            <Label htmlFor="passport_ack_airline_name">Name of airlines</Label>
                                            <input
                                                id="passport_ack_airline_name"
                                                name="passport_ack_airline_name"
                                                type="text"
                                                value={data.passport_ack_airline_name}
                                                onChange={(e) =>
                                                    setData('passport_ack_airline_name', e.target.value)
                                                }
                                                className={inputClassName + ' w-full placeholder:text-muted-foreground'}
                                            />
                                            <InputError message={errors.passport_ack_airline_name} />
                                        </div>
                                        <div className="grid min-w-0 gap-2">
                                            <Label htmlFor="passport_ack_home_country">Home country</Label>
                                            <input
                                                id="passport_ack_home_country"
                                                name="passport_ack_home_country"
                                                type="text"
                                                value={data.passport_ack_home_country}
                                                onChange={(e) =>
                                                    setData('passport_ack_home_country', e.target.value)
                                                }
                                                className={inputClassName + ' w-full placeholder:text-muted-foreground'}
                                            />
                                            <InputError message={errors.passport_ack_home_country} />
                                        </div>
                                        <div className="grid min-w-0 gap-2">
                                            <Label htmlFor="passport_ack_departure_date_time">Departure date/time</Label>
                                            <input
                                                id="passport_ack_departure_date_time"
                                                name="passport_ack_departure_date_time"
                                                type="text"
                                                value={data.passport_ack_departure_date_time}
                                                onChange={(e) =>
                                                    setData('passport_ack_departure_date_time', e.target.value)
                                                }
                                                className={inputClassName + ' w-full placeholder:text-muted-foreground'}
                                            />
                                            <InputError message={errors.passport_ack_departure_date_time} />
                                        </div>
                                        <div className="grid min-w-0 gap-2">
                                            <Label htmlFor="passport_ack_home_country_departure_date_time">Home country departure date/time</Label>
                                            <input
                                                id="passport_ack_home_country_departure_date_time"
                                                name="passport_ack_home_country_departure_date_time"
                                                type="text"
                                                value={data.passport_ack_home_country_departure_date_time}
                                                onChange={(e) =>
                                                    setData('passport_ack_home_country_departure_date_time', e.target.value)
                                                }
                                                className={inputClassName + ' w-full placeholder:text-muted-foreground'}
                                            />
                                            <InputError message={errors.passport_ack_home_country_departure_date_time} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-3 border-t pt-6">
                            <Button
                                disabled={processing}
                                type="button"
                                onClick={submitAs('submitted')}
                            >
                                Submit
                            </Button>
                            <Link href="/employee-requests" className="ml-auto">
                                <Button type="button" variant="ghost">
                                    Cancel
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    <RequestEmployeeSignatureCard
                        signatureUrl={employeeRequest.employee_signature_url ?? null}
                        signaturesUrl={signaturesUrl}
                        visitOnly={employeeRequestEditSignatureVisitOnly}
                        allowEmployeeSignatureEdit={normalizeRequestStatus(employeeRequest.status) === 'draft'}
                        additionalSignatures={[
                            {
                                label: 'Manager / HR signature',
                                signatureUrl: employeeRequest.approved_by_signature_url ?? null,
                                fieldName: 'approved_by_signature',
                                editable:
                                    normalizeRequestStatus(employeeRequest.status) === 'submitted' && canDecide,
                                emptyReadonlyMessage: canDecide
                                    ? undefined
                                    : normalizeRequestStatus(employeeRequest.status) === 'draft'
                                      ? 'Available after the request is submitted.'
                                      : 'Awaiting manager or HR signature.',
                                signerName: employeeFullName(employeeRequest.approved_by_employee),
                            },
                            {
                                label: 'CEO signature',
                                signatureUrl: employeeRequest.ceo_signature_url ?? null,
                                fieldName: 'ceo_signature',
                                editable:
                                    normalizeRequestStatus(employeeRequest.status) === 'submitted' && canDecide,
                                emptyReadonlyMessage: canDecide
                                    ? undefined
                                    : normalizeRequestStatus(employeeRequest.status) === 'draft'
                                      ? 'Available after the request is submitted.'
                                      : 'Awaiting CEO signature.',
                            },
                        ]}
                        employeeName={
                            employeeFullName(employeeRequest.employee) ??
                            employeeFullName(selectedEmployee)
                        }
                    />
                    {canViewActivityLogs ? (
                        <ActivityLogTimeline
                            entries={activityLogs}
                            title={t('activity.title', 'Activity Log')}
                            description={t(
                                'activity.description.employeeRequest',
                                'Track employee request updates by authorized users.',
                            )}
                        />
                    ) : null}
                </form>
            </div>
        </AppLayout>
    );
}

