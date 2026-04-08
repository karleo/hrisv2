import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer, Send } from 'lucide-react';
import Heading from '@/components/heading';
import { RequestStatusBadge, normalizeRequestStatus } from '@/components/request-status-badge';
import {
    RequestEmployeeSignatureCard,
    itRequestShowSignatureVisitOnly,
} from '@/components/request-employee-signature-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/it-requests';
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

type Software = {
    id: number;
    code: string;
    name: string;
};

type Hardware = {
    id: number;
    code: string;
    name: string;
};

type ItRequest = {
    id: number;
    employee_id: number;
    department_id: number;
    status: string;
    date: string | null;
    employee?: Employee;
    department?: Department;
    software?: Software | null;
    hardware?: Hardware | null;
    employee_signature_url?: string | null;
    approved_by_signature_url?: string | null;
    decision_remarks?: string | null;
    decided_at?: string | null;
};

export default function Show({
    itRequest,
    signaturesUrl,
    submitUrl,
    decisionUrl,
    canDecide,
}: {
    itRequest: ItRequest;
    signaturesUrl: string;
    submitUrl: string;
    decisionUrl: string;
    canDecide: boolean;
}) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const isDraft = normalizeRequestStatus(itRequest.status) === 'draft';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'IT Requests', href: index().url },
        { title: `Request #${itRequest.id}`, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`IT Request #${itRequest.id}`} />

            <div className="px-4 py-8 md:px-8 print:bg-white">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                    <Link
                        href={index()}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to IT Requests
                    </Link>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {isDraft ? (
                            <Form
                                action={submitUrl}
                                method="post"
                                options={{ preserveScroll: true }}
                                className="contents"
                            >
                                {({ processing }) => (
                                    <Button type="submit" disabled={processing}>
                                        <Send className="mr-2 size-4" />
                                        Submit request
                                    </Button>
                                )}
                            </Form>
                        ) : null}
                        <Button asChild>
                            <Link href={`/it-requests/${itRequest.id}/print`}>
                                <Printer className="size-4" />
                                Print
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card className="border-muted/60 bg-muted/20 print:hidden">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                        <div>
                            <p className="text-muted-foreground text-xs">IT Request</p>
                            <p className="text-lg font-semibold">Request #{itRequest.id}</p>
                        </div>
                        <RequestStatusBadge status={itRequest.status} />
                    </CardContent>
                </Card>

                <div className="rounded-xl border bg-background p-6 shadow-sm print:border-0 print:shadow-none">
                    <Heading
                        title="IT Request Form"
                        description={`Request #${itRequest.id}`}
                    />

                    <div className="mt-6 grid gap-4 text-sm print:text-black">
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            <div>
                                <div className="font-semibold">Name</div>
                                <div>
                                    {itRequest.employee
                                        ? `${itRequest.employee.first_name} ${itRequest.employee.last_name}`
                                        : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold">
                                    Department
                                </div>
                                <div>
                                    {itRequest.department?.name ?? '—'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold">Date</div>
                            <div>{itRequest.date ?? '—'}</div>
                        </div>

                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            <div>
                                <div className="font-semibold">
                                    Software Required
                                </div>
                                <div>
                                    {itRequest.software
                                        ? `${itRequest.software.code} - ${itRequest.software.name}`
                                        : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold">
                                    Hardware Request
                                </div>
                                <div>
                                    {itRequest.hardware
                                        ? `${itRequest.hardware.code} - ${itRequest.hardware.name}`
                                        : '—'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold">Status</div>
                            <div className="mt-1">
                                <RequestStatusBadge
                                    status={itRequest.status}
                                    className="px-2.5 py-0.5"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-xs text-muted-foreground print:text-black">
                        <p>
                            This document was generated by the HRIS IT Request
                            module.
                        </p>
                    </div>
                </div>

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

                <RequestEmployeeSignatureCard
                    signatureUrl={itRequest.employee_signature_url ?? null}
                    signaturesUrl={signaturesUrl}
                    visitOnly={itRequestShowSignatureVisitOnly}
                    allowEmployeeSignatureEdit={normalizeRequestStatus(itRequest.status) === 'draft'}
                    additionalSignatures={[
                        {
                            label: 'Manager / HR signature',
                            signatureUrl: itRequest.approved_by_signature_url ?? null,
                            fieldName: 'approved_by_signature',
                            editable: normalizeRequestStatus(itRequest.status) === 'submitted',
                        },
                    ]}
                    managerDecisionSlot={
                        canDecide && normalizeRequestStatus(itRequest.status) === 'submitted' ? (
                            <Form action={decisionUrl} method="post" options={{ preserveScroll: true }}>
                                {({ processing }) => (
                                    <div className="space-y-2">
                                        <textarea
                                            name="remarks"
                                            rows={3}
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            placeholder="Add reason when rejecting"
                                        />
                                        <div className="flex gap-2">
                                            <Button type="submit" name="decision" value="approved" disabled={processing}>
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
                                                        window.alert('Please fill reason before rejecting.');
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
                    employeeName={
                        itRequest.employee
                            ? `${itRequest.employee.first_name} ${itRequest.employee.last_name}`
                            : undefined
                    }
                />
                </div>
            </div>
        </AppLayout>
    );
}

