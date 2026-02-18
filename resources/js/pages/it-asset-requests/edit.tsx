import { Head, Link, useForm } from '@inertiajs/react';
import { Calendar } from 'lucide-react';
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

type HardwareOption = {
    id: number;
    code: string;
    name: string;
};

type ItAssetRequest = {
    id: number;
    code: string;
    date: string;
    date_issued: string | null;
    employee_id: number;
    department_id: number;
    hardware_ids: number[] | null;
    serial_number: string | null;
    remarks: string | null;
    status: string;
};

const inputClassName =
    'border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

function toDdMmYyyy(iso: string): string {
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return '';
    }

    const [, yyyy, mm, dd] = match;

    return `${dd}/${mm}/${yyyy}`;
}

export default function Edit({
    itAssetRequest,
    employees,
    departments,
    hardware,
}: {
    itAssetRequest: ItAssetRequest;
    employees: EmployeeOption[];
    departments: DepartmentOption[];
    hardware: HardwareOption[];
}) {
    const requestLabel = itAssetRequest.code || `Request #${itAssetRequest.id}`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'IT Asset Requests', href: '/it-asset-requests' },
        { title: `Edit ${requestLabel}`, href: '#' },
    ];

    const { data, setData, processing, errors, put, transform } = useForm<{
        date: string;
        date_issued: string;
        employee_id: number | '';
        department_id: number | '';
        hardware_ids: number[];
        serial_number: string;
        remarks: string;
        status: string;
    }>({
        date: itAssetRequest.date,
        date_issued: itAssetRequest.date_issued ?? '',
        employee_id: itAssetRequest.employee_id,
        department_id: itAssetRequest.department_id,
        hardware_ids: itAssetRequest.hardware_ids ?? [],
        serial_number: itAssetRequest.serial_number ?? '',
        remarks: itAssetRequest.remarks ?? '',
        status: itAssetRequest.status,
    });

    const [dateInput, setDateInput] = useState<string>(
        data.date ? toDdMmYyyy(data.date) : '',
    );
    const [dateIssuedInput, setDateIssuedInput] = useState<string>(
        data.date_issued ? toDdMmYyyy(data.date_issued) : '',
    );

    const dateRef = useRef<HTMLInputElement>(null);
    const dateIssuedRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setDateInput(data.date ? toDdMmYyyy(data.date) : '');
    }, [data.date]);

    useEffect(() => {
        setDateIssuedInput(data.date_issued ? toDdMmYyyy(data.date_issued) : '');
    }, [data.date_issued]);

    const openDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
        const el = ref.current;
        if (!el) return;

        // Some browsers won't open the picker for fully transparent inputs.
        // showPicker is supported in Chromium; focus/click is fallback.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).showPicker?.();
        el.focus();
        el.click();
    };

    const submitAs = (status: 'draft' | 'submitted') => (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status }));
        put(`/it-asset-requests/${itAssetRequest.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit IT Asset Request #${itAssetRequest.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href="/it-asset-requests"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    ← Back to IT Asset Requests
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={`IT Asset Request ${requestLabel}`}
                        description="Update employee and asset request details"
                    />
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:gap-4 sm:shrink-0">
                        <div className="w-full min-w-[12rem] sm:w-auto">
                            <Label className="text-sm">Request Code</Label>
                            <input
                                type="text"
                                readOnly
                                value={itAssetRequest.code || '—'}
                                className="border-input mt-1.5 flex h-9 w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
                            />
                        </div>
                    </div>
                </div>

                <form
                    className="flex w-full flex-col gap-6"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Request details</CardTitle>
                            <CardDescription>
                                Date, employee, and department
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="date"
                                    className="flex items-center gap-2"
                                >
                                    <Calendar className="size-4" />
                                    Date (DD/MM/YYYY)
                                </Label>
                                <div className="relative">
                                    <input
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
                                        className={inputClassName + ' pr-10 cursor-pointer'}
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
                                <Label
                                    htmlFor="date_issued"
                                    className="flex items-center gap-2"
                                >
                                    <Calendar className="size-4" />
                                    Date Issued (DD/MM/YYYY)
                                </Label>
                                <div className="relative">
                                    <input
                                        id="date_issued_display"
                                        type="text"
                                        readOnly
                                        placeholder="DD/MM/YYYY"
                                        value={dateIssuedInput}
                                        onClick={() => openDatePicker(dateIssuedRef)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                openDatePicker(dateIssuedRef);
                                            }
                                        }}
                                        className={inputClassName + ' pr-10 cursor-pointer'}
                                    />
                                    <input
                                        id="date_issued"
                                        name="date_issued"
                                        type="date"
                                        ref={dateIssuedRef}
                                        value={data.date_issued}
                                        onChange={(e) => {
                                            const iso = e.target.value;
                                            setData('date_issued', iso);
                                            setDateIssuedInput(iso ? toDdMmYyyy(iso) : '');
                                        }}
                                        className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <InputError message={errors.date_issued} />
                            </div>

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

                            <div className="grid gap-2 sm:col-span-2">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Asset information</CardTitle>
                            <CardDescription>
                                Optional details about the asset being requested
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="hardware_ids">Hardware (select multiple)</Label>
                                <div className="border-input focus-within:ring-ring max-h-[300px] w-full overflow-y-auto rounded-md border bg-transparent p-3 shadow-xs focus-within:ring-[3px]">
                                    {hardware.length === 0 ? (
                                        <div className="py-4 text-center text-sm text-muted-foreground">
                                            No hardware available
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {hardware.map((hw) => {
                                                const isSelected = data.hardware_ids.includes(hw.id);
                                                return (
                                                    <label
                                                        key={hw.id}
                                                        className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted/50"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setData('hardware_ids', [...data.hardware_ids, hw.id]);
                                                                } else {
                                                                    setData('hardware_ids', data.hardware_ids.filter(id => id !== hw.id));
                                                                }
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                                                        />
                                                        <span className="text-sm">
                                                            <span className="font-medium">{hw.code}</span>
                                                            <span className="text-muted-foreground"> - {hw.name}</span>
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                {data.hardware_ids.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                        {data.hardware_ids.length} hardware item{data.hardware_ids.length !== 1 ? 's' : ''} selected
                                    </div>
                                )}
                                <InputError message={errors.hardware_ids} />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="serial_number">
                                    Serial number
                                </Label>
                                <input
                                    id="serial_number"
                                    name="serial_number"
                                    type="text"
                                    value={data.serial_number}
                                    onChange={(e) =>
                                        setData('serial_number', e.target.value)
                                    }
                                    className={
                                        inputClassName +
                                        ' placeholder:text-muted-foreground'
                                    }
                                    placeholder="Optional"
                                />
                                <InputError message={errors.serial_number} />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <textarea
                                    id="remarks"
                                    name="remarks"
                                    value={data.remarks}
                                    onChange={(e) =>
                                        setData('remarks', e.target.value)
                                    }
                                    rows={4}
                                    className="border-input focus-visible:ring-ring w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Optional"
                                />
                                <InputError message={errors.remarks} />
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
                            <Link href="/it-asset-requests" className="ml-auto">
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

