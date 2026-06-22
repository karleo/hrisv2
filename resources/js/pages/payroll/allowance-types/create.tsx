import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PayAllowanceTypeController from '@/actions/App/Http/Controllers/Payroll/PayAllowanceTypeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Allowance Types', href: '/payroll/allowance-types' },
    { title: 'Create', href: '/payroll/allowance-types/create' },
];

export default function Create() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Allowance Type" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link href="/payroll/allowance-types" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    Back to Allowance Types
                </Link>

                <Heading title="Create Allowance Type" description="Add a new allowance type to the master list" />

                <Form {...PayAllowanceTypeController.store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <div className="max-w-md space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Code</Label>
                                <Input id="code" name="code" required maxLength={50} placeholder="e.g. ALW-HOUSING" autoComplete="off" />
                                <InputError message={errors.code} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" required maxLength={255} placeholder="e.g. Housing" />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sort_order">Sort order</Label>
                                <Input id="sort_order" name="sort_order" type="number" min="0" defaultValue="0" />
                                <InputError message={errors.sort_order} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    maxLength={1000}
                                    placeholder="Optional description"
                                    className="border-input focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px]"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="hidden" name="is_active" value="0" />
                                <input type="checkbox" name="is_active" value="1" defaultChecked className="size-4 rounded border" />
                                Active
                            </label>
                            <div className="flex gap-4">
                                <Button disabled={processing} type="submit">Create Allowance Type</Button>
                                <Link href="/payroll/allowance-types">
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
