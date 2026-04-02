import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, Cpu, Laptop, Send, User } from 'lucide-react';
import ItRequestController from '@/actions/App/Http/Controllers/ItRequestController';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'IT Requests', href: index().url },
    { title: 'Create', href: '/it-requests/create' },
];

function getTodayYmd(): string
{
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export default function Create({
    employees,
    departments,
    software,
    hardware,
}: {
    employees: EmployeeOption[];
    departments: DepartmentOption[];
    software: SoftwareOption[];
    hardware: HardwareOption[];
}) {
    const { data, setData, post, processing, errors, transform } = useForm<{
        employee_id: number | '';
        department_id: number | '';
        date: string;
        software_id: number | '';
        hardware_id: number | '';
        status: string;
    }>({
        employee_id: '',
        department_id: '',
        date: getTodayYmd(),
        software_id: '',
        hardware_id: '',
        status: 'draft',
    });

    const selectedEmployee = employees.find((employee) => employee.id === data.employee_id);

    const submitAs = (status: 'draft' | 'submitted') => (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status }));
        post(ItRequestController.store.post().url);
    };

    const selectedDepartmentName = data.department_id
        ? (departments.find((department) => department.id === data.department_id)?.name ?? '')
        : '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create IT Request" />

            <div className="flex min-h-screen flex-1 flex-col bg-muted/30">
                <div className="border-b bg-card px-4 py-6 md:px-8">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
                        <Link
                            href={index()}
                            className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to IT Requests
                        </Link>
                        <Heading
                            title="Create IT Request"
                            description="Submit software and hardware requirements for an employee."
                        />
                    </div>
                </div>

                <div className="px-4 py-8 md:px-8">
                    <form
                        className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-3"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <div className="space-y-6 lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="size-4 text-muted-foreground" />
                                        Employee Details
                                    </CardTitle>
                                    <CardDescription>
                                        Choose employee and verify department mapping.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
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
                                        <Label htmlFor="date" className="flex items-center gap-2">
                                            <Calendar className="size-4" />
                                            Date
                                        </Label>
                                        <input
                                            id="date"
                                            name="date"
                                            type="date"
                                            required
                                            value={data.date}
                                            onChange={(e) => setData('date', e.target.value)}
                                            className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <InputError message={errors.date} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="department_id" className="flex items-center gap-2">
                                            <Building2 className="size-4" />
                                            Department
                                        </Label>
                                        <input
                                            id="department_id"
                                            type="text"
                                            readOnly
                                            value={selectedDepartmentName}
                                            placeholder="Select employee first"
                                            className="border-input flex h-10 w-full rounded-md border bg-muted/50 px-3 py-2 text-sm shadow-xs"
                                        />
                                        <input type="hidden" name="department_id" value={data.department_id} />
                                        <InputError message={errors.department_id} />
                                        {selectedEmployee?.department_id === null && (
                                            <p className="text-xs text-muted-foreground">
                                                Selected employee has no department assigned.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Cpu className="size-4 text-muted-foreground" />
                                        IT Requirements
                                    </CardTitle>
                                    <CardDescription>
                                        Select software and/or hardware needed.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="software_id">Software Required</Label>
                                        <select
                                            id="software_id"
                                            name="software_id"
                                            value={data.software_id}
                                            onChange={(e) =>
                                                setData('software_id', e.target.value ? Number(e.target.value) : '')
                                            }
                                            className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Select software (optional)</option>
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
                                                setData('hardware_id', e.target.value ? Number(e.target.value) : '')
                                            }
                                            className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Select hardware (optional)</option>
                                            {hardware.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.code} - {item.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.hardware_id} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="sticky top-6 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Request Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                                            <User className="size-4 text-muted-foreground" />
                                            <span>
                                                {selectedEmployee
                                                    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                                                    : 'No employee selected'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                                            <Building2 className="size-4 text-muted-foreground" />
                                            <span>{selectedDepartmentName || 'No department selected'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                                            <Laptop className="size-4 text-muted-foreground" />
                                            <span>
                                                {data.software_id || data.hardware_id
                                                    ? 'Requirements selected'
                                                    : 'No IT requirements selected'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button
                                            disabled={processing}
                                            type="button"
                                            className="w-full"
                                            onClick={submitAs('submitted')}
                                        >
                                            <Send className="mr-2 size-4" />
                                            Submit
                                        </Button>
                                        <Button
                                            disabled={processing}
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={submitAs('draft')}
                                        >
                                            Save (Draft)
                                        </Button>
                                        <Link href={index()} className="block">
                                            <Button type="button" variant="ghost" className="w-full">
                                                Cancel
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

