import { Form, Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Ban } from 'lucide-react';
import ItRequestController from '@/actions/App/Http/Controllers/ItRequestController';
import { FormValidationInlineAlert } from '@/components/form-validation-inline-alert';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import {
    RequestEmployeeSignatureCard,
    itRequestEditSignatureVisitOnly,
} from '@/components/request-employee-signature-card';
import { normalizeRequestStatus } from '@/components/request-status-badge';
import { Button } from '@/components/ui/button';
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
import { index } from '@/routes/it-requests';
import type { BreadcrumbItem } from '@/types';

type EmployeeOption = {
    id: number;
    first_name: string;
    last_name: string;
    department_id: number | null;
};

type DepartmentOption = {
    id: number;
    name: string;
};

type ItRequest = {
    id: number;
    employee_id: number;
    department_id: number;
    software_id: number | null;
    hardware_id: number | null;
    date: string;
    status: string;
    employee_signature_url?: string | null;
    approved_by_signature_url?: string | null;
    employee?: { first_name: string; last_name: string };
    approved_by_employee?: { first_name: string; last_name: string } | null;
};

type SoftwareOption = {
    id: number;
    code: string;
    name: string;
};

type HardwareOption = {
    id: number;
    code: string;
    name: string;
};

export default function Edit({
    itRequest,
    employees,
    departments,
    software,
    hardware,
    signaturesUrl,
    canDecide,
    cancelUrl,
    canCancel = false,
}: {
    itRequest: ItRequest;
    employees: EmployeeOption[];
    departments: DepartmentOption[];
    software: SoftwareOption[];
    hardware: HardwareOption[];
    signaturesUrl: string;
    canDecide: boolean;
    cancelUrl: string;
    canCancel?: boolean;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'IT Requests', href: index().url },
        { title: `Edit #${itRequest.id}`, href: '#' },
    ];

    const { data, setData, processing, errors, put, transform } = useForm<{
        employee_id: number | '';
        department_id: number | '';
        software_id: number | '';
        hardware_id: number | '';
        date: string;
        status: string;
    }>({
        employee_id: itRequest.employee_id,
        department_id: itRequest.department_id,
        software_id: itRequest.software_id ?? '',
        hardware_id: itRequest.hardware_id ?? '',
        date: itRequest.date,
        status: itRequest.status,
    });

    const selectedEmployee = employees.find((employee) => employee.id === data.employee_id);
    const statusNorm = normalizeRequestStatus(data.status || itRequest.status);

    const saveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status: data.status || itRequest.status }));
        put(ItRequestController.update.put(itRequest.id).url);
    };

    const submitAs = (status: 'draft' | 'submitted') => (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status }));
        put(ItRequestController.update.put(itRequest.id).url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit IT Request #${itRequest.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to IT Requests
                </Link>

                <Heading
                    title={`Edit IT Request #${itRequest.id}`}
                    description="Update the IT request details and employee signature."
                />
                <div className="flex justify-end">
                    <Button type="button" onClick={saveChanges} disabled={processing}>
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
                                <DialogTitle>Cancel IT request?</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to cancel this IT request? This record will stay in the system.
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

                <FormValidationInlineAlert errors={errors as Record<string, unknown>} />

                <form
                    className="space-y-6 max-w-xl"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <div className="grid gap-2">
                        <Label htmlFor="employee_id">Name</Label>
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
                                }));
                            }}
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <input type="hidden" name="department_id" value={data.department_id} />
                        <InputError message={errors.department_id} />
                        {selectedEmployee?.department_id === null && (
                            <p className="text-xs text-muted-foreground">
                                Selected employee has no department assigned.
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="software_id">Software Required</Label>
                        <select
                            id="software_id"
                            name="software_id"
                            value={data.software_id}
                            onChange={(e) =>
                                setData(
                                    'software_id',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : '',
                                )
                            }
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">
                                Select software (optional)
                            </option>
                            {software.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.code} - {item.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.software_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="hardware_id">Hardware Request</Label>
                        <select
                            id="hardware_id"
                            name="hardware_id"
                            value={data.hardware_id}
                            onChange={(e) =>
                                setData(
                                    'hardware_id',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : '',
                                )
                            }
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">
                                Select hardware (optional)
                            </option>
                            {hardware.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.code} - {item.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.hardware_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            required
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.date} />
                    </div>

                    <RequestEmployeeSignatureCard
                        signatureUrl={itRequest.employee_signature_url ?? null}
                        signaturesUrl={signaturesUrl}
                        visitOnly={itRequestEditSignatureVisitOnly}
                        allowEmployeeSignatureEdit={statusNorm === 'draft'}
                        additionalSignatures={[
                            {
                                label: 'Manager / HR signature',
                                signatureUrl: itRequest.approved_by_signature_url ?? null,
                                fieldName: 'approved_by_signature',
                                editable: statusNorm === 'submitted' && canDecide,
                                emptyReadonlyMessage: canDecide
                                    ? undefined
                                    : statusNorm === 'draft'
                                      ? 'Available after the request is submitted.'
                                      : 'Awaiting manager or HR signature.',
                                signerName: employeeFullName(itRequest.approved_by_employee),
                            },
                        ]}
                        employeeName={
                            employeeFullName(itRequest.employee) ?? employeeFullName(selectedEmployee)
                        }
                    />

                    <div className="flex gap-4">
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

