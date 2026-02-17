import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/leave-requests';
import type { BreadcrumbItem } from '@/types';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
};

type Department = {
    id: number;
    name: string;
};

type LeaveRequest = {
    id: number;
    code: string;
    employee_id: number;
    department_id: number;
    absence_types: string[];
    absence_other: string | null;
    details: string | null;
    remarks: string | null;
    date: string | null;
    period_from: string | null;
    period_to: string | null;
    days: number | null;
    employee?: Employee;
    department?: Department;
};

export default function Show({
    leaveRequest,
}: {
    leaveRequest: LeaveRequest;
}) {
    const requestLabel = leaveRequest.code || `Request #${leaveRequest.id}`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leave Requests', href: index().url },
        { title: requestLabel, href: '#' },
    ];

    const absenceDescription =
        leaveRequest.absence_types.join(', ') +
        (leaveRequest.absence_other
            ? ` (${leaveRequest.absence_other})`
            : '');

    const formatDate = (d: string | null) =>
        d
            ? new Date(d).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
              })
            : '—';

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('print') === '1') {
            window.print();
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={requestLabel} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 print:bg-white">
                <div className="flex items-center justify-between gap-2 print:hidden">
                    <Link
                        href={index()}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Leave Requests
                    </Link>
                    <Button onClick={handlePrint}>
                        <Printer className="size-4" />
                        Print
                    </Button>
                </div>

                <div className="mt-2 rounded-xl border bg-background p-6 shadow-sm print:shadow-none print:border-0">
                    <Heading
                        title="Leave Request Form"
                        description={requestLabel}
                    />

                    <div className="mt-6 grid gap-4 text-sm print:text-black">
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            <div>
                                <div className="font-semibold">
                                    Full Name
                                </div>
                                <div>
                                    {leaveRequest.employee
                                        ? `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`
                                        : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold">
                                    Department
                                </div>
                                <div>
                                    {leaveRequest.department?.name ?? '—'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold">
                                Type of Absence Requested
                            </div>
                            <div>{absenceDescription || '—'}</div>
                        </div>
                        {leaveRequest.details && (
                            <div>
                                <div className="font-semibold">
                                    Details
                                </div>
                                <div>{leaveRequest.details}</div>
                            </div>
                        )}
                        {leaveRequest.remarks && (
                            <div>
                                <div className="font-semibold">
                                    Reason / Remarks
                                </div>
                                <div className="whitespace-pre-wrap">
                                    {leaveRequest.remarks}
                                </div>
                            </div>
                        )}
                        <div>
                            <div className="font-semibold">Date</div>
                            <div>{formatDate(leaveRequest.date)}</div>
                        </div>
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            <div>
                                <div className="font-semibold">
                                    Period of absence (From)
                                </div>
                                <div>
                                    {formatDate(leaveRequest.period_from)}
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold">
                                    Period of absence (To)
                                </div>
                                <div>
                                    {formatDate(leaveRequest.period_to)}
                                </div>
                            </div>
                        </div>
                        {leaveRequest.days != null && (
                            <div>
                                <div className="font-semibold">
                                    Days requested
                                </div>
                                <div>
                                    {leaveRequest.days} day
                                    {leaveRequest.days !== 1 ? 's' : ''}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 text-xs text-muted-foreground print:text-black">
                        <p>
                            This document was generated by the HRIS Leave
                            Request module.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

