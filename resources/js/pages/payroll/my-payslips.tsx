import { Head } from '@inertiajs/react';
import { CircleDollarSign, Download } from 'lucide-react';
import { myPayslips as myPayslipsUrl } from '@/actions/App/Http/Controllers/Payroll/PayslipController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll', href: myPayslipsUrl().url },
    { title: 'My payslips', href: myPayslipsUrl().url },
];

type Payslip = {
    id: number;
    run_id: number;
    period_from: string | null;
    period_to: string | null;
    currency: string;
    gross_salary: number;
    total_deductions: number;
    net_salary: number;
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

function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency }).format(amount);
}

export default function MyPayslips({ payslips }: { payslips: Payslip[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My payslips" />

            <div className="space-y-6 p-6">
                <Heading
                    title="My payslips"
                    description="Download your payslips for each paid pay period."
                />

                {payslips.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <CircleDollarSign className="size-10 text-muted-foreground/40" />
                            <div>
                                <p className="font-medium">No payslips yet</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Your payslips will appear here once a payroll run is marked as paid.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pay period</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Deductions</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net pay</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paid on</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payslips.map((p) => (
                                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            {p.period_from && p.period_to
                                                ? `${formatDate(p.period_from)} — ${formatDate(p.period_to)}`
                                                : `Period #${p.run_id}`}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {formatCurrency(p.gross_salary, p.currency)}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-destructive">
                                            -{formatCurrency(p.total_deductions, p.currency)}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                                            {formatCurrency(p.net_salary, p.currency)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(p.paid_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <a href={`/payroll/runs/${p.run_id}/payslips/${p.id}`} target="_blank" rel="noreferrer">
                                                <Button variant="ghost" size="sm" className="gap-1.5">
                                                    <Download className="size-3.5" />
                                                    Download PDF
                                                </Button>
                                            </a>
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
