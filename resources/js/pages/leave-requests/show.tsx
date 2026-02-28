import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronLeft, PenLine, Printer } from 'lucide-react';
import { SignaturePad } from '@/components/signature-pad';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Employee = { id: number; first_name: string; last_name: string };
type Department = { id: number; name: string };
type LeaveRequest = {
    id: number;
    code: string;
    employee_id: number;
    department_id: number;
    absence_types: string[];
    absence_other: string | null;
    details: string | null;
    date: string | null;
    period_from: string | null;
    period_to: string | null;
    days: number | null;
    remarks: string | null;
    status: string;
    employee?: Employee;
    department?: Department;
    employee_signature_url?: string | null;
    approved_by_signature_url?: string | null;
};

export default function LeaveRequestsShow({
    leaveRequest,
    signaturesUrl,
}: {
    leaveRequest: LeaveRequest;
    signaturesUrl: string;
}) {
    const { flash } = usePage().props as { flash?: { success?: string } };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Leave Requests', href: '/leave-requests' },
                { title: leaveRequest.code ?? 'View', href: `/leave-requests/${leaveRequest.id}` },
            ]}
        >
            <Head title={`Leave request ${leaveRequest.code}`} />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/leave-requests">
                                <ChevronLeft className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-xl font-semibold">Leave request {leaveRequest.code}</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/leave-requests/${leaveRequest.id}/print`}>
                                <Printer className="mr-2 size-4" />
                                Print
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/leave-requests/${leaveRequest.id}/edit`}>
                                <PenLine className="mr-2 size-4" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                        {flash.success}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Request details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
                            <span className="text-muted-foreground">Employee</span>
                            <span>
                                {leaveRequest.employee
                                    ? `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`
                                    : '—'}
                            </span>
                            <span className="text-muted-foreground">Department</span>
                            <span>{leaveRequest.department?.name ?? '—'}</span>
                            <span className="text-muted-foreground">Absence type</span>
                            <span>{leaveRequest.absence_types?.[0] ?? '—'}</span>
                            <span className="text-muted-foreground">Period</span>
                            <span>
                                {leaveRequest.period_from && leaveRequest.period_to
                                    ? `${leaveRequest.period_from} – ${leaveRequest.period_to}`
                                    : '—'}
                            </span>
                            <span className="text-muted-foreground">Days</span>
                            <span>{leaveRequest.days ?? '—'}</span>
                            <span className="text-muted-foreground">Status</span>
                            <span className="capitalize">{leaveRequest.status}</span>
                            {leaveRequest.remarks ? (
                                <>
                                    <span className="text-muted-foreground">Remarks</span>
                                    <span>{leaveRequest.remarks}</span>
                                </>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Signatures (sign in web portal)</CardTitle>
                        <p className="text-muted-foreground text-sm">
                            Draw your signature below or replace an existing one. Click Save signature to store it.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <SignaturePad
                            label="Employee signature"
                            signatureUrl={leaveRequest.employee_signature_url ?? null}
                            submitUrl={signaturesUrl}
                            fieldName="employee_signature"
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
