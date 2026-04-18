import { Form, Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Ban, Calendar, CheckCircle2, Laptop, Package, Save, Send, User } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ActivityLogTimeline, type ActivityLogTimelineEntry } from '@/components/activity-log-timeline';
import { FormValidationInlineAlert } from '@/components/form-validation-inline-alert';
import InputError from '@/components/input-error';
import {
    ItAssetRequestSignaturesCard,
    itAssetRequestEditSignatureVisitOnly,
} from '@/components/it-asset-request-signatures-card';
import { RequestStatusBadge, normalizeRequestStatus } from '@/components/request-status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useI18n } from '@/lib/i18n';
import { index } from '@/routes/it-asset-requests';
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

type HardwareOption = {
    id: number;
    code: string;
    name: string;
};

type HardwareItemInput = {
    hardware_id: number;
    serial_number: string;
};

type ItAssetRequest = {
    id: number;
    code: string;
    date: string;
    date_issued: string | null;
    employee_id: number;
    department_id: number;
    hardware_ids: number[] | null;
    hardware_items?: HardwareItemInput[];
    serial_number: string | null;
    remarks: string | null;
    status: string;
    employee_signature_url?: string | null;
    issued_by_signature_url?: string | null;
    issued_by_employee_id?: number | null;
    employee?: { first_name: string; last_name: string };
    issued_by_employee?: { first_name: string; last_name: string };
};

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
    signaturesUrl,
    canDecide,
    cancelUrl,
    canCancel = false,
    canViewActivityLogs = false,
    activityLogs,
}: {
    itAssetRequest: ItAssetRequest;
    employees: EmployeeOption[];
    departments: DepartmentOption[];
    hardware: HardwareOption[];
    signaturesUrl: string;
    canDecide: boolean;
    cancelUrl: string;
    canCancel?: boolean;
    canViewActivityLogs?: boolean;
    activityLogs: ActivityLogTimelineEntry[];
}) {
    const { t } = useI18n();
    const requestLabel = itAssetRequest.code || `Request #${itAssetRequest.id}`;
    const showHref = `/it-asset-requests/${itAssetRequest.id}`;
    const statusNorm = normalizeRequestStatus(itAssetRequest.status);
    const issuedByReadonlyEmptyMessage = canDecide
        ? undefined
        : statusNorm === 'draft'
          ? 'Available after the request is submitted.'
          : statusNorm === 'submitted'
            ? 'Awaiting IT or manager signature.'
            : undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'IT Asset Requests', href: '/it-asset-requests' },
        { title: `Edit ${requestLabel}`, href: '#' },
    ];

    const initialHardwareItems: HardwareItemInput[] = useMemo(() => {
        if ((itAssetRequest.hardware_items ?? []).length > 0) {
            return (itAssetRequest.hardware_items ?? []).map((item) => ({
                hardware_id: item.hardware_id,
                serial_number: item.serial_number ?? '',
            }));
        }

        const legacyHardwareIds = itAssetRequest.hardware_ids ?? [];
        if (legacyHardwareIds.length === 0) {
            return [];
        }

        return legacyHardwareIds.map((hardwareId, index) => ({
            hardware_id: hardwareId,
            serial_number:
                legacyHardwareIds.length === 1 && index === 0
                    ? (itAssetRequest.serial_number ?? '')
                    : '',
        }));
    }, [itAssetRequest.hardware_ids, itAssetRequest.hardware_items, itAssetRequest.serial_number]);

    const { data, setData, processing, errors, put, transform } = useForm<{
        date: string;
        date_issued: string;
        employee_id: number | '';
        department_id: number | '';
        hardware_ids: number[];
        hardware_items: HardwareItemInput[];
        remarks: string;
        status: string;
    }>({
        date: itAssetRequest.date,
        date_issued: itAssetRequest.date_issued ?? '',
        employee_id: itAssetRequest.employee_id,
        department_id: itAssetRequest.department_id,
        hardware_ids: initialHardwareItems.map((item) => item.hardware_id),
        hardware_items: initialHardwareItems,
        remarks: itAssetRequest.remarks ?? '',
        status: itAssetRequest.status,
    });

    const [hardwareSearch, setHardwareSearch] = useState<string>('');

    const dateRef = useRef<HTMLInputElement>(null);
    const dateIssuedRef = useRef<HTMLInputElement>(null);

    const dateInputDisplay = data.date ? toDdMmYyyy(data.date) : '';
    const dateIssuedDisplay = data.date_issued ? toDdMmYyyy(data.date_issued) : '';

    const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
        const el = ref.current;
        if (!el) return;

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

    const saveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({ ...payload, status: data.status || itAssetRequest.status }));
        put(`/it-asset-requests/${itAssetRequest.id}`);
    };

    const syncHardwareItems = (nextHardwareIds: number[]) => {
        setData((previous) => {
            const serialByHardwareId = new Map(
                previous.hardware_items.map((item) => [item.hardware_id, item.serial_number]),
            );

            return {
                ...previous,
                hardware_ids: nextHardwareIds,
                hardware_items: nextHardwareIds.map((hardwareId) => ({
                    hardware_id: hardwareId,
                    serial_number: serialByHardwareId.get(hardwareId) ?? '',
                })),
            };
        });
    };

    const setHardwareSerialNumber = (hardwareId: number, serialNumber: string) => {
        setData(
            'hardware_items',
            data.hardware_items.map((item) =>
                item.hardware_id === hardwareId ? { ...item, serial_number: serialNumber } : item,
            ),
        );
    };

    const hardwareSerialById = useMemo(
        () => new Map(data.hardware_items.map((item) => [item.hardware_id, item.serial_number])),
        [data.hardware_items],
    );

    const selectedHardware = hardware.filter((hw) =>
        data.hardware_ids.includes(hw.id),
    );

    const filteredHardware = useMemo(() => {
        const keyword = hardwareSearch.trim().toLowerCase();
        if (keyword === '') {
            return hardware;
        }

        return hardware.filter((item) =>
            `${item.code} ${item.name}`.toLowerCase().includes(keyword),
        );
    }, [hardware, hardwareSearch]);

    const isDraft = normalizeRequestStatus(itAssetRequest.status) === 'draft';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit IT Asset Request #${itAssetRequest.id}`} />

            <div className="flex min-h-screen w-full flex-col bg-muted/30">
                <div className="border-b bg-card px-4 py-6 md:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6">
                        <Link
                            href={showHref}
                            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to request
                        </Link>

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                    <div className="space-y-1">
                                        <h1 className="text-3xl font-bold tracking-tight">
                                            Edit IT Asset Request
                                        </h1>
                                        <p className="text-muted-foreground">
                                            Update details and signatures for {requestLabel}.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={saveChanges}
                                            disabled={processing}
                                        >
                                            <Save className="mr-2 size-4" />
                                            Save changes
                                        </Button>
                                        {canCancel ? (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button type="button" variant="destructive" size="sm">
                                                        <Ban className="mr-2 size-4" />
                                                        Cancel request
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogTitle>Cancel IT asset request?</DialogTitle>
                                                    <DialogDescription>
                                                        Are you sure you want to cancel this IT asset request? This record will stay in the system.
                                                    </DialogDescription>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button type="button" variant="secondary">
                                                                Keep request
                                                            </Button>
                                                        </DialogClose>
                                                        <Form
                                                            action={cancelUrl}
                                                            method="delete"
                                                            options={{ preserveScroll: true }}
                                                            className="contents"
                                                        >
                                                            {({ processing: cancelling }) => (
                                                                <Button type="submit" variant="destructive" disabled={cancelling}>
                                                                    Cancel request
                                                                </Button>
                                                            )}
                                                        </Form>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        ) : null}
                                        <RequestStatusBadge status={itAssetRequest.status} />
                                    </div>
                                </div>
                            </div>

                            <div className="min-w-[200px]">
                                <Label className="text-sm font-medium">Request Code</Label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={itAssetRequest.code || '—'}
                                    className="mt-1.5 bg-muted text-muted-foreground"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-4 py-8 md:px-8">
                    <form
                        className="mx-auto max-w-7xl"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-3">
                                <FormValidationInlineAlert errors={errors as Record<string, unknown>} />
                            </div>
                            <div className="space-y-6 lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <User className="size-5 text-muted-foreground" />
                                            <CardTitle>Request Information</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Select the employee, department, and request dates
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="date"
                                                className="flex items-center gap-2"
                                            >
                                                <Calendar className="size-4" />
                                                Request Date <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="date_display"
                                                    type="text"
                                                    readOnly
                                                    placeholder="DD/MM/YYYY"
                                                    value={dateInputDisplay}
                                                    onClick={() => openDatePicker(dateRef)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openDatePicker(dateRef);
                                                        }
                                                    }}
                                                    className="h-10 cursor-pointer pr-10"
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
                                                Date Issued
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="date_issued_display"
                                                    type="text"
                                                    readOnly
                                                    placeholder="DD/MM/YYYY"
                                                    value={dateIssuedDisplay}
                                                    onClick={() => openDatePicker(dateIssuedRef)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openDatePicker(dateIssuedRef);
                                                        }
                                                    }}
                                                    className="h-10 cursor-pointer pr-10"
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
                                                    }}
                                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                />
                                                <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                            <InputError message={errors.date_issued} />
                                        </div>

                                        <div className="grid gap-2">
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
                                            <Label htmlFor="department_id">
                                                Department <span className="text-destructive">*</span>
                                            </Label>
                                            <input
                                                id="department_id"
                                                type="text"
                                                readOnly
                                                value={
                                                    data.department_id
                                                        ? (departments.find((department) => department.id === data.department_id)?.name ?? '')
                                                        : ''
                                                }
                                                placeholder="Select employee first"
                                                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <input type="hidden" name="department_id" value={data.department_id} />
                                            <InputError message={errors.department_id} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Package className="size-5 text-muted-foreground" />
                                            <CardTitle>Asset Information</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Select the hardware assets and provide additional details
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="hardware_ids">Hardware Assets</Label>
                                            <Input
                                                value={hardwareSearch}
                                                onChange={(e) => setHardwareSearch(e.target.value)}
                                                placeholder="Search hardware by code or name..."
                                                className="h-10"
                                            />
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>
                                                    {filteredHardware.length} item{filteredHardware.length !== 1 ? 's' : ''}{' '}
                                                    found
                                                </span>
                                                <span>{data.hardware_ids.length} selected</span>
                                            </div>
                                            <div className="border-input focus-within:ring-ring max-h-[420px] w-full overflow-y-auto rounded-md border bg-card p-3 shadow-xs focus-within:ring-[3px]">
                                                {hardware.length === 0 ? (
                                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                                        <Package className="mx-auto mb-2 size-8 opacity-50" />
                                                        No hardware available
                                                    </div>
                                                ) : filteredHardware.length === 0 ? (
                                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                                        No hardware matches &quot;{hardwareSearch}&quot;.
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        {filteredHardware.map((hw) => {
                                                            const isSelected = data.hardware_ids.includes(hw.id);
                                                            return (
                                                                <label
                                                                    key={hw.id}
                                                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                                                                        isSelected
                                                                            ? 'border-primary bg-primary/10 shadow-sm'
                                                                            : 'border-border hover:border-primary/40 hover:bg-primary/5'
                                                                    }`}
                                                                >
                                                                    <div className="mt-0.5 flex shrink-0">
                                                                        {isSelected ? (
                                                                            <CheckCircle2 className="size-5 text-primary" />
                                                                        ) : (
                                                                            <div className="size-5 rounded-full border-2 border-muted-foreground/30" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Laptop className="size-4 text-muted-foreground" />
                                                                            <span className="font-medium">{hw.code}</span>
                                                                        </div>
                                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                                            {hw.name}
                                                                        </p>
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                syncHardwareItems([...data.hardware_ids, hw.id]);
                                                                            } else {
                                                                                syncHardwareItems(
                                                                                    data.hardware_ids.filter((id) => id !== hw.id),
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="sr-only"
                                                                    />
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            {data.hardware_ids.length > 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    {data.hardware_ids.length} hardware item
                                                    {data.hardware_ids.length !== 1 ? 's' : ''} selected
                                                </p>
                                            )}
                                            <InputError message={errors.hardware_ids} />
                                        </div>

                                        {selectedHardware.length > 0 ? (
                                            <div className="grid gap-3">
                                                <Label>Serial Number Per Hardware</Label>
                                                <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                                                    {selectedHardware.map((hw, index) => (
                                                        <div key={hw.id} className="grid gap-2 sm:grid-cols-[1fr,220px] sm:items-center">
                                                            <div className="text-sm">
                                                                <div className="font-medium">{hw.code}</div>
                                                                <div className="text-muted-foreground">{hw.name}</div>
                                                            </div>
                                                            <div>
                                                                <Input
                                                                    type="text"
                                                                    value={hardwareSerialById.get(hw.id) ?? ''}
                                                                    onChange={(e) =>
                                                                        setHardwareSerialNumber(hw.id, e.target.value)
                                                                    }
                                                                    placeholder="Serial number (optional)"
                                                                    className="h-10"
                                                                />
                                                                <InputError
                                                                    message={
                                                                        errors[`hardware_items.${index}.serial_number`] ||
                                                                        errors.hardware_items
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="grid gap-2">
                                            <Label htmlFor="remarks">Remarks</Label>
                                            <Textarea
                                                id="remarks"
                                                name="remarks"
                                                value={data.remarks}
                                                onChange={(e) => setData('remarks', e.target.value)}
                                                rows={5}
                                                placeholder="Enter any additional remarks or notes (optional)"
                                                className="resize-none"
                                            />
                                            <InputError message={errors.remarks} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <ItAssetRequestSignaturesCard
                                    itAssetRequest={itAssetRequest}
                                    employees={employees}
                                    signaturesUrl={signaturesUrl}
                                    visitOnly={itAssetRequestEditSignatureVisitOnly}
                                    allowEmployeeSignatureEdit={statusNorm === 'draft'}
                                    allowIssuedBySignatureEdit={statusNorm === 'submitted' && canDecide}
                                    issuedByReadonlyEmptyMessage={issuedByReadonlyEmptyMessage}
                                />
                            </div>

                            <div className="lg:col-span-1">
                                <div className="sticky top-6 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-muted-foreground">
                                                    Request Code
                                                </Label>
                                                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                    {itAssetRequest.code || '—'}
                                                </div>
                                            </div>

                                            {selectedHardware.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Selected Hardware ({selectedHardware.length})
                                                    </Label>
                                                    <div className="space-y-2">
                                                        {selectedHardware.map((hw) => (
                                                            <div
                                                                key={hw.id}
                                                                className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-sm"
                                                            >
                                                                <Laptop className="size-4 text-muted-foreground" />
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{hw.code}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {hw.name}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {data.date && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Request Date
                                                    </Label>
                                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                        {new Date(data.date).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {data.date_issued && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Date Issued
                                                    </Label>
                                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                        {new Date(data.date_issued).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {data.employee_id && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Employee
                                                    </Label>
                                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                        {employees.find((e) => e.id === data.employee_id)?.first_name}{' '}
                                                        {employees.find((e) => e.id === data.employee_id)?.last_name}
                                                    </div>
                                                </div>
                                            )}

                                            {data.department_id && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Department
                                                    </Label>
                                                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                                        {departments.find((d) => d.id === data.department_id)?.name}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Actions</CardTitle>
                                            <CardDescription>
                                                {isDraft
                                                    ? 'Save as draft or mark submitted. You can also submit from the request view.'
                                                    : 'Saving updates this request. Status stays submitted unless you choose Save as draft.'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button
                                                disabled={processing}
                                                type="button"
                                                className="w-full"
                                                size="lg"
                                                onClick={submitAs('submitted')}
                                            >
                                                <Send className="mr-2 size-4" />
                                                {processing ? 'Saving…' : 'Submit'}
                                            </Button>
                                            <Link href={showHref} className="block">
                                                <Button type="button" variant="ghost" className="w-full" size="lg">
                                                    Cancel
                                                </Button>
                                            </Link>
                                            <Link href={index()} className="block">
                                                <Button type="button" variant="link" className="w-full text-muted-foreground">
                                                    Back to list
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                        {canViewActivityLogs ? (
                            <div className="lg:col-span-3">
                                <ActivityLogTimeline
                                    entries={activityLogs}
                                    title={t('activity.title', 'Activity Log')}
                                    description={t(
                                        'activity.description.itAsset',
                                        'Track IT asset request updates by authorized users.',
                                    )}
                                />
                            </div>
                        ) : null}
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
