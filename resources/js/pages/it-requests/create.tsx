import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ItRequestController from '@/actions/App/Http/Controllers/ItRequestController';
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

    const submitAs = (status: 'draft' | 'submitted') => (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status }));
        post(ItRequestController.store.post().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create IT Request" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to IT Requests
                </Link>

                <Heading
                    title="Create IT Request"
                    description="Submit a new IT request"
                />

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
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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

                    <div className="flex gap-4">
                        <Button
                            disabled={processing}
                            type="button"
                            variant="outline"
                            onClick={submitAs('draft')}
                        >
                            Save (Draft)
                        </Button>
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

