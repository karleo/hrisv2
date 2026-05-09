import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle2, Laptop, Package, Send, User } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ActivityLogTimeline, type ActivityLogTimelineEntry } from '@/components/activity-log-timeline';
import { FormValidationInlineAlert } from '@/components/form-validation-inline-alert';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    asset_value: string | null;
    asset_currency: string | null;
};

type HardwareItemInput = {
    hardware_id: number;
    serial_number: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'IT Asset Requests', href: '/it-asset-requests' },
    { title: 'Create', href: '/it-asset-requests/create' },
];

function getTodayYmd(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function toDdMmYyyy(iso: string): string {
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return '';
    }

    const [, yyyy, mm, dd] = match;

    return `${dd}/${mm}/${yyyy}`;
}

function formatAssetValue(value: string | null, currency: string | null): string {
    if (!value || !currency) {
        return 'Value not set';
    }

    return `${currency} ${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function groupedAssetTotals(hardwareItems: HardwareOption[]): { currency: string; total: number; count: number }[] {
    const totals = new Map<string, { currency: string; total: number; count: number }>();

    hardwareItems.forEach((item) => {
        if (!item.asset_value || !item.asset_currency) {
            return;
        }

        const existing = totals.get(item.asset_currency) ?? {
            currency: item.asset_currency,
            total: 0,
            count: 0,
        };
        existing.total += Number(item.asset_value);
        existing.count += 1;
        totals.set(item.asset_currency, existing);
    });

    return [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

export default function Create({
    employees,
    departments,
    hardware,
    defaultEmployeeId = null,
    canViewActivityLogs = false,
    activityLogs = [],
}: {
    employees: EmployeeOption[];
    departments: DepartmentOption[];
    hardware: HardwareOption[];
    defaultEmployeeId?: number | null;
    canViewActivityLogs?: boolean;
    activityLogs?: ActivityLogTimelineEntry[];
}) {
    const { t } = useI18n();
    const initialDate = getTodayYmd();

    const initialEmployee =
        defaultEmployeeId != null ? employees.find((e) => e.id === defaultEmployeeId) : undefined;

    const { data, setData, post, processing, errors } = useForm<{
        date: string;
        date_issued: string;
        employee_id: number | '';
        department_id: number | '';
        hardware_ids: number[];
        hardware_items: HardwareItemInput[];
        remarks: string;
    }>({
        date: initialDate,
        date_issued: '',
        employee_id: initialEmployee?.id ?? '',
        department_id: initialEmployee?.department_id ?? '',
        hardware_ids: [],
        hardware_items: [],
        remarks: '',
    });

    const dateInput = data.date ? toDdMmYyyy(data.date) : '';
    const dateIssuedInput = data.date_issued ? toDdMmYyyy(data.date_issued) : '';
    const [hardwareSearch, setHardwareSearch] = useState<string>('');

    const dateRef = useRef<HTMLInputElement>(null);
    const dateIssuedRef = useRef<HTMLInputElement>(null);

    const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
        const el = ref.current;
        if (!el) return;

        // Some browsers won't open the picker for fully transparent inputs.
        // showPicker is supported in Chromium; focus/click is fallback.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).showPicker?.();
        el.focus();
        el.click();
    };

    const saveDraft = () => {
        post('/it-asset-requests');
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
    const assetTotals = useMemo(() => groupedAssetTotals(selectedHardware), [selectedHardware]);

    const filteredHardware = useMemo(() => {
        const keyword = hardwareSearch.trim().toLowerCase();
        if (keyword === '') {
            return hardware;
        }

        return hardware.filter((item) =>
            `${item.code} ${item.name}`.toLowerCase().includes(keyword),
        );
    }, [hardware, hardwareSearch]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('forms.itAsset.createTitle', 'Create IT Asset Request')} />

            <div className="flex min-h-screen w-full flex-col bg-muted/30">
                {/* Header Section */}
                <div className="border-b bg-card px-4 py-6 md:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6">
                        <Link
                            href={index()}
                            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            {t('forms.itAsset.backToRequests', 'Back to IT Asset Requests')}
                        </Link>

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    {t('forms.itAsset.createTitle', 'Create IT Asset Request')}
                                </h1>
                                <p className="text-muted-foreground">
                                    {t('forms.saveDraftHelp', 'Save a draft first, then open the request and use Submit when it is ready to send.')}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 lg:items-end">
                                <div className="flex items-center gap-2">
                                    <Button
                                        disabled={processing}
                                        type="button"
                                        onClick={saveDraft}
                                    >
                                        <Send className="mr-2 size-4" />
                                        {processing ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                                    </Button>
                                    <Link href={index()}>
                                        <Button type="button" variant="outline">
                                            {t('common.discard', 'Discard')}
                                        </Button>
                                    </Link>
                                </div>
                                <div className="min-w-[200px]">
                                    <Label className="text-sm font-medium">{t('forms.requestCode', 'Request Code')}</Label>
                                    <Input
                                        type="text"
                                        readOnly
                                        value="Auto-generated (PRLIT-YYYY-####)"
                                        className="mt-1.5 bg-muted text-muted-foreground"
                                    />
                                </div>
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
                            <div className="lg:col-span-3">
                                <FormValidationInlineAlert errors={errors as Record<string, unknown>} />
                            </div>
                            {/* Left Column - Main Form */}
                            <div className="lg:col-span-2 space-y-6">
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
                                                    value={dateInput}
                                                    onClick={() => openDatePicker(dateRef)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openDatePicker(dateRef);
                                                        }
                                                    }}
                                                    className="pr-10 cursor-pointer h-10"
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
                                                    value={dateIssuedInput}
                                                    onClick={() => openDatePicker(dateIssuedRef)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openDatePicker(dateIssuedRef);
                                                        }
                                                    }}
                                                    className="pr-10 cursor-pointer h-10"
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
                                                className="border-input text-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="" className="bg-background text-foreground">
                                                    Select employee
                                                </option>
                                                {employees.map((emp) => (
                                                    <option
                                                        key={emp.id}
                                                        value={emp.id}
                                                        className="bg-background text-foreground"
                                                    >
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
                                            <Label htmlFor="hardware_ids">
                                                Hardware Assets
                                            </Label>
                                            <Input
                                                value={hardwareSearch}
                                                onChange={(e) => setHardwareSearch(e.target.value)}
                                                placeholder="Search hardware by code or name..."
                                                className="h-10"
                                            />
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>
                                                    {filteredHardware.length} item{filteredHardware.length !== 1 ? 's' : ''} found
                                                </span>
                                                <span>
                                                    {data.hardware_ids.length} selected
                                                </span>
                                            </div>
                                            <div className="border-input focus-within:ring-ring max-h-[420px] w-full overflow-y-auto rounded-md border bg-card p-3 shadow-xs focus-within:ring-[3px]">
                                                {hardware.length === 0 ? (
                                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                                        <Package className="mx-auto mb-2 size-8 opacity-50" />
                                                        No hardware available
                                                    </div>
                                                ) : filteredHardware.length === 0 ? (
                                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                                        No hardware matches "{hardwareSearch}".
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
                                                                        <p className="mt-1 text-xs font-medium text-foreground">
                                                                            {formatAssetValue(hw.asset_value, hw.asset_currency)}
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
                                                    {data.hardware_ids.length} hardware item{data.hardware_ids.length !== 1 ? 's' : ''} selected
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
                                                                <div className="text-xs font-medium text-foreground">
                                                                    {formatAssetValue(hw.asset_value, hw.asset_currency)}
                                                                </div>
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
                                                onChange={(e) =>
                                                    setData('remarks', e.target.value)
                                                }
                                                rows={5}
                                                placeholder="Enter any additional remarks or notes (optional)"
                                                className="resize-none"
                                            />
                                            <InputError message={errors.remarks} />
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
                                            <CardTitle className="text-lg">{t('forms.summary', 'Summary')}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
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
                                                                    <div className="text-xs font-medium text-foreground">
                                                                        {formatAssetValue(hw.asset_value, hw.asset_currency)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {assetTotals.length > 0 ? (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                        Total Asset Value
                                                    </Label>
                                                    <div className="space-y-2">
                                                        {assetTotals.map((total) => (
                                                            <div
                                                                key={total.currency}
                                                                className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-semibold"
                                                            >
                                                                {total.currency}{' '}
                                                                {total.total.toLocaleString('en-US', {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                                    ({total.count} counted)
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

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

