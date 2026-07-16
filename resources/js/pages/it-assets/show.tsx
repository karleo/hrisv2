import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    FileText,
    HardDrive,
    Pencil,
    Printer,
    RotateCcw,
    Tag,
    User,
    UserPlus,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import ItAssetController from '@/actions/App/Http/Controllers/ItAssetController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/it-assets';
import type { BreadcrumbItem } from '@/types';

type Employee = { id: number; first_name: string; last_name: string };
type Option = { value: string; label: string };
type CatalogRef = { code: string; name: string };

type AssignmentDocument = {
    id: number;
    original_name: string;
    url: string | null;
};

type Asset = {
    id: number;
    code: string;
    category: string;
    name: string;
    status: string;
    serial_number: string | null;
    asset_tag: string | null;
    license_key: string | null;
    license_seats: number | null;
    expiry_date: string | null;
    purchase_date: string | null;
    warranty_expires_at: string | null;
    asset_value: string | null;
    asset_currency: string | null;
    condition_notes: string | null;
    remarks: string | null;
    hardware?: CatalogRef | null;
    software?: CatalogRef | null;
    accessory?: CatalogRef | null;
    hardware_asset_value?: { asset_model: string | null; asset_value: string | null; asset_currency: string | null } | null;
    current_employee?: Employee | null;
    assignments?: Array<{
        id: number;
        assigned_at: string;
        returned_at: string | null;
        assignment_notes: string | null;
        return_notes: string | null;
        condition_on_return: string | null;
        employee?: Employee;
        documents?: AssignmentDocument[];
    }>;
    events?: Array<{
        id: number;
        event_type: string;
        actor_name: string;
        created_at: string;
        metadata: Record<string, unknown> | null;
    }>;
};

function categoryLabel(category: string): string {
    if (category === 'hardware') {
        return 'Devices';
    }

    return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatDate(ymd: string | null | undefined): string {
    if (!ymd) {
        return '—';
    }

    const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return ymd;
    }

    const [, year, month, day] = match;

    return `${day}/${month}/${year}`;
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatMoney(value: string | null | undefined, currency: string | null | undefined): string | null {
    if (!value) {
        return null;
    }

    const formatted = Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return currency ? `${formatted} ${currency}` : formatted;
}

function statusClass(status: string): string {
    switch (status) {
        case 'available':
            return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300';
        case 'assigned':
            return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-300';
        case 'in_repair':
            return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300';
        case 'retired':
            return 'border-border bg-muted text-muted-foreground';
        case 'lost':
            return 'border-destructive/30 bg-destructive/10 text-destructive';
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
}

function statusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function catalogItemName(asset: Asset): string | null {
    return asset.hardware?.name ?? asset.software?.name ?? asset.accessory?.name ?? null;
}

function catalogItemCode(asset: Asset): string | null {
    return asset.hardware?.code ?? asset.software?.code ?? asset.accessory?.code ?? null;
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
    if (value === null || value === undefined || value === '' || value === '—') {
        return null;
    }

    return (
        <div className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium text-foreground">{value}</dd>
        </div>
    );
}

function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <h3 className="border-b border-border/80 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {children}
        </h3>
    );
}

