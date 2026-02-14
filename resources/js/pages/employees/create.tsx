import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employees', href: index().url },
    { title: 'Create', href: '/employees/create' },
];

type Department = {
    id: number;
    code: string;
    name: string;
};

type JobPosition = {
    id: number;
    code: string;
    name: string;
};

export default function Create({
    departments,
    jobPositions,
}: {
    departments: Department[];
    jobPositions: JobPosition[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Employees
                </Link>

                <Heading
                    title="Create Employee"
                    description="Add a new employee to the master list"
                />

                <Form
                    {...EmployeeController.store.form()}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="max-w-md space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="employee_code">
                                        Employee Code
                                    </Label>
                                    <Input
                                        id="employee_code"
                                        name="employee_code"
                                        required
                                        maxLength={50}
                                        placeholder="e.g. EMP-0001"
                                        autoComplete="off"
                                    />
                                    <InputError
                                        message={errors.employee_code}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">
                                            First Name
                                        </Label>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            required
                                            maxLength={255}
                                            placeholder="John"
                                        />
                                        <InputError
                                            message={errors.first_name}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">
                                            Last Name
                                        </Label>
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            required
                                            maxLength={255}
                                            placeholder="Doe"
                                        />
                                        <InputError
                                            message={errors.last_name}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email_address">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email_address"
                                        name="email_address"
                                        type="email"
                                        required
                                        maxLength={255}
                                        placeholder="john.doe@example.com"
                                    />
                                    <InputError
                                        message={errors.email_address}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="contact_number">
                                        Contact Number
                                    </Label>
                                    <Input
                                        id="contact_number"
                                        name="contact_number"
                                        maxLength={50}
                                        placeholder="+1 234 567 8900"
                                    />
                                    <InputError
                                        message={errors.contact_number}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="address_1">
                                        Address 1
                                    </Label>
                                    <Input
                                        id="address_1"
                                        name="address_1"
                                        maxLength={255}
                                        placeholder="Street address"
                                    />
                                    <InputError message={errors.address_1} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="address_2">
                                        Address 2
                                    </Label>
                                    <Input
                                        id="address_2"
                                        name="address_2"
                                        maxLength={255}
                                        placeholder="Apt, suite, etc. (optional)"
                                    />
                                    <InputError message={errors.address_2} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="department_id">
                                        Department
                                    </Label>
                                    <select
                                        id="department_id"
                                        name="department_id"
                                        required
                                        className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">
                                            Select department
                                        </option>
                                        {departments.map((dept) => (
                                            <option
                                                key={dept.id}
                                                value={dept.id}
                                            >
                                                {dept.code} — {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.department_id}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="job_position_id">
                                        Job Position
                                    </Label>
                                    <select
                                        id="job_position_id"
                                        name="job_position_id"
                                        required
                                        className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">
                                            Select job position
                                        </option>
                                        {jobPositions.map((job) => (
                                            <option
                                                key={job.id}
                                                value={job.id}
                                            >
                                                {job.code} — {job.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.job_position_id}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <Button disabled={processing} type="submit">
                                        Create Employee
                                    </Button>
                                    <Link href={index()}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
