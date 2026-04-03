import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer, Send } from 'lucide-react';
import {
    ItAssetRequestSignaturesCard,
    itAssetRequestShowSignatureVisitOnly,
} from '@/components/it-asset-request-signatures-card';
import { RequestStatusBadge, normalizeRequestStatus } from '@/components/request-status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
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

type Hardware = {
    id: number;
    code: string;
    name: string;
};

type ItAssetRequest = {
    id: number;
    code: string;
    date: string;
    date_issued: string | null;
    status: string;
    hardware_ids: number[] | null;
    hardware?: Hardware[];
    asset_type: string | null;
    serial_number: string | null;
    remarks: string | null;
    employee_signature_url?: string | null;
    issued_by_signature_url?: string | null;
    issued_by_employee_id?: number | null;
    employee?: Employee;
    department?: Department;
    issued_by_employee?: Employee;
};

function formatDateDdMmYyyy(value: string | null | undefined): string {
    if (value == null || value === '') return '—';
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [, yyyy, mm, dd] = match;
        return `${dd}/${mm}/${yyyy}`;
    }
    return value;
}

export default function Show({
    itAssetRequest,
    hardware = [],
    employees = [],
    submitUrl,
    signaturesUrl,
}: {
    itAssetRequest: ItAssetRequest;
    hardware?: Hardware[];
    employees?: Employee[];
    submitUrl: string;
    signaturesUrl: string;
}) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const requestLabel = itAssetRequest.code || `Request #${itAssetRequest.id}`;
    const isDraft = normalizeRequestStatus(itAssetRequest.status) === 'draft';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'IT Asset Requests', href: '/it-asset-requests' },
        { title: requestLabel, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`IT Asset Request #${itAssetRequest.id}`} />

            <div className="flex min-h-screen flex-1 flex-col bg-muted/30">
                <div className="border-b bg-card px-4 py-6 md:px-8 print:hidden">
                    <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-4">
                        <div className="space-y-2">
                            <Link
                                href="/it-asset-requests"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="size-4" />
                                Back to IT Asset Requests
                            </Link>
                            <h1 className="text-2xl font-bold tracking-tight">{requestLabel}</h1>
                            <p className="text-sm text-muted-foreground">IT Asset Request Form</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <RequestStatusBadge status={itAssetRequest.status} />
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
                            <Link href={`/it-asset-requests/${itAssetRequest.id}/print`}>
                                <Button type="button">
                                    <Printer className="size-4" />
                                    Print
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {(flash?.success || flash?.error) && (
                    <div className="border-b bg-card px-4 py-3 md:px-8 print:hidden">
                        <div className="mx-auto max-w-7xl space-y-2">
                            {flash?.success ? (
                                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                                    {flash.success}
                                </div>
                            ) : null}
                            {flash?.error ? (
                                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                                    {flash.error}
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

                <div className="px-4 py-8 md:px-8 print:p-4">
                    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                        <div className="rounded-xl border bg-background p-6 shadow-sm print:border-0 print:shadow-none">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">Request Code</div>
                            <div className="font-semibold">{itAssetRequest.code || '—'}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">Date</div>
                            <div className="font-semibold">{formatDateDdMmYyyy(itAssetRequest.date)}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">Date Issued</div>
                            <div className="font-semibold">{formatDateDdMmYyyy(itAssetRequest.date_issued)}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">Status</div>
                            <div className="mt-1.5">
                                <RequestStatusBadge
                                    status={itAssetRequest.status}
                                    className="px-2.5 py-0.5"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground">Employee</div>
                            <div className="font-semibold">
                                {itAssetRequest.employee
                                    ? `${itAssetRequest.employee.first_name} ${itAssetRequest.employee.last_name}`
                                    : '—'}
                            </div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground">Department</div>
                            <div className="font-semibold">{itAssetRequest.department?.name ?? '—'}</div>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground">Hardware</div>
                            <div className="mt-1">
                                {hardware.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {hardware.map((hw) => (
                                            <li key={hw.id}>
                                                {hw.code} - {hw.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                )}
                            </div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground">Serial number</div>
                            <div className="font-semibold">{itAssetRequest.serial_number ?? '—'}</div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-lg border p-4">
                        <div className="text-xs text-muted-foreground">Remarks</div>
                        <div className="mt-1 min-h-[80px] whitespace-pre-wrap text-sm">
                            {itAssetRequest.remarks ?? '—'}
                        </div>
                        <div className="mt-4 hidden text-sm leading-relaxed print:block print:text-black">
                                <p>
                                    I hereby acknowledge that I have received the above-mentioned
                                    assets. I understand that these assets are the property of
                                    PRIME LOGISTICS FZCO and are entrusted to me solely for the
                                    purpose of carrying out my official duties.
                                </p>
                                <p className="mt-3">
                                    I undertake to take proper care of the company’s assets and to
                                    use them strictly for business purposes. I further agree not to
                                    share these assets, related information, or any security
                                    codes/passwords with any unauthorized person.
                                </p>
                                <p className="mt-3">
                                    In the event of loss, theft, or damage due to negligence during
                                    my employment, I understand and agree that I will be
                                    responsible for the applicable replacement or repair costs. I
                                    also agree to return all assets issued to me in good condition
                                    upon my last working day with PRIME LOGISTICS FZCO.
                                </p>
                        </div>
                            </div>
                        </div>

                        <ItAssetRequestSignaturesCard
                            itAssetRequest={itAssetRequest}
                            employees={employees}
                            signaturesUrl={signaturesUrl}
                            visitOnly={itAssetRequestShowSignatureVisitOnly}
                        />
                        <div className="hidden rounded-xl border bg-background p-6 shadow-sm print:block print:border-0 print:p-0 print:shadow-none">
                            <div className="print:grid print:grid-cols-2 print:gap-12">
                                <div>
                                    <div className="mb-2 font-semibold">
                                        Employee Signature
                                    </div>
                                    {itAssetRequest.employee_signature_url ? (
                                        <div className="mb-4">
                                            <img
                                                src={itAssetRequest.employee_signature_url}
                                                alt="Employee signature"
                                                className="max-h-20 w-full border border-gray-300 bg-white object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="mb-4 min-h-[80px] border-2 border-dashed border-gray-300" />
                                    )}
                                    <div className="text-xs">
                                        {itAssetRequest.employee
                                            ? `${itAssetRequest.employee.first_name} ${itAssetRequest.employee.last_name}`
                                            : 'Employee Name'}
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 font-semibold">
                                        Issued By Signature
                                    </div>
                                    {itAssetRequest.issued_by_signature_url ? (
                                        <div className="mb-4">
                                            <img
                                                src={itAssetRequest.issued_by_signature_url}
                                                alt="Issued by signature"
                                                className="max-h-20 w-full border border-gray-300 bg-white object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="mb-4 min-h-[80px] border-2 border-dashed border-gray-300" />
                                    )}
                                    <div className="text-xs">
                                        {itAssetRequest.issued_by_employee
                                            ? `${itAssetRequest.issued_by_employee.first_name} ${itAssetRequest.issued_by_employee.last_name}`
                                            : 'Issued By'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

