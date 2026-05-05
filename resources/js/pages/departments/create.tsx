import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import DepartmentController from '@/actions/App/Http/Controllers/DepartmentController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/departments';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Departments', href: index().url },
    { title: 'Create', href: '/departments/create' },
];

type EmployeeOption = {
    id: number;
    first_name: string;
    last_name: string;
};

export default function Create({ employees }: { employees: EmployeeOption[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Department" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    Back to Departments
                </Link>

                <Heading
                    title="Create Department"
                    description="Add a new department to the master list"
                />

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Department Information</CardTitle>
                        </CardHeader>
                        <Form
                            {...DepartmentController.store.form()}
                            className="w-full"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="code">
                                                Code <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="code"
                                                name="code"
                                                required
                                                maxLength={50}
                                                placeholder="e.g. DEPT-001"
                                                autoComplete="off"
                                            />
                                            <InputError message={errors.code} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="name">
                                                Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                required
                                                maxLength={255}
                                                placeholder="e.g. Engineering"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="description">
                                                Description
                                            </Label>
                                            <Textarea
                                                id="description"
                                                name="description"
                                                rows={4}
                                                maxLength={1000}
                                                placeholder="Optional description"
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
                                                defaultValue=""
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
                                    </CardContent>
                                    <CardFooter className="mt-2 flex gap-4 pt-2">
                                        <Button disabled={processing} type="submit">
                                            Create Department
                                        </Button>
                                        <Link href={index()}>
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </>
                            )}
                        </Form>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
