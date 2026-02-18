import { Head, Link, useForm } from '@inertiajs/react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const inputClassName =
    'border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employee Requests', href: '/employee-requests' },
    { title: 'Create', href: '/employee-requests/create' },
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
    jobPositions,
}: {
    employees: EmployeeOption[];
    departments: DepartmentOption[];
    jobPositions: JobPositionOption[];
}) {
    const { data, setData, post, processing, errors, transform } = useForm<{
        employee_id: number | '';
        job_position_id: number | '';
        department_id: number | '';
        date: string;
        date_of_joining: string;
        departure_date: string;
        arrival_date: string;
        preferred_airlines: string;
        last_encashment_date: string;
        bag_allowance: string;
        status: string;
    }>({
        employee_id: '',
        job_position_id: '',
        department_id: '',
        date: getTodayYmd(),
        date_of_joining: getTodayYmd(),
        departure_date: '',
        arrival_date: '',
        preferred_airlines: '',
        last_encashment_date: '',
        bag_allowance: '',
        status: 'draft',
    });

    const submitAs = (status: 'draft' | 'submitted') => (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status }));
        post('/employee-requests');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee Request" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href="/employee-requests"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    ← Back to Employee Requests
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Employee Request Form"
                        description="Capture employee information and request details"
                    />
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:gap-4 sm:shrink-0">
                        <div className="w-full min-w-[12rem] sm:w-auto">
                            <Label className="text-sm">Request Code</Label>
                            <input
                                type="text"
                                readOnly
                                value="Auto-generated (PRLER-YYYY-####)"
                                className="border-input mt-1.5 flex h-9 w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
                            />
                        </div>
                    </div>
                </div>

                <form
                    className="flex w-full max-w-4xl flex-col gap-6"
                    onSubmit={(e) => e.preventDefault()}
                >
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
                                    onChange={(e) =>
                                        setData(
                                            'employee_id',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
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
                                    className={inputClassName}
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
                                    className={inputClassName}
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
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="departure_date" className="flex items-center gap-2">
                                    <Calendar className="size-4" />
                                    Departure date
                                </Label>
                                <div className="relative">
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
                                        className={inputClassName + ' pr-9'}
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <InputError message={errors.departure_date} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="arrival_date" className="flex items-center gap-2">
                                    <Calendar className="size-4" />
                                    Arrival date
                                </Label>
                                <div className="relative">
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
                                        className={inputClassName + ' pr-9'}
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <InputError message={errors.arrival_date} />
                            </div>
                            <div className="grid gap-2">
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
                                    className={inputClassName + ' placeholder:text-muted-foreground'}
                                    placeholder="e.g. Qatar Airways, Emirates"
                                />
                                <InputError message={errors.preferred_airlines} />
                            </div>
                            <div className="grid gap-2">
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
                                    className={inputClassName + ' placeholder:text-muted-foreground'}
                                />
                                <InputError message={errors.bag_allowance} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="last_encashment_date" className="flex items-center gap-2">
                                    <Calendar className="size-4" />
                                    Last encashment date
                                </Label>
                                <div className="relative max-w-xs">
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
                                        className={inputClassName + ' pr-9'}
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <InputError message={errors.last_encashment_date} />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-3 border-t pt-6">
                            <Button
                                disabled={processing}
                                type="button"
                                variant="outline"
                                onClick={submitAs('draft')}
                            >
                                Save draft
                            </Button>
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
                </form>
            </div>
        </AppLayout>
    );
}

