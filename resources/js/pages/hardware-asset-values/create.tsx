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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Models', href: '/hardware-asset-values' },
    { title: 'Create', href: '/hardware-asset-values/create' },
];

const selectClassName =
    'border-input text-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark]';

const currencyOptions = ['AED', 'USD', 'SAR'];

export default function Create({ hardware }: { hardware: Hardware[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Model" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href="/hardware-asset-values"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Models
                </Link>

                <Heading
                    title="Create Model"
                    description="Add hardware valuation and asset details"
                />

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Model Information</CardTitle>
                        </CardHeader>
                        <Form action="/hardware-asset-values" method="post" className="w-full">
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
                                                />
                                                <InputError message={errors.purchase_date} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="vendor">Vendor</Label>
                                                <Input
                                                    id="vendor"
                                                    name="vendor"
                                                    maxLength={255}
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
                                                    placeholder="0.00"
                                                />
                                                <InputError message={errors.asset_value} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="asset_currency">Currency</Label>
                                                <select
                                                    id="asset_currency"
                                                    name="asset_currency"
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
                                                defaultChecked
                                                className="size-4"
                                            />
                                            Active for new IT asset request snapshots
                                        </label>
                                        <InputError message={errors.is_active} />
                                    </CardContent>
                                    <CardFooter className="flex gap-3">
                                        <Button disabled={processing} type="submit">
                                            Create Model
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
