import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, CircleDollarSign, Clock, Eye, Plus } from 'lucide-react';
import { useState } from 'react';
import { index as runsIndex, store as runsStore } from '@/actions/App/Http/Controllers/Payroll/PayrollRunController';
import { index as periodVerificationsIndex } from '@/actions/App/Http/Controllers/Payroll/PayrollPeriodVerificationController';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ModulePermissionsMap } from '@/types/permissions';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: periodVerificationsIndex().url },
    { title: 'Payroll runs', href: runsIndex().url },
];

type PayrollRun = {
    id: number;
    status: string;
    currency: string;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    period_from: string | null;
    period_to: string | null;
    created_at: string;
    approved_at: string | null;
    paid_at: string | null;
};

type VerifiedPeriod = {
    id: number;
    period_from: string;
    period_to: string;
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

function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'draft':
            return (
                <Badge variant="outline" className="gap-1 border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
                    <Clock className="size-3" />
                    Draft
                </Badge>
            );
        case 'review':
            return (
                <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    <Clock className="size-3" />
                    Review
                </Badge>
            );
        case 'approved':
            return (
                <Badge variant="outline" className="gap-1 border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <CheckCircle2 className="size-3" />
                    Approved
                </Badge>
            );
        case 'paid':
            return (
                <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="size-3" />
                    Paid
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

export default function PayrollRunsIndex({
    runs,
    verifiedPeriods,
}: {
    runs: PayrollRun[];
    verifiedPeriods: VerifiedPeriod[];
}) {
    const { flash, modulePermissions } = usePage().props as {
        flash?: { success?: string; error?: string };
        modulePermissions?: ModulePermissionsMap;
    };

    const canCreate = modulePermissions?.payroll?.can_create ?? false;
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll runs" />

            <div className="space-y-6 p-6">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        title="Payroll runs"
                        description="Process salary for verified pay periods. Only fully verified periods appear here."
                    />

                    {canCreate && verifiedPeriods.length > 0 && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-1.5 shrink-0">
                                    <Plus className="size-4" />
                                    New run
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create payroll run</DialogTitle>
                                    <DialogDescription>
                                        Select a verified pay period to generate salary calculations for all employees.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...runsStore.form()} onSuccess={() => setDialogOpen(false)}>
                                    {({ errors, processing }) => (
                                        <>
                                            <div className="space-y-4 py-2">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="payroll_period_verification_id">Pay period</Label>
                                                    <Select name="payroll_period_verification_id" required>
                                                        <SelectTrigger id="payroll_period_verification_id">
                                                            <SelectValue placeholder="Select a verified period…" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {verifiedPeriods.map((p) => (
                                                                <SelectItem key={p.id} value={String(p.id)}>
                                                                    {formatDate(p.period_from)} — {formatDate(p.period_to)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.payroll_period_verification_id && (
                                                        <p className="text-sm text-destructive">{errors.payroll_period_verification_id}</p>
                                                    )}
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="notes">Notes (optional)</Label>
                                                    <Textarea
                                                        id="notes"
                                                        name="notes"
                                                        placeholder="Internal notes for this payroll run…"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button type="submit" disabled={processing}>
                                                    {processing ? 'Creating…' : 'Create run'}
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    )}
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

                {runs.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <CircleDollarSign className="size-10 text-muted-foreground/40" />
                            <div>
                                <p className="font-medium">No payroll runs yet</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {verifiedPeriods.length === 0
                                        ? 'Verify a pay period first before creating a payroll run.'
                                        : 'Create a new run to process salary for a verified pay period.'}
                                </p>
                            </div>
                            {verifiedPeriods.length === 0 && (
                                <Link href={periodVerificationsIndex().url}>
                                    <Button variant="outline" size="sm">
                                        Go to period verification
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pay period</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Deductions</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net pay</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {runs.map((run) => (
                                    <tr key={run.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            {run.period_from && run.period_to
                                                ? `${formatDate(run.period_from)} — ${formatDate(run.period_to)}`
                                                : `Run #${run.id}`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={run.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {formatCurrency(run.total_gross, run.currency)}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-destructive">
                                            -{formatCurrency(run.total_deductions, run.currency)}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                                            {formatCurrency(run.total_net, run.currency)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(run.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/payroll/runs/${run.id}`}>
                                                <Button variant="ghost" size="sm" className="gap-1.5">
                                                    <Eye className="size-3.5" />
                                                    View
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
