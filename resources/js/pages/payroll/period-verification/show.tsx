import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft, Clock, RotateCcw, ShieldCheck, ShieldX, Trash2 } from 'lucide-react';
import {
    destroy as destroyPeriodAction,
    reopen as reopenAction,
    verifyAttendance as verifyAttendanceAction,
    verifyOvertime as verifyOvertimeAction,
} from '@/actions/App/Http/Controllers/Payroll/PayrollPeriodVerificationController';
import { index as periodVerificationsIndex } from '@/actions/App/Http/Controllers/Payroll/PayrollPeriodVerificationController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ModulePermissionsMap } from '@/types/permissions';

type Period = {
    id: number;
    period_from: string;
    period_to: string;
    status: string;
    hr_verifier_name: string | null;
    hr_verified_at: string | null;
    hr_notes: string | null;
    finance_verifier_name: string | null;
    finance_verified_at: string | null;
    finance_notes: string | null;
};

type Summary = {
    total_employees: number;
    total_attendance_days: number;
    total_overtime_minutes: number;
    total_working_minutes: number;
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

function formatMinutes(minutes: number): string {
    if (minutes <= 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

function StatusStep({
    step,
    label,
    verifierName,
    verifiedAt,
    notes,
    isCurrent,
    isComplete,
}: {
    step: number;
    label: string;
    verifierName: string | null;
    verifiedAt: string | null;
    notes: string | null;
    isCurrent: boolean;
    isComplete: boolean;
}) {
    return (
        <div className={`flex gap-4 rounded-lg border p-4 ${isCurrent ? 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30' : isComplete ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30' : 'border-border bg-muted/20'}`}>
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isComplete ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                {isComplete ? <CheckCircle2 className="size-4" /> : step}
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-medium">{label}</p>
                {isComplete ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Verified by {verifierName} on {formatDate(verifiedAt)}
                        {notes ? ` — "${notes}"` : ''}
                    </p>
                ) : isCurrent ? (
                    <p className="mt-0.5 text-sm text-blue-600 dark:text-blue-400">Awaiting verification</p>
                ) : (
                    <p className="mt-0.5 text-sm text-muted-foreground">Waiting for step {step - 1} to complete</p>
                )}
            </div>
        </div>
    );
}

type PayrollRunMeta = {
    total_runs: number;
    has_paid_run: boolean;
    active_run_id: number | null;
    active_run_status: string | null;
};

export default function PeriodVerificationShow({
    period,
    summary,
    payrollRunMeta,
}: {
    period: Period;
    summary: Summary;
    payrollRunMeta: PayrollRunMeta;
}) {
    const { flash, modulePermissions } = usePage().props as {
        flash?: { success?: string; error?: string };
        modulePermissions?: ModulePermissionsMap;
    };

    const canVerify = modulePermissions?.payroll?.can_verify ?? false;
    const canUpdate = modulePermissions?.payroll?.can_update ?? false;
    const canDelete = modulePermissions?.payroll?.can_delete ?? false;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payroll', href: periodVerificationsIndex().url },
        { title: 'Period verification', href: periodVerificationsIndex().url },
        {
            title: `${formatDate(period.period_from)} — ${formatDate(period.period_to)}`,
            href: '#',
        },
    ];

    const hrComplete = period.status === 'pending_finance' || period.status === 'verified';
    const financeComplete = period.status === 'verified';
    const isPendingHr = period.status === 'pending_hr' || period.status === 'reopened';
    const isPendingFinance = period.status === 'pending_finance';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pay period ${period.period_from} — ${period.period_to}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href={periodVerificationsIndex().url}>
                        <Button variant="ghost" size="sm" className="gap-1.5">
                            <ChevronLeft className="size-4" />
                            All periods
                        </Button>
                    </Link>
                    <Heading
                        title={`Pay period: ${formatDate(period.period_from)} — ${formatDate(period.period_to)}`}
                        description="Review attendance and overtime before processing salary."
                    />
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

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Attendance summary */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Attendance summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                                        <p className="text-2xl font-bold">{summary.total_employees}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Employees</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                                        <p className="text-2xl font-bold">{summary.total_attendance_days}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Attendance days</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                                        <p className="text-2xl font-bold">{formatMinutes(summary.total_working_minutes)}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Total worked</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                                        <p className="text-2xl font-bold">{formatMinutes(summary.total_overtime_minutes)}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Overtime</p>
                                    </div>
                                </div>
                                <div className="mt-4 text-sm text-muted-foreground">
                                    <Link
                                        href={`/attendance-management?from=${period.period_from}&to=${period.period_to}`}
                                        className="underline underline-offset-4 hover:text-foreground"
                                    >
                                        View attendance management →
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Verification actions */}
                        {canVerify && isPendingHr && (
                            <Card className="border-amber-300 dark:border-amber-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                        <Clock className="size-4" />
                                        Step 1 — Verify attendance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Review the attendance summary above. Once satisfied, verify attendance to allow Finance to proceed with overtime review.
                                    </p>
                                    <Form action={verifyAttendanceAction(period.id)} method="post">
                                        {({ errors, processing }) => (
                                            <div className="space-y-3">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="hr_notes">Notes (optional)</Label>
                                                    <Textarea
                                                        id="hr_notes"
                                                        name="notes"
                                                        placeholder="Any remarks about attendance for this period…"
                                                        rows={2}
                                                    />
                                                    {errors.notes && (
                                                        <p className="text-sm text-destructive">{errors.notes}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="gap-1.5 bg-amber-600 hover:bg-amber-700"
                                                >
                                                    <ShieldCheck className="size-4" />
                                                    {processing ? 'Verifying…' : 'Verify attendance'}
                                                </Button>
                                            </div>
                                        )}
                                    </Form>
                                </CardContent>
                            </Card>
                        )}

                        {canVerify && isPendingFinance && (
                            <Card className="border-blue-300 dark:border-blue-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                        <Clock className="size-4" />
                                        Step 2 — Verify overtime
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        HR has verified attendance. Review the overtime totals above and confirm they are correct for payroll processing.
                                    </p>
                                    <Form action={verifyOvertimeAction(period.id)} method="post">
                                        {({ errors, processing }) => (
                                            <div className="space-y-3">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="finance_notes">Notes (optional)</Label>
                                                    <Textarea
                                                        id="finance_notes"
                                                        name="notes"
                                                        placeholder="Any remarks about overtime for this period…"
                                                        rows={2}
                                                    />
                                                    {errors.notes && (
                                                        <p className="text-sm text-destructive">{errors.notes}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <ShieldCheck className="size-4" />
                                                    {processing ? 'Verifying…' : 'Verify overtime'}
                                                </Button>
                                            </div>
                                        )}
                                    </Form>
                                </CardContent>
                            </Card>
                        )}

                        {financeComplete && (
                            <Card className="border-emerald-300 dark:border-emerald-700">
                                <CardContent className="flex items-center gap-3 py-4">
                                    <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />
                                    <div>
                                        <p className="font-medium text-emerald-700 dark:text-emerald-300">Period fully verified</p>
                                        <p className="text-sm text-muted-foreground">
                                            Both HR and Finance have verified this period. Salary can now be processed.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {canUpdate && !isPendingHr && (
                            <Card className="border-amber-300 dark:border-amber-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                        <RotateCcw className="size-4" />
                                        Undo verification
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Reopen this period to reset HR and Finance verification. Any draft or approved payroll runs
                                        for this period will be cancelled automatically.
                                        {payrollRunMeta.has_paid_run && (
                                            <span className="mt-2 block font-medium text-destructive">
                                                A paid payroll run exists — revert it to approved before reopening this period.
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Form action={reopenAction(period.id)} method="post">
                                            {({ processing }) => (
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    disabled={processing || payrollRunMeta.has_paid_run}
                                                    className="gap-1.5 text-destructive hover:text-destructive"
                                                >
                                                    <ShieldX className="size-4" />
                                                    {processing ? 'Reopening…' : 'Reopen period'}
                                                </Button>
                                            )}
                                        </Form>
                                        {canDelete && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        disabled={payrollRunMeta.has_paid_run}
                                                        className="gap-1.5 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Cancel period
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogTitle>Cancel pay period</DialogTitle>
                                                    <DialogDescription>
                                                        This deletes the period verification record. You can create a new one with the
                                                        same dates afterwards. Non-paid payroll runs will also be removed.
                                                    </DialogDescription>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button variant="outline">Keep period</Button>
                                                        </DialogClose>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={() => router.delete(destroyPeriodAction.url(period.id))}
                                                        >
                                                            Cancel period
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                    {payrollRunMeta.active_run_id && (
                                        <p className="text-xs text-muted-foreground">
                                            Active payroll run: #{payrollRunMeta.active_run_id} ({payrollRunMeta.active_run_status})
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Verification steps sidebar */}
                    <div className="space-y-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Verification progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <StatusStep
                                    step={1}
                                    label="HR verifies attendance"
                                    verifierName={period.hr_verifier_name}
                                    verifiedAt={period.hr_verified_at}
                                    notes={period.hr_notes}
                                    isCurrent={isPendingHr}
                                    isComplete={hrComplete}
                                />
                                <StatusStep
                                    step={2}
                                    label="Finance verifies overtime"
                                    verifierName={period.finance_verifier_name}
                                    verifiedAt={period.finance_verified_at}
                                    notes={period.finance_notes}
                                    isCurrent={isPendingFinance}
                                    isComplete={financeComplete}
                                />
                                <div className={`flex gap-4 rounded-lg border p-4 ${financeComplete ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30' : 'border-border bg-muted/20'}`}>
                                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${financeComplete ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        {financeComplete ? <CheckCircle2 className="size-4" /> : 3}
                                    </div>
                                    <div>
                                        <p className="font-medium">Process salary</p>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {financeComplete ? 'Period ready — salary can be processed.' : 'Unlocked after Finance verification.'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Period status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">From</dt>
                                        <dd className="font-medium">{formatDate(period.period_from)}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">To</dt>
                                        <dd className="font-medium">{formatDate(period.period_to)}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Status</dt>
                                        <dd>
                                            {period.status === 'verified' && (
                                                <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                    <CheckCircle2 className="size-3" />
                                                    Verified
                                                </Badge>
                                            )}
                                            {(period.status === 'pending_hr' || period.status === 'reopened') && (
                                                <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                    <Clock className="size-3" />
                                                    Pending HR
                                                </Badge>
                                            )}
                                            {period.status === 'pending_finance' && (
                                                <Badge variant="outline" className="gap-1 border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                    <Clock className="size-3" />
                                                    Pending Finance
                                                </Badge>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
