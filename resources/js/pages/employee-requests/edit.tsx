import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
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
};

export default function Edit({
    employeeRequest,
    employees,
    departments,
    jobPositions,
}: {
    employeeRequest: EmployeeRequest;
    employees: EmployeeOption[];
    departments: DepartmentOption[];
    jobPositions: JobPositionOption[];
}) {
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
    });

    const submitAs = (status: 'draft' | 'submitted') => (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status }));
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
                    description="Capture employee information and request details"
                />

                <form
                    className="space-y-6 w-full"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <div className="grid gap-2">
                        <Label htmlFor="employee_id">Employee</Label>
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
                        <Label htmlFor="job_position_id">Job Position</Label>
                        <select
                            id="job_position_id"
                            name="job_position_id"
                            required
                            value={data.job_position_id}
                            onChange={(e) =>
                                setData(
                                    'job_position_id',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : '',
                                )
                            }
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Select job position</option>
                            {jobPositions.map((pos) => (
                                <option key={pos.id} value={pos.id}>
                                    {pos.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.job_position_id} />
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

                    <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            required
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.date} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="date_of_joining">Date of Joining</Label>
                        <input
                            id="date_of_joining"
                            name="date_of_joining"
                            type="date"
                            required
                            value={data.date_of_joining}
                            onChange={(e) =>
                                setData('date_of_joining', e.target.value)
                            }
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.date_of_joining} />
                    </div>

                    <h2 className="mt-4 text-sm font-medium text-muted-foreground">
                        Request details
                    </h2>

                    <div className="grid gap-2">
                        <Label htmlFor="departure_date">Departure date</Label>
                        <input
                            id="departure_date"
                            name="departure_date"
                            type="date"
                            value={data.departure_date}
                            onChange={(e) =>
                                setData('departure_date', e.target.value)
                            }
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.departure_date} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="arrival_date">Arrival date</Label>
                        <input
                            id="arrival_date"
                            name="arrival_date"
                            type="date"
                            value={data.arrival_date}
                            onChange={(e) =>
                                setData('arrival_date', e.target.value)
                            }
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.arrival_date} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="preferred_airlines">
                            Preferred airlines
                        </Label>
                        <input
                            id="preferred_airlines"
                            name="preferred_airlines"
                            type="text"
                            value={data.preferred_airlines}
                            onChange={(e) =>
                                setData('preferred_airlines', e.target.value)
                            }
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. Qatar Airways, Emirates"
                        />
                        <InputError message={errors.preferred_airlines} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="last_encashment_date">
                            Last Encashment Date
                        </Label>
                        <input
                            id="last_encashment_date"
                            name="last_encashment_date"
                            type="date"
                            value={data.last_encashment_date}
                            onChange={(e) =>
                                setData('last_encashment_date', e.target.value)
                            }
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.last_encashment_date} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bag_allowance">Bag Allowance</Label>
                        <input
                            id="bag_allowance"
                            name="bag_allowance"
                            type="text"
                            value={data.bag_allowance}
                            onChange={(e) =>
                                setData('bag_allowance', e.target.value)
                            }
                            placeholder="e.g. 30kg"
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.bag_allowance} />
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
                        <Link href="/employee-requests">
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

