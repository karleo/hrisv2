import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, Eye, Plus, RotateCcw, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { index as periodVerificationsIndex, store as periodVerificationsStore } from '@/actions/App/Http/Controllers/Payroll/PayrollPeriodVerificationController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: '/payroll/period-verifications' },
    { title: 'Period verification', href: '/payroll/period-verifications' },
];

type PeriodVerification = {
    id: number;
    period_from: string;
    period_to: string;
    status: string;
    hr_verifier_name: string | null;
    hr_verified_at: string | null;
    finance_verifier_name: string | null;
    finance_verified_at: string | null;
};

function formatDate(value: string | null): string {
    if (!value) return '—';
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [, yyyy, mm, dd] = match;
        return `${dd}/${mm}/${yyyy}`;
    }
    return value;
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'pending_hr':
            return (
                <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    <Clock className="size-3" />
                    Pending HR
                </Badge>
            );
        case 'pending_finance':
            return (
                <Badge variant="outline" className="gap-1 border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Clock className="size-3" />
                    Pending Finance
                </Badge>
            );
        case 'verified':
            return (
                <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="size-3" />
                    Verified
                </Badge>
            );
        case 'reopened':
            return (
                <Badge variant="outline" className="gap-1 border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300">
                    <RotateCcw className="size-3" />
                    Reopened
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

function NewPeriodDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                    <Plus className="size-4" />
                    New pay period
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create pay period</DialogTitle>
                    <DialogDescription>
                        Set the date range for the pay period. HR must verify attendance before salary can be processed.
                    </DialogDescription>
                </DialogHeader>
                <Form action={periodVerificationsStore()} method="post" onSuccess={() => setOpen(false)}>
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="period_from">From</Label>
                                    <Input id="period_from" name="period_from" type="date" required />
                                    {errors.period_from && (
                                        <p className="text-sm text-destructive">{errors.period_from}</p>
                                    )}
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="period_to">To</Label>
                                    <Input id="period_to" name="period_to" type="date" required />
                                    {errors.period_to && (
                                        <p className="text-sm text-destructive">{errors.period_to}</p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating…' : 'Create period'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function PeriodVerificationIndex({ periods }: { periods: PeriodVerification[] }) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll period verification" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Payroll period verification"
                        description="HR verifies attendance, then Finance verifies overtime before salary can be processed."
                    />
                    <NewPeriodDialog />
                </div>

                {flash?.success && (
                    <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {flash.error}
                    </div>
                )}

                {periods.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <ShieldAlert className="size-10 text-muted-foreground" />
                            <p className="font-medium">No pay periods yet</p>
                            <p className="text-sm text-muted-foreground">
                                Create a new pay period to start the attendance verification process.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {periods.map((period) => (
                                    <div key={period.id} className="flex items-center gap-4 px-4 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium">
                                                {formatDate(period.period_from)} — {formatDate(period.period_to)}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                {period.hr_verifier_name ? (
                                                    <span>HR: {period.hr_verifier_name} on {formatDate(period.hr_verified_at)}</span>
                                                ) : (
                                                    <span>HR: pending</span>
                                                )}
                                                {period.finance_verifier_name ? (
                                                    <span>Finance: {period.finance_verifier_name} on {formatDate(period.finance_verified_at)}</span>
                                                ) : (
                                                    <span>Finance: pending</span>
                                                )}
                                            </div>
                                        </div>
                                        <StatusBadge status={period.status} />
                                        <Link
                                            href={periodVerificationsIndex().url + '/' + period.id}
                                            className="ml-2"
                                        >
                                            <Button variant="ghost" size="sm" className="gap-1.5">
                                                <Eye className="size-4" />
                                                Review
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