export default function Show({
    asset,
    employees = [],
    statuses = [],
}: {
    asset: Asset;
    employees?: Employee[];
    statuses?: Option[];
}) {
    const { flash } = usePage().props as { flash?: { success?: string } };
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'IT Assets', href: index().url },
        { title: asset.code, href: ItAssetController.show.url(asset.id) },
    ];

    const assignForm = useForm({
        employee_id: '',
        assignment_notes: '',
        documents: [] as File[],
    });
    const documentInputRef = useRef<HTMLInputElement>(null);
    const [selectedDocumentNames, setSelectedDocumentNames] = useState<string[]>([]);
    const returnForm = useForm({ condition_on_return: '', return_notes: '' });
    const statusForm = useForm({ status: '', notes: '' });

    const displayValue = formatMoney(asset.asset_value, asset.asset_currency)
        ?? formatMoney(asset.hardware_asset_value?.asset_value, asset.hardware_asset_value?.asset_currency);

    const catalogLabel =
        asset.category === 'hardware' ? 'Device type' : asset.category === 'software' ? 'Software' : 'Accessory';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={asset.code} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={index().url}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to inventory
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={ItAssetController.print.url(asset.id)}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Printer className="size-4" />
                                Print label
                            </Button>
                        </Link>
                        <Link href={ItAssetController.edit.url(asset.id)}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Pencil className="size-4" />
                                Edit asset
                            </Button>
                        </Link>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}

                {/* Page header */}
                <div className="rounded-xl border border-border/80 bg-gradient-to-br from-muted/30 via-card to-card px-6 py-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                                <HardDrive className="size-6 text-primary" />
                            </div>
                            <div className="min-w-0 space-y-1">
                                <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {asset.code}
                                </p>
                                <h1 className="text-2xl font-semibold tracking-tight">{asset.name}</h1>
                                {catalogItemName(asset) && catalogItemName(asset) !== asset.name && (
                                    <p className="text-muted-foreground text-sm">{catalogItemName(asset)}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(asset.status)}`}>
                                {statusLabel(asset.status)}
                            </span>
                            <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                                {categoryLabel(asset.category)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Asset details */}
                    <Card className="border-border/80 shadow-sm lg:col-span-2">
                        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                            <CardTitle className="text-base font-semibold">Asset details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            <section className="space-y-4">
                                <SectionTitle>General</SectionTitle>
                                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <DetailField label="Asset code" value={<span className="font-mono">{asset.code}</span>} />
                                    <DetailField label="Label" value={asset.name} />
                                    <DetailField label="Category" value={categoryLabel(asset.category)} />
                                    <DetailField label="Status" value={statusLabel(asset.status)} />
                                    {catalogItemName(asset) && (
                                        <DetailField
                                            label={catalogLabel}
                                            value={
                                                catalogItemCode(asset)
                                                    ? `${catalogItemCode(asset)} — ${catalogItemName(asset)}`
                                                    : catalogItemName(asset)
                                            }
                                        />
                                    )}
                                    {asset.hardware_asset_value?.asset_model && (
                                        <DetailField label="Model" value={asset.hardware_asset_value.asset_model} />
                                    )}
                                </dl>
                            </section>

                            <section className="space-y-4">
                                <SectionTitle>Identification</SectionTitle>
                                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <DetailField label="Serial number" value={asset.serial_number} />
                                    <DetailField label="Asset tag" value={asset.asset_tag} />
                                    <DetailField label="License key" value={asset.license_key} />
                                    {asset.license_seats != null && (
                                        <DetailField label="License seats" value={String(asset.license_seats)} />
                                    )}
                                </dl>
                            </section>

                            <section className="space-y-4">
                                <SectionTitle>Financial &amp; dates</SectionTitle>
                                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <DetailField label="Asset value" value={displayValue} />
                                    <DetailField label="Purchase date" value={formatDate(asset.purchase_date)} />
                                    <DetailField label="Warranty expires" value={formatDate(asset.warranty_expires_at)} />
                                    <DetailField label="License expiry" value={formatDate(asset.expiry_date)} />
                                </dl>
                            </section>

                            {asset.current_employee && (
                                <section className="space-y-4">
                                    <SectionTitle>Current assignment</SectionTitle>
                                    <div className="flex items-center gap-3 rounded-lg border border-blue-200/80 bg-blue-50/50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/20">
                                        <div className="flex size-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                            <User className="size-4 text-blue-700 dark:text-blue-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned to</p>
                                            <p className="font-semibold">
                                                {asset.current_employee.first_name} {asset.current_employee.last_name}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {(asset.condition_notes || asset.remarks) && (
                                <section className="space-y-4">
                                    <SectionTitle>Notes</SectionTitle>
                                    <dl className="grid gap-4 sm:grid-cols-2">
                                        <DetailField label="Condition notes" value={asset.condition_notes} />
                                        <DetailField label="Remarks" value={asset.remarks} />
                                    </dl>
                                </section>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions sidebar */}
                    <div className="space-y-4">
                        {asset.status === 'available' && (
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <UserPlus className="size-4" />
                                        Assign to employee
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            assignForm.post(ItAssetController.assign.url(asset.id), {
                                                forceFormData: true,
                                                onSuccess: () => {
                                                    assignForm.reset();
                                                    setSelectedDocumentNames([]);
                                                    if (documentInputRef.current) {
                                                        documentInputRef.current.value = '';
                                                    }
                                                },
                                            });
                                        }}
                                        className="space-y-4"
                                    >
                                        <div className="grid gap-2">
                                            <Label>Employee</Label>
                                            <Select value={assignForm.data.employee_id} onValueChange={(v) => assignForm.setData('employee_id', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                                                <SelectContent>
                                                    {employees.map((emp) => (
                                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                                            {emp.first_name} {emp.last_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={assignForm.errors.employee_id} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="assignment_documents">Assignment documents</Label>
                                            <Input
                                                id="assignment_documents"
                                                ref={documentInputRef}
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                multiple
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files ?? []);
                                                    assignForm.setData('documents', files);
                                                    setSelectedDocumentNames(files.map((file) => file.name));
                                                }}
                                            />
                                            <p className="text-muted-foreground text-xs">
                                                Signed handover or acknowledgment (PDF, JPG, PNG). At least one file required.
                                            </p>
                                            {selectedDocumentNames.length > 0 && (
                                                <ul className="text-muted-foreground space-y-1 text-xs">
                                                    {selectedDocumentNames.map((name) => (
                                                        <li key={name} className="flex items-center gap-1">
                                                            <FileText className="size-3 shrink-0" />
                                                            {name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <InputError message={assignForm.errors.documents} />
                                            <InputError message={assignForm.errors['documents.0']} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Assignment notes</Label>
                                            <Textarea
                                                placeholder="Optional notes for this assignment"
                                                value={assignForm.data.assignment_notes}
                                                onChange={(e) => assignForm.setData('assignment_notes', e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        <Button type="submit" disabled={assignForm.processing} className="w-full">
                                            Assign asset
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {asset.status === 'assigned' && (
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <RotateCcw className="size-4" />
                                        Return to inventory
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            returnForm.post(ItAssetController.returnAsset.url(asset.id));
                                        }}
                                        className="space-y-4"
                                    >
                                        <div className="grid gap-2">
                                            <Label>Condition on return</Label>
                                            <Input
                                                placeholder="e.g. Good, Fair, Damaged"
                                                value={returnForm.data.condition_on_return}
                                                onChange={(e) => returnForm.setData('condition_on_return', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Return notes</Label>
                                            <Textarea
                                                placeholder="Optional return notes"
                                                value={returnForm.data.return_notes}
                                                onChange={(e) => returnForm.setData('return_notes', e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        <Button type="submit" disabled={returnForm.processing} className="w-full">
                                            Return to inventory
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {asset.status !== 'assigned' && (
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Tag className="size-4" />
                                        Change status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            router.patch(ItAssetController.changeStatus.url(asset.id), statusForm.data());
                                        }}
                                        className="space-y-4"
                                    >
                                        <div className="grid gap-2">
                                            <Label>New status</Label>
                                            <Select value={statusForm.data.status} onValueChange={(v) => statusForm.setData('status', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                                <SelectContent>
                                                    {statuses.map((s) => (
                                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Notes</Label>
                                            <Textarea
                                                placeholder="Optional status change notes"
                                                value={statusForm.data.notes}
                                                onChange={(e) => statusForm.setData('notes', e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full">Update status</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Assignment history */}
                <Card className="border-border/80 shadow-sm">
                    <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <User className="size-4" />
                            Assignment history
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {(asset.assignments ?? []).length === 0 ? (
                            <p className="text-muted-foreground px-6 py-8 text-center text-sm">No assignments recorded yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Employee</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Returned</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Documents</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {asset.assignments?.map((a) => (
                                            <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                                                <td className="px-5 py-3 font-medium">
                                                    {a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : '—'}
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground">{formatDateTime(a.assigned_at)}</td>
                                                <td className="px-5 py-3 text-muted-foreground">
                                                    {a.returned_at ? formatDateTime(a.returned_at) : '—'}
                                                </td>
                                                <td className="px-5 py-3">
                                                    {a.returned_at ? (
                                                        <span className="text-muted-foreground text-xs font-medium">Returned</span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    {(a.documents ?? []).length === 0 ? (
                                                        <span className="text-muted-foreground">—</span>
                                                    ) : (
                                                        <ul className="space-y-1">
                                                            {a.documents?.map((doc) => (
                                                                <li key={doc.id}>
                                                                    <a
                                                                        href={`/it-assets/assignment-documents/${doc.id}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                                                                    >
                                                                        <FileText className="size-3.5 shrink-0" />
                                                                        <span className="max-w-[200px] truncate">{doc.original_name}</span>
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Lifecycle events */}
                <Card className="border-border/80 shadow-sm">
                    <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Calendar className="size-4" />
                            Lifecycle events
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {(asset.events ?? []).length === 0 ? (
                            <p className="text-muted-foreground px-6 py-8 text-center text-sm">No lifecycle events recorded.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Event</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Performed by</th>
                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Date &amp; time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {asset.events?.map((event) => (
                                            <tr key={event.id} className="border-b last:border-0 hover:bg-muted/20">
                                                <td className="px-5 py-3 font-medium capitalize">
                                                    {event.event_type.replace(/_/g, ' ')}
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground">{event.actor_name}</td>
                                                <td className="px-5 py-3 text-muted-foreground">{formatDateTime(event.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
