import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PayDeductionTypeController from '@/actions/App/Http/Controllers/Payroll/PayDeductionTypeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type BehaviorOption = { value: string; label: string };

type DeductionType = {
    id: number;
    code: string;
    name: string;
    behavior: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
};

export default function Edit({
    deductionType,
    behaviorOptions,
}: {
    deductionType: DeductionType;
    behaviorOptions: BehaviorOption[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Deduction Types', href: '/payroll/deduction-types' },
        { title: deductionType.name, href: `/payroll/deduction-types/${deductionType.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${deductionType.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link href="/payroll/deduction-types" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    Back to Deduction Types
                </Link>

                <Heading title="Edit Deduction Type" description="Update deduction type details" />

                <Form {...PayDeductionTypeController.update.form(deductionType.id)} className="space-y-6">
                    {({ processing, errors }) => (
                        <div className="max-w-md space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Code</Label>
                                <Input id="code" name="code" required maxLength={50} defaultValue={deductionType.code} autoComplete="off" />
                                <InputError message={errors.code} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" required maxLength={255} defaultValue={deductionType.name} />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="behavior">Behavior</Label>
                                <select
                                    id="behavior"
                                    name="behavior"
                                    required
                                    defaultValue={deductionType.behavior}
                                    className="border-input flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                                >
                                    {behaviorOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <InputError message={errors.behavior} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sort_order">Sort order</Label>
                                <Input id="sort_order" name="sort_order" type="number" min="0" defaultValue={deductionType.sort_order} />
                                <InputError message={errors.sort_order} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    maxLength={1000}
                                    defaultValue={deductionType.description ?? ''}
                                    className="border-input focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px]"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="hidden" name="is_active" value="0" />
                                <input type="checkbox" name="is_active" value="1" defaultChecked={deductionType.is_active} className="size-4 rounded border" />
                                Active
                            </label>
                            <div className="flex gap-4">
                                <Button disabled={processing} type="submit">Update Deduction Type</Button>
                                <Link href="/payroll/deduction-types">
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
