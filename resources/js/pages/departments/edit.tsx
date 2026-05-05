import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import DepartmentController from '@/actions/App/Http/Controllers/DepartmentController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { edit, index } from '@/routes/departments';
import type { BreadcrumbItem } from '@/types';

type Department = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    manager_employee_id: number | null;
};

type EmployeeOption = {
    id: number;
    first_name: string;
    last_name: string;
};

export default function Edit({ department, employees }: { department: Department; employees: EmployeeOption[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Departments', href: index().url },
        {
            title: department.name,
            href: edit({ department: department.id }).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${department.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Departments
                </Link>

                <Heading
                    title="Edit Department"
                    description="Update department details"
                />

                <Form
                    {...DepartmentController.update.form(department.id)}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="max-w-md space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Code</Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        required
                                        maxLength={50}
                                        defaultValue={department.code}
                                        placeholder="e.g. DEPT-001"
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.code} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        required
                                        maxLength={255}
                                        defaultValue={department.name}
                                        placeholder="e.g. Engineering"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={4}
                                        maxLength={1000}
                                        defaultValue={
                                            department.description ?? ''
                                        }
                                        placeholder="Optional description"
                                        className="border-input focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="manager_employee_id">
                                        Department manager
                                    </Label>
                                    <select
                                        id="manager_employee_id"
                                        name="manager_employee_id"
                                        className="border-input text-foreground focus-visible:ring-ring h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                        defaultValue={department.manager_employee_id ?? ''}
                                    >
                                        <option value="" className="bg-background text-foreground">
                                            Select manager (optional)
                                        </option>
                                        {employees.map((employee) => (
                                            <option
                                                key={employee.id}
                                                value={employee.id}
                                                className="bg-background text-foreground"
                                            >
                                                {employee.first_name} {employee.last_name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.manager_employee_id} />
                                </div>

                                <div className="flex gap-4">
                                    <Button disabled={processing} type="submit">
                                        Update Department
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
