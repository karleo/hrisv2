import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Hardware = {
    id: number;
    code: string;
    name: string;
};

type AssetValue = {
    id: number;
    hardware_id: number;
    asset_model: string | null;
    asset_value: string | null;
    asset_currency: string | null;
    purchase_date: string | null;
    vendor: string | null;
    serial_number: string | null;
    specs: string | null;
    effective_from: string | null;
    effective_to: string | null;
    is_active: boolean;
};

const selectClassName =
    'border-input text-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark]';

const currencyOptions = ['AED', 'USD', 'SAR'];

function dateValue(value: string | null): string {
    return value?.slice(0, 10) ?? '';
}

export default function Edit({
    assetValue,
    hardware,
}: {
    assetValue: AssetValue;
    hardware: Hardware[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Models', href: '/hardware-asset-values' },
        { title: 'Edit', href: `/hardware-asset-values/${assetValue.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Model" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href="/hardware-asset-values"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Models
                </Link>

                <Heading
                    title="Edit Model"
                    description="Update hardware valuation and asset details"
                />

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Model Information</CardTitle>
                        </CardHeader>
                        <Form
                            action={`/hardware-asset-values/${assetValue.id}`}
                            method="put"
                            className="w-full"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="hardware_id">
                                                Hardware <span className="text-destructive">*</span>
                                            </Label>
                                            <select
                                                id="hardware_id"
                                                name="hardware_id"
                                                required
                                                defaultValue={assetValue.hardware_id}
                                                className={selectClassName}
                                            >
                                                <option value="" className="bg-background text-foreground">
                                                    Select hardware
                                                </option>
                                                {hardware.map((item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                        className="bg-background text-foreground"
                                                    >
                                                        {item.code} - {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.hardware_id} />
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="asset_model">Model</Label>
                                                <Input
                                                    id="asset_model"
                                                    name="asset_model"
                                                    maxLength={255}
                                                    defaultValue={assetValue.asset_model ?? ''}
                                                    placeholder="e.g. Latitude 5440"
                                                />
                                                <InputError message={errors.asset_model} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="serial_number">Serial Number</Label>
                                                <Input
                                                    id="serial_number"
                                                    name="serial_number"
                                                    maxLength={255}
                                                    defaultValue={assetValue.serial_number ?? ''}
                                                    placeholder="Asset serial number"
                                                />
                                                <InputError message={errors.serial_number} />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="purchase_date">Purchase Date</Label>
                                                <Input
                                                    id="purchase_date"
                                                    name="purchase_date"
                                                    type="date"
                                                    defaultValue={dateValue(assetValue.purchase_date)}
                                                />
                                                <InputError message={errors.purchase_date} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="vendor">Vendor</Label>
                                                <Input
                                                    id="vendor"
                                                    name="vendor"
                                                    maxLength={255}
                                                    defaultValue={assetValue.vendor ?? ''}
                                                    placeholder="Supplier or vendor"
                                                />
                                                <InputError message={errors.vendor} />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="specs">Specs</Label>
                                            <Textarea
                                                id="specs"
                                                name="specs"
                                                rows={4}
                                                maxLength={5000}
                                                defaultValue={assetValue.specs ?? ''}
                                                placeholder="Processor, RAM, storage, accessories, or other specifications"
                                            />
                                            <InputError message={errors.specs} />
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="asset_value">Asset Value</Label>
                                                <Input
                                                    id="asset_value"
                                                    name="asset_value"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    defaultValue={assetValue.asset_value ?? ''}
                                                    placeholder="0.00"
                                                />
                                                <InputError message={errors.asset_value} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="asset_currency">Currency</Label>
                                                <select
                                                    id="asset_currency"
                                                    name="asset_currency"
                                                    defaultValue={assetValue.asset_currency ?? ''}
                                                    className={selectClassName}
                                                >
                                                    <option value="" className="bg-background text-foreground">
                                                        Select currency
                                                    </option>
                                                    {currencyOptions.map((currency) => (
                                                        <option
                                                            key={currency}
                                                            value={currency}
                                                            className="bg-background text-foreground"
                                                        >
                                                            {currency}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.asset_currency} />
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-3 rounded-md border bg-muted/20 p-3 text-sm">
                                            <input type="hidden" name="is_active" value="0" />
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                value="1"
                                                defaultChecked={assetValue.is_active}
                                                className="size-4"
                                            />
                                            Active for new IT asset request snapshots
                                        </label>
                                        <InputError message={errors.is_active} />
                                    </CardContent>
                                    <CardFooter className="flex gap-3">
                                        <Button disabled={processing} type="submit">
                                            Update Model
                                        </Button>
                                        <Link href="/hardware-asset-values">
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
