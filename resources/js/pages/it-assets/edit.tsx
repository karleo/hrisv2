import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useRef, useState } from 'react';
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

const CURRENCIES = ['AED', 'USD', 'SAR'] as const;

type Employee = { id: number; first_name: string; last_name: string };

type AssignmentDocument = {
    id: number;
    original_name: string;
    url: string | null;
};

type ActiveAssignment = {
    id: number;
    documents?: AssignmentDocument[];
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
    current_employee?: Employee | null;
    active_assignment?: ActiveAssignment | null;
};

export default function Edit({ asset }: { asset: Asset }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'IT Assets', href: index().url },
        { title: asset.code, href: ItAssetController.show.url(asset.id) },
        { title: 'Edit', href: ItAssetController.edit.url(asset.id) },
    ];

    const isAssigned = asset.status === 'assigned';
    const documentInputRef = useRef<HTMLInputElement>(null);
    const [selectedDocumentNames, setSelectedDocumentNames] = useState<string[]>([]);
    const existingDocuments = asset.active_assignment?.documents ?? [];

    const form = useForm({
        name: asset.name,
        serial_number: asset.serial_number ?? '',
        asset_tag: asset.asset_tag ?? '',
        license_key: asset.license_key ?? '',
        license_seats: asset.license_seats ? String(asset.license_seats) : '',
        expiry_date: asset.expiry_date ?? '',
        purchase_date: asset.purchase_date ?? '',
        warranty_expires_at: asset.warranty_expires_at ?? '',
        asset_value: asset.asset_value ?? '',
        asset_currency: asset.asset_currency ?? '',
        condition_notes: asset.condition_notes ?? '',
        remarks: asset.remarks ?? '',
        documents: [] as File[],
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${asset.code}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Link href={ItAssetController.show.url(asset.id)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    Back to asset
                </Link>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Edit {asset.code}</CardTitle>
                        <p className="text-muted-foreground text-sm capitalize">
                            Category: {asset.category === 'hardware' ? 'devices' : asset.category} (locked)
                            {isAssigned && asset.current_employee && (
                                <> · Assigned to {asset.current_employee.first_name} {asset.current_employee.last_name}</>
                            )}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.transform((data) => ({
                                    ...data,
                                    license_seats: data.license_seats ? Number(data.license_seats) : null,
                                    asset_value: data.asset_value ? Number(data.asset_value) : null,
                                    asset_currency: data.asset_currency || null,
                                }));
                                form.put(ItAssetController.update.url(asset.id), {
                                    forceFormData: isAssigned,
                                    onSuccess: () => {
                                        setSelectedDocumentNames([]);
                                        if (documentInputRef.current) {
                                            documentInputRef.current.value = '';
                                        }
                                        form.setData('documents', []);
                                    },
                                });
                            }}
                            className="space-y-4"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="name">Label</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    required
                                    disabled={isAssigned}
                                />
                                {isAssigned && (
                                    <p className="text-muted-foreground text-xs">Return the asset to edit the label and other details.</p>
                                )}
                                <InputError message={form.errors.name} />
                            </div>

                            {(asset.category === 'hardware' || asset.category === 'accessory') && (
                                <div className="grid gap-2">
                                    <Label htmlFor="serial_number">Serial number</Label>
                                    <Input
                                        id="serial_number"
                                        value={form.data.serial_number}
                                        onChange={(e) => form.setData('serial_number', e.target.value)}
                                        disabled={isAssigned}
                                    />
                                </div>
                            )}

                            {asset.category === 'hardware' && !isAssigned && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="asset_tag">Asset tag</Label>
                                        <Input id="asset_tag" value={form.data.asset_tag} onChange={(e) => form.setData('asset_tag', e.target.value)} />
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="purchase_date">Purchase date</Label>
                                            <Input id="purchase_date" type="date" value={form.data.purchase_date} onChange={(e) => form.setData('purchase_date', e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="warranty_expires_at">Warranty expires</Label>
                                            <Input id="warranty_expires_at" type="date" value={form.data.warranty_expires_at} onChange={(e) => form.setData('warranty_expires_at', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="asset_value">Asset value</Label>
                                            <Input
                                                id="asset_value"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={form.data.asset_value}
                                                onChange={(e) => form.setData('asset_value', e.target.value)}
                                            />
                                            <InputError message={form.errors.asset_value} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="asset_currency">Currency</Label>
                                            <Select value={form.data.asset_currency} onValueChange={(v) => form.setData('asset_currency', v)}>
                                                <SelectTrigger id="asset_currency"><SelectValue placeholder="Select currency" /></SelectTrigger>
                                                <SelectContent>
                                                    {CURRENCIES.map((currency) => (
                                                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={form.errors.asset_currency} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {asset.category === 'software' && !isAssigned && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="license_key">License key</Label>
                                        <Input id="license_key" value={form.data.license_key} onChange={(e) => form.setData('license_key', e.target.value)} />
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="license_seats">Seats</Label>
                                            <Input id="license_seats" type="number" value={form.data.license_seats} onChange={(e) => form.setData('license_seats', e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="expiry_date">Expiry</Label>
                                            <Input id="expiry_date" type="date" value={form.data.expiry_date} onChange={(e) => form.setData('expiry_date', e.target.value)} />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="condition_notes">Condition notes</Label>
                                <Textarea id="condition_notes" value={form.data.condition_notes} onChange={(e) => form.setData('condition_notes', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea id="remarks" value={form.data.remarks} onChange={(e) => form.setData('remarks', e.target.value)} />
                            </div>

                            {isAssigned && (
                                <div className="grid gap-2 rounded-md border p-4">
                                    <Label htmlFor="documents">Assignment documents</Label>
                                    {existingDocuments.length > 0 && (
                                        <ul className="space-y-2">
                                            {existingDocuments.map((doc) => (
                                                <li key={doc.id}>
                                                    <a
                                                        href={`/it-assets/assignment-documents/${doc.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                                    >
                                                        <FileText className="size-4 shrink-0" />
                                                        {doc.original_name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <Input
                                        id="documents"
                                        ref={documentInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files ?? []);
                                            form.setData('documents', files);
                                            setSelectedDocumentNames(files.map((file) => file.name));
                                        }}
                                    />
                                    <p className="text-muted-foreground text-xs">
                                        Upload handover or acknowledgment documents (PDF, JPG, PNG). Up to 5 files, 5 MB each.
                                    </p>
                                    {selectedDocumentNames.length > 0 && (
                                        <ul className="text-muted-foreground space-y-1 text-xs">
                                            {selectedDocumentNames.map((name) => (
                                                <li key={name}>New: {name}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <InputError message={form.errors.documents} />
                                    <InputError message={form.errors['documents.0']} />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button type="submit" disabled={form.processing}>Save changes</Button>
                                <Link href={ItAssetController.show.url(asset.id)}><Button type="button" variant="outline">Cancel</Button></Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
