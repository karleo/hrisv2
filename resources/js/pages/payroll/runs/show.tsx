import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft, CircleDollarSign, Clock, Download } from 'lucide-react';
import {
    approve as approveAction,
    index as runsIndex,
    markPaid as markPaidAction,
} from '@/actions/App/Http/Controllers/Payroll/PayrollRunController';
import {
    downloadRegister as downloadRegisterAction,
    downloadRegisterCsv as downloadRegisterCsvAction,
    downloadPayslip as downloadPayslipAction,
} from '@/actions/App/Http/Controllers/Payroll/PayslipController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ModulePermissionsMap } from '@/types/permissions';

type RunEmployee = {
    id: number;
    employee_id: number;
    employee_name: string;
    basic_salary: number;
    housing_allowance: number;
    transport_allowance: number;
    food_allowance: number;
    other_allowance: number;
    overtime_minutes: number;
    overtime_amount: number;
    loan_deduction: number;
    other_deduction: number;
    gross_salary: number;
    total_deductions: number;
    net_salary: number;
};

type PayrollRun = {
    id: number;
    status: string;
    currency: string;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    notes: string | null;
    period_from: string | null;
    period_to: string | null;
    approved_by_name: string | null;
    approved_at: string | null;
    paid_at: string | null;
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
                    Under review
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

export default function PayrollRunShow({
    run,
    employees,
}: {
    run: PayrollRun;
    employees: RunEmployee[];
}) {
    const { flash, modulePermissions } = usePage().props as {
        flash?: { success?: string; error?: string };
        modulePermissions?: ModulePermissionsMap;
    };

    const canUpdate = modulePermissions?.payroll?.can_update ?? false;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payroll', href: runsIndex().url },
        { title: 'Payroll runs', href: runsIndex().url },
        {
            title: run.period_from ? `${formatDate(run.period_from)} — ${formatDate(run.period_to)}` : `Run #${run.id}`,
            href: '#',
        },
    ];

    const canApprove = canUpdate && (run.status === 'draft' || run.status === 'review');
    const canMarkPaid = canUpdate && run.status === 'approved';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll run — ${run.period_from ?? `#${run.id}`}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-start gap-4">
                    <Link href={runsIndex().url}>
                        <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
                            <ChevronLeft className="size-4" />
                            All runs
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <Heading
                            title={
                                run.period_from
                                    ? `Payroll: ${formatDate(run.period_from)} — ${formatDate(run.period_to)}`
                                    : `Payroll run #${run.id}`
                            }
                            description="Review individual employee calculations before approving."
                        />
                    </div>
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
                    {/* Employee table */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Summary cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total gross</p>
                                    <p className="mt-1 text-xl font-bold tabular-nums">
                                        {formatCurrency(run.total_gross, run.currency)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Deductions</p>
                                    <p className="mt-1 text-xl font-bold tabular-nums text-destructive">
                                        -{formatCurrency(run.total_deductions, run.currency)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Net payroll</p>
                                    <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(run.total_net, run.currency)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Employee breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee breakdown ({employees.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {employees.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                                        <CircleDollarSign className="size-8 opacity-40" />
                                        <p className="text-sm">No employees with compensation records were found for this run.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Basic</th>
                                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Allowances</th>
                                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Overtime</th>
                                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross</th>
                                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Deductions</th>
                                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net</th>
                                                    {run.status === 'paid' && <th className="px-4 py-3"></th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {employees.map((emp) => {
                                                    const totalAllowances =
                                                        emp.housing_allowance +
                                                        emp.transport_allowance +
                                                        emp.food_allowance +
                                                        emp.other_allowance;
                                                    return (
                                                        <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                                                            <td className="px-4 py-3 font-medium">{emp.employee_name}</td>
                                                            <td className="px-4 py-3 text-right tabular-nums">
                                                                {formatCurrency(emp.basic_salary, run.currency)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right tabular-nums">
                                                                {formatCurrency(totalAllowances, run.currency)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right tabular-nums">
                                                                {emp.overtime_minutes > 0 ? (
                                                                    <span title={formatMinutes(emp.overtime_minutes)}>
                                                                        {formatCurrency(emp.overtime_amount, run.currency)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right tabular-nums font-medium">
                                                                {formatCurrency(emp.gross_salary, run.currency)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right tabular-nums text-destructive">
                                                                -{formatCurrency(emp.total_deductions, run.currency)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                                                                {formatCurrency(emp.net_salary, run.currency)}
                                                            </td>
                                                            {run.status === 'paid' && (
                                                                <td className="px-4 py-3">
                                                                    <a href={downloadPayslipAction({ run: run.id, runEmployee: emp.id }).url} target="_blank" rel="noreferrer">
                                                                        <Button variant="ghost" size="sm" className="gap-1">
                                                                            <Download className="size-3" />
                                                                        </Button>
                                                                    </a>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Action buttons */}
                        {canApprove && (
                            <Card className="border-blue-300 dark:border-blue-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                        <CheckCircle2 className="size-4" />
                                        Approve payroll run
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Review all employee figures above. Approving locks the calculations and allows marking the run as paid.
                                    </p>
                                    <Form action={approveAction(run.id)} method="post">
                                        {({ processing }) => (
                                            <Button type="submit" disabled={processing} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                                                <CheckCircle2 className="size-4" />
                                                {processing ? 'Approving…' : 'Approve run'}
                                            </Button>
                                        )}
                                    </Form>
                                </CardContent>
                            </Card>
                        )}

                        {canMarkPaid && (
                            <Card className="border-emerald-300 dark:border-emerald-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                                        <CircleDollarSign className="size-4" />
                                        Mark as paid
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Once salaries have been disbursed, mark this run as paid. Payslips will become visible to employees.
                                    </p>
                                    <Form action={markPaidAction(run.id)} method="post">
                                        {({ processing }) => (
                                            <Button type="submit" disabled={processing} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                                                <CheckCircle2 className="size-4" />
                                                {processing ? 'Marking paid…' : 'Mark as paid'}
                                            </Button>
                                        )}
                                    </Form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Run status sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Run details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="space-y-3 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Status</dt>
                                        <dd><StatusBadge status={run.status} /></dd>
                                    </div>
                                    {run.period_from && (
                                        <>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">Period from</dt>
                                                <dd className="font-medium">{formatDate(run.period_from)}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">Period to</dt>
                                                <dd className="font-medium">{formatDate(run.period_to)}</dd>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Currency</dt>
                                        <dd className="font-medium">{run.currency}</dd>
                                    </div>
                                    {run.approved_at && (
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-muted-foreground">Approved</dt>
                                            <dd className="text-right">
                                                <span className="font-medium">{formatDate(run.approved_at)}</span>
                                                {run.approved_by_name && (
                                                    <span className="block text-xs text-muted-foreground">by {run.approved_by_name}</span>
                                                )}
                                            </dd>
                                        </div>
                                    )}
                                    {run.paid_at && (
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-muted-foreground">Paid</dt>
                                            <dd className="font-medium">{formatDate(run.paid_at)}</dd>
                                        </div>
                                    )}
                                </dl>
                            </CardContent>
                        </Card>

                        {run.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{run.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {(run.status === 'approved' || run.status === 'paid') && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Export register
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex gap-2 flex-wrap">
                                    <a href={downloadRegisterAction(run.id).url} target="_blank" rel="noreferrer">
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            <Download className="size-3.5" />
                                            PDF register
                                        </Button>
                                    </a>
                                    <a href={downloadRegisterCsvAction(run.id).url}>
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            <Download className="size-3.5" />
                                            CSV register
                                        </Button>
                                    </a>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Workflow
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {(['draft', 'review', 'approved', 'paid'] as const).map((step, i) => {
                                        const statusOrder = { draft: 0, review: 1, approved: 2, paid: 3 };
                                        const currentOrder = statusOrder[run.status as keyof typeof statusOrder] ?? -1;
                                        const stepOrder = statusOrder[step];
                                        const isComplete = stepOrder < currentOrder;
                                        const isCurrent = step === run.status;
                                        return (
                                            <div
                                                key={step}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isCurrent ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : isComplete ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}
                                            >
                                                <div className={`size-5 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${isComplete ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : isCurrent ? 'bg-blue-600 text-white' : 'bg-muted'}`}>
                                                    {isComplete ? <CheckCircle2 className="size-3" /> : i + 1}
                                                </div>
                                                <span className="capitalize font-medium">{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
