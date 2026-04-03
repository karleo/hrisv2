import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';

type Employee = { id: number; first_name: string; last_name: string };
type Department = { id: number; name: string };
type Software = { id: number; code: string; name: string };
type Hardware = { id: number; code: string; name: string };

type ItRequest = {
    id: number;
    code?: string | null;
    date: string | null;
    status: string;
    employee?: Employee;
    department?: Department;
    software?: Software | null;
    hardware?: Hardware | null;
    employee_signature_url?: string | null;
    approved_by_signature_url?: string | null;
};

function formatUsDate(ymd: string | null): string {
    if (!ymd) {
        return '';
    }
    const [y, m, d] = ymd.split('-');
    if (!y || !m || !d) {
        return '';
    }
    return `${m}/${d}/${y}`;
}

function fullName(emp?: Employee | null): string {
    if (!emp) {
        return '';
    }
    return `${emp.first_name} ${emp.last_name}`.trim();
}

function CheckRow({ label, checked }: { label: string; checked: boolean }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="flex h-4 w-4 items-center justify-center border border-neutral-700 text-[10px]">
                {checked ? 'X' : ''}
            </span>
            <span>{label}</span>
        </div>
    );
}

export default function ItRequestPrint({
    itRequest,
    companyLogoUrl,
}: {
    itRequest: ItRequest;
    companyLogoUrl: string | null;
}) {
    const handlePrint = () => window.print();

    const softwareLabel = itRequest.software
        ? `${itRequest.software.code} - ${itRequest.software.name}`
        : '';
    const hardwareLabel = itRequest.hardware
        ? `${itRequest.hardware.code} - ${itRequest.hardware.name}`
        : '';
    const isSubmitted = itRequest.status === 'submitted';
    const isDraft = itRequest.status === 'draft';
    const isApproved = Boolean(itRequest.approved_by_signature_url);

    return (
        <>
            <Head title={`IT Request #${itRequest.id} - Print`} />
            <div className="min-h-screen bg-white p-6 text-neutral-800 print:bg-white print:p-4">
                <div className="no-print mb-6 flex items-center justify-between gap-4 border-b border-neutral-300 pb-4">
                    <Link
                        href={`/it-requests/${itRequest.id}`}
                        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
                    >
                        <ArrowLeft className="size-4" />
                        Back to request
                    </Link>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                        <Printer className="size-4" />
                        Print
                    </button>
                </div>

                <article className="mx-auto max-w-4xl px-1 print:max-w-none">
                    <header className="mb-6 flex flex-row items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="h-14 w-1 shrink-0 bg-[#1a237e]" aria-hidden />
                            <h1 className="font-serif text-3xl font-normal tracking-tight text-[#1a237e] md:text-4xl">
                                IT Request Form
                            </h1>
                        </div>
                        <div className="flex shrink-0 flex-col items-end text-right">
                            {companyLogoUrl ? (
                                <img
                                    src={companyLogoUrl}
                                    alt=""
                                    className="h-24 w-auto max-w-[300px] object-contain print:h-20"
                                />
                            ) : null}
                        </div>
                    </header>

                    <section className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="mb-1 text-xs font-medium text-neutral-600">Full Name</p>
                            <div className="min-h-9 border border-neutral-400 px-2 py-1.5 text-sm uppercase">
                                {fullName(itRequest.employee) || <span className="text-neutral-400 normal-case">-</span>}
                            </div>
                        </div>
                        <div>
                            <p className="mb-1 text-xs font-medium text-neutral-600">Date</p>
                            <div className="min-h-9 border border-neutral-400 px-2 py-1.5 text-sm uppercase">
                                {formatUsDate(itRequest.date) || <span className="text-neutral-400 normal-case">-</span>}
                            </div>
                        </div>
                        <div>
                            <p className="mb-1 text-xs font-medium text-neutral-600">Department</p>
                            <div className="min-h-9 border border-neutral-400 px-2 py-1.5 text-sm uppercase">
                                {itRequest.department?.name ?? <span className="text-neutral-400 normal-case">-</span>}
                            </div>
                        </div>
                    </section>

                    <div className="my-6 h-px bg-neutral-300" />

                    <section className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-neutral-700">Software Required</p>
                            <div className="min-h-20 border border-neutral-400 px-2 py-2 text-sm uppercase">
                                {softwareLabel || <span className="text-neutral-400 normal-case">-</span>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-neutral-700">Hardware Request</p>
                            <div className="min-h-20 border border-neutral-400 px-2 py-2 text-sm uppercase">
                                {hardwareLabel || <span className="text-neutral-400 normal-case">-</span>}
                            </div>
                        </div>
                    </section>

                    <section className="mt-8 space-y-2">
                        <p className="text-xs font-semibold text-neutral-700">Request Status</p>
                        <div className="flex flex-wrap gap-8">
                            <CheckRow label="Draft" checked={isDraft} />
                            <CheckRow label="Submitted" checked={isSubmitted} />
                            <CheckRow label="Approved" checked={isApproved} />
                        </div>
                    </section>

                    <section className="mt-10 grid gap-8 sm:grid-cols-2">
                        <div>
                            <div className="flex min-h-20 items-end justify-center px-2 pb-2">
                                {itRequest.employee_signature_url ? (
                                    <img
                                        src={itRequest.employee_signature_url}
                                        alt="Employee signature"
                                        className="max-h-20 w-auto max-w-full object-contain object-bottom"
                                    />
                                ) : null}
                            </div>
                            <div className="border-b border-neutral-800" />
                            <p className="mt-1 text-center text-xs text-neutral-600">Employee Signature</p>
                        </div>
                        <div>
                            <div className="flex min-h-20 items-end justify-center px-2 pb-2">
                                {itRequest.approved_by_signature_url ? (
                                    <img
                                        src={itRequest.approved_by_signature_url}
                                        alt="Approver signature"
                                        className="max-h-20 w-auto max-w-full object-contain object-bottom"
                                    />
                                ) : null}
                            </div>
                            <div className="border-b border-neutral-800" />
                            <p className="mt-1 text-center text-xs text-neutral-600">Manager Signature</p>
                        </div>
                    </section>
                </article>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </>
    );
}
