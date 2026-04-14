import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import LeaveTypeController from '@/actions/App/Http/Controllers/LeaveTypeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { edit, index } from '@/routes/leave-types';
import type { BreadcrumbItem } from '@/types';

type LeaveType = {
    id: number;
    code: string;
    name: string;
    leave_category: 'paid' | 'unpaid';
    description: string | null;
};

export default function Edit({ leaveType }: { leaveType: LeaveType }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leave Types', href: index().url },
        {
            title: leaveType.name,
            href: edit({ leave_type: leaveType.id }).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${leaveType.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Leave Types
                </Link>

                <Heading
                    title="Edit Leave Type"
                    description="Update leave type details"
                />

                <Form
                    {...LeaveTypeController.update.form(leaveType.id)}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="max-w-md space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Code</Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        required
                                        maxLength={50}
                                        defaultValue={leaveType.code}
                                        placeholder="e.g. LV-001"
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.code} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        required
                                        maxLength={255}
                                        defaultValue={leaveType.name}
                                        placeholder="e.g. Annual Leave"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="leave_category">
                                        Leave Category
                                    </Label>
                                    <select
                                        id="leave_category"
                                        name="leave_category"
                                        required
                                        defaultValue={leaveType.leave_category}
                                        className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="paid">Paid Leave</option>
                                        <option value="unpaid">Unpaid Leave</option>
                                    </select>
                                    <InputError message={errors.leave_category} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={4}
                                        maxLength={1000}
                                        defaultValue={
                                            leaveType.description ?? ''
                                        }
                                        placeholder="Optional description"
                                        className="border-input focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="flex gap-4">
                                    <Button disabled={processing} type="submit">
                                        Update Leave Type
                                    </Button>
                                    <Link href={index()}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
