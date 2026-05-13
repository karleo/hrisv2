import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Ban, ChevronLeft, PenLine, Printer, Send } from 'lucide-react';
import { useState } from 'react';
import { ActivityLogTimeline, type ActivityLogTimelineEntry } from '@/components/activity-log-timeline';
import {
    approveRequiresManagerSignatureMessage,
    rejectRequiresRemarksMessage,
    RequestDecisionClientMessage,
    visibleRequestDecisionMessage,
} from '@/components/request-decision-client-message';
import RequestEmailLogList, { type RequestEmailLogEntry } from '@/components/request-email-log-list';
import {
    RequestEmployeeSignatureCard,
    leaveRequestShowSignatureVisitOnly,
} from '@/components/request-employee-signature-card';
import { RequestStatusBadge, normalizeRequestStatus } from '@/components/request-status-badge';
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
import { useRequestStatusPoll } from '@/hooks/use-request-status-poll';
import AppLayout from '@/layouts/app-layout';
import { employeeFullName } from '@/lib/format-employee-name';
import { useI18n } from '@/lib/i18n';

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
    start_day_type?: 'full' | 'half' | null;
    period_to: string | null;
    end_day_type?: 'full' | 'half' | null;
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

function dayTypeLabel(value?: string | null): string {
    return value === 'half' ? 'Half Day' : 'Full Day';
}

function formatDateDdMmYyyy(ymd: string | null): string {
    if (!ymd) {
        return '';
    }

    const [y, m, d] = ymd.split('-');
    if (!y || !m || !d) {
        return '';
    }

    return `${d}/${m}/${y}`;
}

export default function LeaveRequestsShow({
    leaveRequest,
    signaturesUrl,
    submitUrl,
    cancelUrl,
    decisionUrl,
    canDecide,
    canCancel = false,
    canEdit = false,
    canViewActivityLogs = false,
    activityLogs,
    emailLogs,
}: {
    leaveRequest: LeaveRequest;
    signaturesUrl: string;
    submitUrl: string;
    cancelUrl: string;
    decisionUrl: string;
    canDecide: boolean;
    canCancel?: boolean;
    canEdit?: boolean;
    canViewActivityLogs?: boolean;
    activityLogs: ActivityLogTimelineEntry[];
    emailLogs: RequestEmailLogEntry[];
}) {
    const { t } = useI18n();
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
                    <div className="flex flex-wrap items-center justify-end gap-2 [&_[data-slot=button]]:h-8">
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
                        {!isDraft ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/leave-requests/${leaveRequest.id}/print`}>
                                    <Printer className="mr-2 size-4" />
                                    Print
                                </Link>
                            </Button>
                        ) : null}
                        {isDraft ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/leave-requests/${leaveRequest.id}/edit`}>
                                    <PenLine className="mr-2 size-4" />
                                    Edit
                                </Link>
                            </Button>
                        ) : canEdit ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/leave-requests/${leaveRequest.id}/edit`}>
                                    <PenLine className="mr-2 size-4" />
                                    Edit
                                </Link>
                            </Button>
                        ) : null}
                        {canCancel ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="h-8"
                                    >
                                        <Ban className="mr-2 size-4" />
                                        Cancel
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>Cancel leave request?</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to cancel this leave request? This record will stay in the system.
                                    </DialogDescription>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary">
                                                Keep request
                                            </Button>
                                        </DialogClose>
                                        <Form
                                            action={cancelUrl}
                                            method="delete"
                                            options={{ preserveScroll: true }}
                                            className="contents"
                                        >
                                            {({ processing }) => (
                                                <Button type="submit" variant="destructive" disabled={processing}>
                                                    Cancel request
                                                </Button>
                                            )}
                                        </Form>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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
                                    ? `${formatDateDdMmYyyy(leaveRequest.period_from)} – ${formatDateDdMmYyyy(leaveRequest.period_to)}`
                                    : '—'}
                            </span>
                            <span className="text-muted-foreground">Boundary day types</span>
                            <span>
                                Start: {dayTypeLabel(leaveRequest.start_day_type)} | End:{' '}
                                {dayTypeLabel(leaveRequest.end_day_type)}
                            </span>
                            <span className="text-muted-foreground">Days</span>
                            <span>
                                {leaveRequest.days === null || leaveRequest.days === undefined
                                    ? '—'
                                    : `${leaveRequest.days.toFixed(1)} day(s)`}
                            </span>
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
                <RequestEmailLogList entries={emailLogs} />

                {canViewActivityLogs ? (
                    <ActivityLogTimeline
                        entries={activityLogs}
                        title={t('activity.title', 'Activity Log')}
                        description={t('activity.description.leave', 'Track leave request updates by authorized users.')}
                    />
                ) : null}
                </div>
            </div>
        </AppLayout>
    );
}
