import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Briefcase, Plane, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/employee-requests';
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

type JobPositionOption = {
    id: number;
    name: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employee Requests', href: '/employee-requests' },
    { title: 'Create', href: '/employee-requests/create' },
];

function formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function toDdMmYyyy(iso: string): string {
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return '';
    }

    const [, yyyy, mm, dd] = match;

    return `${dd}/${mm}/${yyyy}`;
}

function getTodayYmd(): string
{
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function openDatePicker(ref: React.RefObject<HTMLInputElement>) {
    const el = ref.current;
    if (!el) return;

    // Some browsers won't open the picker for fully transparent inputs.
    // showPicker is supported in Chromium; focus/click is fallback.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).showPicker?.();
    el.focus();
    el.click();
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

    const selectedEmployee = employees.find((e) => e.id === data.employee_id);
    const selectedDepartment = departments.find((d) => d.id === data.department_id);
    const selectedJobPosition = jobPositions.find((j) => j.id === data.job_position_id);

    // Date input refs and display states
    const dateRef = useRef<HTMLInputElement>(null);
    const dateOfJoiningRef = useRef<HTMLInputElement>(null);
    const departureDateRef = useRef<HTMLInputElement>(null);
    const arrivalDateRef = useRef<HTMLInputElement>(null);
    const lastEncashmentDateRef = useRef<HTMLInputElement>(null);

    const [dateInput, setDateInput] = useState<string>(
        data.date ? toDdMmYyyy(data.date) : '',
    );
    const [dateOfJoiningInput, setDateOfJoiningInput] = useState<string>(
        data.date_of_joining ? toDdMmYyyy(data.date_of_joining) : '',
    );
    const [departureDateInput, setDepartureDateInput] = useState<string>(
        data.departure_date ? toDdMmYyyy(data.departure_date) : '',
    );
    const [arrivalDateInput, setArrivalDateInput] = useState<string>(
        data.arrival_date ? toDdMmYyyy(data.arrival_date) : '',
    );
    const [lastEncashmentDateInput, setLastEncashmentDateInput] = useState<string>(
        data.last_encashment_date ? toDdMmYyyy(data.last_encashment_date) : '',
    );

    // Sync display values when data changes
    useEffect(() => {
        setDateInput(data.date ? toDdMmYyyy(data.date) : '');
    }, [data.date]);

    useEffect(() => {
        setDateOfJoiningInput(data.date_of_joining ? toDdMmYyyy(data.date_of_joining) : '');
    }, [data.date_of_joining]);

    useEffect(() => {
        setDepartureDateInput(data.departure_date ? toDdMmYyyy(data.departure_date) : '');
    }, [data.departure_date]);

    useEffect(() => {
        setArrivalDateInput(data.arrival_date ? toDdMmYyyy(data.arrival_date) : '');
    }, [data.arrival_date]);

    useEffect(() => {
        setLastEncashmentDateInput(data.last_encashment_date ? toDdMmYyyy(data.last_encashment_date) : '');
    }, [data.last_encashment_date]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee Request" />

            <div className="flex min-h-screen w-full flex-col bg-muted/30">
                {/* Header Section */}
                <div className="border-b bg-card px-4 py-6 md:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6">
                        <Link
                            href={index()}
                            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Employee Requests
                        </Link>

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Create Employee Request
                                </h1>
                                <p className="text-muted-foreground">
                                    Capture employee information and request details
                                </p>
                            </div>

                            <div className="min-w-[200px]">
                                <Label className="text-sm font-medium">Request Code</Label>
                                <Input
                                    type="text"
                                    readOnly
                                    value="Auto-generated (PRLER-YYYY-####)"
                                    className="mt-1.5 bg-muted text-muted-foreground"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 px-4 py-8 md:px-8">
                    <form
                        className="mx-auto max-w-7xl"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Left Column - Main Form */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <User className="size-5 text-muted-foreground" />
                                            <CardTitle>Employee Information</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Select the employee and their role details
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="employee_id">
                                                Employee <span className="text-destructive">*</span>
                                            </Label>
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
                                            <Label htmlFor="job_position_id">
                                                Job Position <span className="text-destructive">*</span>
                                            </Label>
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
                                                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                                            <Label htmlFor="department_id">
                                                Department <span className="text-destructive">*</span>
                                            </Label>
                                            <select
                                                id="department_id"
                                                name="department_id"
                                                required
                                                value={data.department_id}
                                                onChange={(e) =>
                                                    setData('department_id', e.target.value ? Number(e.target.value) : '')
                                                }
                                                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                                                Request Date (DD/MM/YYYY) <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="date_display"
                                                    type="text"
                                                    readOnly
                                                    placeholder="DD/MM/YYYY"
                                                    value={dateInput}
                                                    onClick={() => openDatePicker(dateRef)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openDatePicker(dateRef);
                                                        }
                                                    }}
                                                    className="h-10 pr-10 cursor-pointer"
                                                />
                                                <input
                                                    id="date"
                                                    name="date"
                                                    type="date"
                                                    ref={dateRef}
                                                    required
                                                    value={data.date}
                                                    onChange={(e) => {
                                                        const iso = e.target.value;
                                                        setData('date', iso);
                                                        setDateInput(iso ? toDdMmYyyy(iso) : '');
                                                    }}
                                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                />
                                                <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                            <InputError message={errors.date} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="date_of_joining" className="flex items-center gap-2">
                                                <Calendar className="size-4" />
                                                Date of Joining (DD/MM/YYYY) <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="date_of_joining_display"
                                                    type="text"
                                                    readOnly
                                                    placeholder="DD/MM/YYYY"
                                                    value={dateOfJoiningInput}
                                                    onClick={() => openDatePicker(dateOfJoiningRef)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openDatePicker(dateOfJoiningRef);
                                                        }
                                                    }}
                                                    className="h-10 pr-10 cursor-pointer"
                                                />
                                                <input
                                                    id="date_of_joining"
                                                    name="date_of_joining"
                                                    type="date"
                                                    ref={dateOfJoiningRef}
                                                    required
                                                    value={data.date_of_joining}
                                                    onChange={(e) => {
                                                        const iso = e.target.value;
                                                        setData('date_of_joining', iso);
                                                        setDateOfJoiningInput(iso ? toDdMmYyyy(iso) : '');
                                                    }}
                                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                />
                                                <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                            <InputError message={errors.date_of_joining} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Plane className="size-5 text-muted-foreground" />
                                            <CardTitle>Travel & Allowance Details</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Provide travel and allowance information
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="departure_date" className="flex items-center gap-2">
                                                <Calendar className="size-4" />
                                                Departure Date (DD/MM/YYYY)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="departure_date_display"
                                                    type="text"
                                                    readOnly
                                                    placeholder="DD/MM/YYYY"
                                                    value={departureDateInput}
                                                    onClick={() => openDatePicker(departureDateRef)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openDatePicker(departureDateRef);
                                                        }
                                                    }}
                                                    className="h-10 pr-10 cursor-pointer"
                                                />
                                                <input
                                                    id="departure_date"
                                                    name="departure_date"
                                                    type="date"
                                                    ref={departureDateRef}
                                                    value={data.departure_date}
                                                    onChange={(e) => {
                                                        const iso = e.target.value;
                                                        setData('departure_date', iso);
                                                        setDepartureDateInput(iso ? toDdMmYyyy(iso) : '');
                                                    }}
                                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                />
                                                <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                            <InputError message={errors.departure_date} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="arrival_date" className="flex items-center gap-2">
                                                <Calendar className="size-4" />
                                                Arrival Date (DD/MM/YYYY)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="arrival_date_display"
                                                    type="text"
                                                    readOnly
                                                    placeholder="DD/MM/YYYY"
                                                    value={arrivalDateInput}
                                                    onClick={() => openDatePicker(arrivalDateRef)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openDatePicker(arrivalDateRef);
                                                        }
                                                    }}
                                                    className="h-10 pr-10 cursor-pointer"
                                                />
                                                <input
                                                    id="arrival_date"
                                                    name="arrival_date"
                                                    type="date"
                                                    ref={arrivalDateRef}
                                                    value={data.arrival_date}
                                                    onChange={(e) => {
                                                        const iso = e.target.value;
                                                        setData('arrival_date', iso);
                                                        setArrivalDateInput(iso ? toDdMmYyyy(iso) : '');
                                                    }}
                                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                />
                                                <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                            <InputError message={errors.arrival_date} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="preferred_airlines">Preferred Airlines</Label>
                                            <Input
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
                                                placeholder="e.g. Qatar Airways, Emirates"
                                                className="h-10"
                                            />
                                            <InputError message={errors.preferred_airlines} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bag_allowance">Bag Allowance</Label>
                                            <Input
                                                id="bag_allowance"
                                                name="bag_allowance"
                                                type="text"
                                                value={data.bag_allowance}
                                                onChange={(e) =>
                                                    setData('bag_allowance', e.target.value)
                                                }
                                                placeholder="e.g. 30kg"
                                                className="h-10"
                                            />
                                            <InputError message={errors.bag_allowance} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="last_encashment_date" className="flex items-center gap-2">
                                                <Calendar className="size-4" />
                                                Last Encashment Date (DD/MM/YYYY)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="last_encashment_date_display"
                                                    type="text"
                                                    readOnly
                                                    placeholder="DD/MM/YYYY"
                                                    value={lastEncashmentDateInput}
                                                    onClick={() => openDatePicker(lastEncashmentDateRef)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openDatePicker(lastEncashmentDateRef);
                                                        }
                                                    }}
                                                    className="h-10 pr-10 cursor-pointer"
                                                />
                                                <input
                                                    id="last_encashment_date"
                                                    name="last_encashment_date"
                                                    type="date"
                                                    ref={lastEncashmentDateRef}
                                                    value={data.last_encashment_date}
                                                    onChange={(e) => {
                                                        const iso = e.target.value;
                                                        setData('last_encashment_date', iso);
                                                        setLastEncashmentDateInput(iso ? toDdMmYyyy(iso) : '');
                                                    }}
                                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                />
                                                <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                            <InputError message={errors.last_encashment_date} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column - Summary & Actions */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-6 space-y-6">
                                    {/* Summary Card */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {selectedEmployee && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Employee
                                                    </Label>
                                                    <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-sm">
                                                        <User className="size-4 text-muted-foreground" />
                                                        <div className="font-medium">
                                                            {selectedEmployee.first_name} {selectedEmployee.last_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedJobPosition && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Job Position
                                                    </Label>
                                                    <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-sm">
                                                        <Briefcase className="size-4 text-muted-foreground" />
                                                        <div className="font-medium">{selectedJobPosition.name}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedDepartment && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Department
                                                    </Label>
                                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                        {selectedDepartment.name}
                                                    </div>
                                                </div>
                                            )}

                                            {data.date && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Request Date
                                                    </Label>
                                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                        {formatDate(data.date)}
                                                    </div>
                                                </div>
                                            )}

                                            {data.date_of_joining && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Date of Joining
                                                    </Label>
                                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                        {formatDate(data.date_of_joining)}
                                                    </div>
                                                </div>
                                            )}

                                            {(data.departure_date || data.arrival_date) && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Travel Dates
                                                    </Label>
                                                    <div className="space-y-1 text-sm">
                                                        {data.departure_date && (
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Departure:</span>
                                                                <span className="font-medium">{formatDate(data.departure_date)}</span>
                                                            </div>
                                                        )}
                                                        {data.arrival_date && (
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Arrival:</span>
                                                                <span className="font-medium">{formatDate(data.arrival_date)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {data.preferred_airlines && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Preferred Airlines
                                                    </Label>
                                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                        {data.preferred_airlines}
                                                    </div>
                                                </div>
                                            )}

                                            {data.bag_allowance && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Bag Allowance
                                                    </Label>
                                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                        {data.bag_allowance}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Actions Card */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button
                                                disabled={processing}
                                                type="button"
                                                className="w-full"
                                                onClick={submitAs('submitted')}
                                                size="lg"
                                            >
                                                {processing ? 'Submitting...' : 'Submit Request'}
                                            </Button>
                                            <Button
                                                disabled={processing}
                                                type="button"
                                                variant="outline"
                                                className="w-full"
                                                onClick={submitAs('draft')}
                                                size="lg"
                                            >
                                                Save as Draft
                                            </Button>
                                            <Link href={index()} className="block">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full"
                                                    size="lg"
                                                >
                                                    Cancel
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

