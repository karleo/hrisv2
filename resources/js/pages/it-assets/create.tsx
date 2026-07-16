import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    ExternalLink,
    HardDrive,
    Package,
    StickyNote,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import ItAssetController from '@/actions/App/Http/Controllers/ItAssetController';
import Heading from '@/components/heading';
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

type CatalogItem = { id: number; code: string; name: string };
type AssetValue = {
    id: number;
    hardware_id: number;
    asset_model: string | null;
    serial_number: string | null;
    asset_value: string | null;
    asset_currency: string | null;
    hardware?: CatalogItem;
};
type Option = { value: string; label: string };

const CURRENCIES = ['AED', 'USD', 'SAR'] as const;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'IT Assets', href: '/it-assets' },
    { title: 'Create', href: '/it-assets/create' },
];

export default function Create({
    categories = [],
    hardware = [],
    hardwareAssetValues = [],
    software = [],
    accessories = [],
}: {
    categories?: Option[];
    hardware?: CatalogItem[];
    hardwareAssetValues?: AssetValue[];
    software?: CatalogItem[];
    accessories?: CatalogItem[];
}) {
    const [category, setCategory] = useState('hardware');

    const form = useForm({
        category: 'hardware',
        name: '',
        hardware_id: '',
        hardware_asset_value_id: '',
        software_id: '',
        accessory_id: '',
        serial_number: '',
        asset_tag: '',
        license_key: '',
        license_seats: '',
        expiry_date: '',
        purchase_date: '',
        warranty_expires_at: '',
        asset_value: '',
        asset_currency: '',
        condition_notes: '',
        remarks: '',
    });

    const filteredAssetValues = useMemo(
        () => hardwareAssetValues.filter((v) => String(v.hardware_id) === form.data.hardware_id),
        [hardwareAssetValues, form.data.hardware_id],
    );

    function selectModel(modelId: string) {
        form.setData('hardware_asset_value_id', modelId);
        const selected = filteredAssetValues.find((v) => String(v.id) === modelId);
        if (selected) {
            form.setData({
                ...form.data,
                hardware_asset_value_id: modelId,
                asset_value: selected.asset_value ?? '',
                asset_currency: selected.asset_currency ?? '',
            });
        }
    }

    function submit() {
        form.transform((data) => ({
            ...data,
            category,
            hardware_id: data.hardware_id ? Number(data.hardware_id) : null,
            hardware_asset_value_id: data.hardware_asset_value_id ? Number(data.hardware_asset_value_id) : null,
            software_id: data.software_id ? Number(data.software_id) : null,
            accessory_id: data.accessory_id ? Number(data.accessory_id) : null,
            license_seats: data.license_seats ? Number(data.license_seats) : null,
            asset_value: data.asset_value ? Number(data.asset_value) : null,
            asset_currency: data.asset_currency || null,
        }));
        form.post(ItAssetController.store.url());
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create IT Asset" />

            <div className="flex min-h-screen flex-1 flex-col bg-muted/30">
                <div className="border-b bg-card px-4 py-6 md:px-8">
                    <div className="flex w-full flex-col gap-4">
                        <Link
                            href={index().url}
                            className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to inventory
                        </Link>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <Heading
                                title="Create IT Asset"
                                description="Register a new device, software license, or accessory in the inventory."
                            />
                            <div className="flex shrink-0 flex-wrap gap-2">
                                <Button type="button" disabled={form.processing} onClick={submit}>
                                    {form.processing ? 'Creating…' : 'Create asset'}
                                </Button>
                                <Link href={index().url}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-4 py-8 md:px-8">
                    <form
                        className="grid w-full gap-6 lg:grid-cols-12"
                        onSubmit={(e) => {
                            e.preventDefault();
                            submit();
                        }}
                    >
                        <div className="space-y-6 lg:col-span-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="size-4 text-muted-foreground" />
                                        General
                                    </CardTitle>
                                    <CardDescription>
                                        Choose the asset category and give it a recognizable label.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Category</Label>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.value} value={c.value}>
                                                        {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Label</Label>
                                        <Input
                                            id="name"
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            placeholder="e.g. Finance laptop — Jane"
                                            required
                                        />
                                        <InputError message={form.errors.name} />
                                    </div>
                                </CardContent>
                            </Card>

                            {category === 'hardware' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HardDrive className="size-4 text-muted-foreground" />
                                            Device details
                                        </CardTitle>
                                        <CardDescription>
                                            Device type, model, identification numbers, and financial info.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label>Device type</Label>
                                            <Select
                                                value={form.data.hardware_id}
                                                onValueChange={(v) =>
                                                    form.setData({
                                                        ...form.data,
                                                        hardware_id: v,
                                                        hardware_asset_value_id: '',
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select device type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {hardware.map((h) => (
                                                        <SelectItem key={h.id} value={String(h.id)}>
                                                            {h.code} — {h.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={form.errors.hardware_id} />
                                        </div>
                                        <div className="grid gap-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <Label>Model</Label>
                                                <Link
                                                    href="/hardware-asset-values/create"
                                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                    Manage models
                                                    <ExternalLink className="size-3" />
                                                </Link>
                                            </div>
                                            <Select
                                                value={form.data.hardware_asset_value_id}
                                                onValueChange={selectModel}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredAssetValues.map((v) => (
                                                        <SelectItem key={v.id} value={String(v.id)}>
                                                            {v.asset_model ?? 'Model'}
                                                            {v.asset_value
                                                                ? ` — ${v.asset_value} ${v.asset_currency ?? ''}`
                                                                : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={form.errors.hardware_asset_value_id} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="serial_number">Serial number</Label>
                                            <Input
                                                id="serial_number"
                                                value={form.data.serial_number}
                                                onChange={(e) =>
                                                    form.setData('serial_number', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="asset_tag">Asset tag</Label>
                                            <Input
                                                id="asset_tag"
                                                value={form.data.asset_tag}
                                                onChange={(e) => form.setData('asset_tag', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="purchase_date"
                                                className="flex items-center gap-2"
                                            >
                                                <Calendar className="size-3.5" />
                                                Purchase date
                                            </Label>
                                            <Input
                                                id="purchase_date"
                                                type="date"
                                                value={form.data.purchase_date}
                                                onChange={(e) =>
                                                    form.setData('purchase_date', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="warranty_expires_at"
                                                className="flex items-center gap-2"
                                            >
                                                <Calendar className="size-3.5" />
                                                Warranty expires
                                            </Label>
                                            <Input
                                                id="warranty_expires_at"
                                                type="date"
                                                value={form.data.warranty_expires_at}
                                                onChange={(e) =>
                                                    form.setData('warranty_expires_at', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="asset_value">Asset value</Label>
                                            <Input
                                                id="asset_value"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={form.data.asset_value}
                                                onChange={(e) =>
                                                    form.setData('asset_value', e.target.value)
                                                }
                                            />
                                            <InputError message={form.errors.asset_value} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="asset_currency">Currency</Label>
                                            <Select
                                                value={form.data.asset_currency}
                                                onValueChange={(v) => form.setData('asset_currency', v)}
                                            >
                                                <SelectTrigger id="asset_currency">
                                                    <SelectValue placeholder="Select currency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CURRENCIES.map((currency) => (
                                                        <SelectItem key={currency} value={currency}>
                                                            {currency}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={form.errors.asset_currency} />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {category === 'software' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HardDrive className="size-4 text-muted-foreground" />
                                            License details
                                        </CardTitle>
                                        <CardDescription>
                                            Software product, license key, seats, and expiry.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label>Software</Label>
                                            <Select
                                                value={form.data.software_id}
                                                onValueChange={(v) => form.setData('software_id', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select software" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {software.map((s) => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            {s.code} — {s.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={form.errors.software_id} />
                                        </div>
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="license_key">License key</Label>
                                            <Input
                                                id="license_key"
                                                value={form.data.license_key}
                                                onChange={(e) =>
                                                    form.setData('license_key', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="license_seats">Seats</Label>
                                            <Input
                                                id="license_seats"
                                                type="number"
                                                min={1}
                                                value={form.data.license_seats}
                                                onChange={(e) =>
                                                    form.setData('license_seats', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="expiry_date">Expiry date</Label>
                                            <Input
                                                id="expiry_date"
                                                type="date"
                                                value={form.data.expiry_date}
                                                onChange={(e) =>
                                                    form.setData('expiry_date', e.target.value)
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {category === 'accessory' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HardDrive className="size-4 text-muted-foreground" />
                                            Accessory details
                                        </CardTitle>
                                        <CardDescription>
                                            Accessory type and serial number.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label>Accessory</Label>
                                            <Select
                                                value={form.data.accessory_id}
                                                onValueChange={(v) => form.setData('accessory_id', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select accessory" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accessories.map((a) => (
                                                        <SelectItem key={a.id} value={String(a.id)}>
                                                            {a.code} — {a.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={form.errors.accessory_id} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="serial_number">Serial number</Label>
                                            <Input
                                                id="serial_number"
                                                value={form.data.serial_number}
                                                onChange={(e) =>
                                                    form.setData('serial_number', e.target.value)
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="space-y-6 lg:col-span-4">
                            <Card className="lg:sticky lg:top-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <StickyNote className="size-4 text-muted-foreground" />
                                        Notes
                                    </CardTitle>
                                    <CardDescription>
                                        Optional condition and internal remarks.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="condition_notes">Condition notes</Label>
                                        <Textarea
                                            id="condition_notes"
                                            rows={4}
                                            value={form.data.condition_notes}
                                            onChange={(e) =>
                                                form.setData('condition_notes', e.target.value)
                                            }
                                            placeholder="Physical condition, included accessories…"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="remarks">Remarks</Label>
                                        <Textarea
                                            id="remarks"
                                            rows={4}
                                            value={form.data.remarks}
                                            onChange={(e) => form.setData('remarks', e.target.value)}
                                            placeholder="Internal notes for IT staff…"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 border-t pt-4 sm:hidden">
                                        <Button type="submit" disabled={form.processing}>
                                            {form.processing ? 'Creating…' : 'Create asset'}
                                        </Button>
                                        <Link href={index().url}>
                                            <Button type="button" variant="outline" className="w-full">
                                                Cancel
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
