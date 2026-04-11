import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ChevronLeft, PenLine, Printer, Send } from 'lucide-react';
import { useState } from 'react';
import {
    approveRequiresManagerSignatureMessage,
    rejectRequiresRemarksMessage,
    RequestDecisionClientMessage,
    visibleRequestDecisionMessage,
} from '@/components/request-decision-client-message';
import {
    RequestEmployeeSignatureCard,
    leaveRequestShowSignatureVisitOnly,
} from '@/components/request-employee-signature-card';
import { RequestStatusBadge, normalizeRequestStatus } from '@/components/request-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequestStatusPoll } from '@/hooks/use-request-status-poll';
import AppLayout from '@/layouts/app-layout';
import { employeeFullName } from '@/lib/format-employee-name';

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
    approved_by_employee?: Employee | null;
    employee_signature_url?: string | null;
    approved_by_signature_url?: string | null;
    decision_remarks?: string | null;
    decided_at?: string | null;
};

export default function LeaveRequestsShow({
    leaveRequest,
    signaturesUrl,
    submitUrl,
    decisionUrl,
    canDecide,
}: {
    leaveRequest: LeaveRequest;
    signaturesUrl: string;
    submitUrl: string;
    decisionUrl: string;
    canDecide: boolean;
}) {
    useRequestStatusPoll(['leaveRequest', 'canDecide']);

    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const normalizedStatus = normalizeRequestStatus(leaveRequest.status);
    const isDraft = normalizedStatus === 'draft';
    const [decisionClientMessage, setDecisionClientMessage] = useState<string | null>(null);
    const visibleDecisionMessage = visibleRequestDecisionMessage(decisionClientMessage, {
        hasManagerSignature: Boolean(leaveRequest.approved_by_signature_url),
    });

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Leave Requests', href: '/leave-requests' },
                { title: leaveRequest.code ?? 'View', href: `/leave-requests/${leaveRequest.id}` },
            ]}
        >
            <Head title={`Leave request ${leaveRequest.code}`} />
            <div className="px-4 py-8 md:px-8">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/leave-requests">
                                <ChevronLeft className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-xl font-semibold">Leave request {leaveRequest.code}</h1>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {isDraft ? (
                            <Form
                                action={submitUrl}
                                method="post"
                                options={{ preserveScroll: true }}
                                className="contents"
                            >
                                {({ processing }) => (
                                    <Button type="submit" size="sm" disabled={processing}>
                                        <Send className="mr-2 size-4" />
                                        Submit request
                                    </Button>
                                )}
                            </Form>
                        ) : null}
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/leave-requests/${leaveRequest.id}/print`}>
                                <Printer className="mr-2 size-4" />
                                Print
                            </Link>
                        </Button>
                        {isDraft ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/leave-requests/${leaveRequest.id}/edit`}>
                                    <PenLine className="mr-2 size-4" />
                                    Edit
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </div>

                <Card className="border-muted/60 bg-muted/20">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                        <div>
                            <p className="text-muted-foreground text-xs">Leave Request</p>
                            <p className="text-lg font-semibold">{leaveRequest.code}</p>
                        </div>
                        <RequestStatusBadge status={leaveRequest.status} />
                    </CardContent>
                </Card>

                {flash?.success && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        {flash.error}
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
                            <span>
                                <RequestStatusBadge
                                    status={leaveRequest.status}
                                    className="px-2.5 py-0.5"
                                />
                            </span>
                            {leaveRequest.remarks ? (
                                <>
                                    <span className="text-muted-foreground">Remarks</span>
                                    <span>{leaveRequest.remarks}</span>
                                </>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <RequestEmployeeSignatureCard
                    signatureUrl={leaveRequest.employee_signature_url ?? null}
                    signaturesUrl={signaturesUrl}
                    visitOnly={leaveRequestShowSignatureVisitOnly}
                    allowEmployeeSignatureEdit={normalizedStatus === 'draft'}
                    additionalSignatures={[
                        {
                            label: 'Manager / HR signature',
                            signatureUrl: leaveRequest.approved_by_signature_url ?? null,
                            fieldName: 'approved_by_signature',
                            editable: normalizedStatus === 'submitted' && canDecide,
                            emptyReadonlyMessage: canDecide
                                ? undefined
                                : normalizedStatus === 'draft'
                                  ? 'Available after the request is submitted.'
                                  : 'Awaiting manager or HR signature.',
                            signerName: employeeFullName(leaveRequest.approved_by_employee),
                        },
                    ]}
                    managerDecisionSlot={
                        canDecide && normalizedStatus === 'submitted' ? (
                            <Form action={decisionUrl} method="post" options={{ preserveScroll: true }}>
                                {({ processing }) => (
                                    <div className="space-y-2">
                                        <textarea
                                            name="remarks"
                                            rows={3}
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            placeholder="Add reason when rejecting"
                                            onChange={() => setDecisionClientMessage(null)}
                                        />
                                        <RequestDecisionClientMessage message={visibleDecisionMessage} />
                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                name="decision"
                                                value="approved"
                                                disabled={processing}
                                                onClick={(e) => {
                                                    if (!leaveRequest.approved_by_signature_url) {
                                                        e.preventDefault();
                                                        setDecisionClientMessage(approveRequiresManagerSignatureMessage);
                                                    }
                                                }}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                type="submit"
                                                name="decision"
                                                value="rejected"
                                                variant="destructive"
                                                disabled={processing}
                                                onClick={(e) => {
                                                    const form = e.currentTarget.form;
                                                    const remarks = form?.querySelector<HTMLTextAreaElement>('textarea[name="remarks"]')?.value?.trim() ?? '';
                                                    if (remarks === '') {
                                                        e.preventDefault();
                                                        setDecisionClientMessage(rejectRequiresRemarksMessage);
                                                    }
                                                }}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Form>
                        ) : null
                    }
                    employeeName={employeeFullName(leaveRequest.employee)}
                />
                </div>
            </div>
        </AppLayout>
    );
}
