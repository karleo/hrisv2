import { Form, Head, Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useCallback, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { BreadcrumbItem } from '@/types';

type Department = { id: number; name: string };
type Employee = { id: number; first_name: string; last_name: string; department_id: number; department?: Department };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Requests', href: '/leave-requests' },
    { title: 'New request', href: '/leave-requests/create' },
];

const ABSENCE_TYPES = [
    'Personal Leave',
    'Sick Leave',
    'Maternity Leave',
    'Emergency Leave',
    'Annual Leave',
    'Others',
] as const;

const DETAILS_OPTIONS = ['W/ medical Report', 'W/ Out medical Report'] as const;

export default function LeaveRequestsCreate({
    employees,
    departments,
}: {
    employees: Employee[];
    departments: { id: number; name: string }[];
}) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [departmentId, setDepartmentId] = useState<string>('');

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New leave request" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/leave-requests">
                            <ChevronLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold">New leave request</h1>
                </div>

                <Form
                    action="/leave-requests"
                    method="post"
                    className="max-w-2xl space-y-6"
                    options={{ preserveScroll: true }}
                >
                    {({ errors }) => (
                        <>
                    <input type="hidden" name="employee_id" value={selectedEmployeeId} />
                    <input type="hidden" name="department_id" value={departmentId} />
                    <Card>
                        <CardHeader>
                            <CardTitle>Request details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    defaultValue={new Date().toISOString().slice(0, 10)}
                                />
                                <InputError message={errors?.date} />
                            </div>

                            <div className="grid gap-2">
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
                                <Label>Department</Label>
                                <div className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                                    {departmentName || (selectedEmployeeId ? '—' : 'Select an employee first')}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="absence_type">Absence type *</Label>
                                <select
                                    id="absence_type"
                                    name="absence_type"
                                    required
                                    className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                                <Label htmlFor="absence_other">Other (if type is Others)</Label>
                                <Input id="absence_other" name="absence_other" placeholder="Specify" />
                                <InputError message={errors?.absence_other} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="details">Details</Label>
                                <select
                                    id="details"
                                    name="details"
                                    className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="period_from">Period from</Label>
                                    <Input id="period_from" name="period_from" type="date" />
                                    <InputError message={errors?.period_from} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="period_to">Period to</Label>
                                    <Input id="period_to" name="period_to" type="date" />
                                    <InputError message={errors?.period_to} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <textarea
                                    id="remarks"
                                    name="remarks"
                                    rows={3}
                                    className="border-input flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <InputError message={errors?.remarks} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Create leave request</Button>
                        </CardFooter>
                    </Card>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
