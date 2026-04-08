import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { ReactNode } from 'react';

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

function FormInputBox({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={`flex min-h-9 items-center border border-neutral-400 bg-white px-2 py-1.5 text-sm uppercase tracking-wide text-neutral-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] print:min-h-8 print:py-1 print:text-xs ${className}`}
        >
            {children}
        </div>
    );
}

function AccentRule() {
    return (
        <div className="my-5 flex h-px items-stretch print:my-2">
            <div className="flex h-1 shrink-0 self-center overflow-hidden rounded-sm">
                <div className="w-6 bg-cyan-500" />
                <div className="w-6 bg-orange-500" />
                <div className="w-6 bg-amber-400" />
            </div>
            <div className="ml-1 h-px flex-1 self-center bg-neutral-400" />
        </div>
    );
}

function MarkBoxX({ checked }: { checked: boolean }) {
    return (
        <span
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-neutral-700 bg-white text-[10px] font-bold leading-none text-neutral-900"
            aria-hidden
        >
            {checked ? '✕' : ''}
        </span>
    );
}

function refCode(it: ItRequest): string {
    if (it.code?.trim()) {
        return it.code.trim();
    }
    return `IT-${it.id}`;
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

    const statusNorm = (itRequest.status ?? '').toLowerCase();
    const isDraft = statusNorm === 'draft';
    const isSubmitted = statusNorm === 'submitted';
    const isApprovedStatus = statusNorm === 'approved';
    const isRejectedStatus = statusNorm === 'rejected';
    const isManagerApproved = Boolean(itRequest.approved_by_signature_url) || isApprovedStatus;

    return (
        <>
            <Head title={`IT Request ${refCode(itRequest)} – Print`} />
            <div className="it-print-root min-h-screen bg-white p-4 text-[#111a6b] print:min-h-screen print:flex print:flex-col print:bg-white print:p-1">
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

                <article className="it-print-article mx-auto w-full max-w-[920px] border border-neutral-400 bg-white p-10 print:mx-0 print:flex print:min-h-0 print:max-w-none print:flex-1 print:flex-col print:p-5">
                    <header className="-mx-10 -mt-10 mb-6 shrink-0 border-b border-neutral-300 bg-white px-10 py-6 print:-mx-5 print:-mt-5 print:mb-3 print:px-5 print:py-3">
                        <div className="flex min-h-24 flex-row items-center justify-between gap-4 print:min-h-[6rem]">
                            <div className="flex min-w-0 flex-1 items-center pt-2 print:pt-0">
                                <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#111a8a] print:text-xl">
                                    IT Request Form
                                </h1>
                            </div>
                            <div className="flex h-24 min-w-0 max-w-[45%] shrink-0 items-center justify-end sm:min-w-[15rem] print:h-[6rem] print:max-w-[58%]">
                                {companyLogoUrl ? (
                                    <img
                                        src={companyLogoUrl}
                                        alt=""
                                        className="max-h-24 w-auto max-w-full object-contain object-right-bottom sm:max-w-[300px] print:max-h-[6rem] print:max-w-[360px]"
                                    />
                                ) : (
                                    <div
                                        className="h-12 w-44 border-b border-neutral-400"
                                        aria-hidden
                                    >
                                        &nbsp;
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="flex min-h-0 flex-1 flex-col print:min-h-0">
                        <section className="space-y-3">
                            <div className="grid grid-cols-[1fr_150px] items-end gap-3">
                                <h2 className="text-sm font-semibold text-[#48525a]">Employee Details</h2>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">Date</p>
                                    <FormInputBox>
                                        {formatUsDate(itRequest.date) || (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">Full Name</p>
                                    <FormInputBox>
                                        {fullName(itRequest.employee) ? (
                                            fullName(itRequest.employee)
                                        ) : (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">
                                        Department/Location:
                                    </p>
                                    <FormInputBox>
                                        {itRequest.department?.name ?? (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>
                        </section>

                        <AccentRule />

                        <section className="grid items-start gap-6 md:grid-cols-2 md:gap-8 print:grid-cols-2 print:items-stretch print:gap-3">
                            <div className="flex min-h-0 min-w-0 flex-col">
                                <p className="mb-2 text-sm font-semibold text-[#1c287f] print:mb-1">
                                    Software Required
                                </p>
                                <div className="flex min-h-[120px] flex-1 flex-col border border-neutral-500 bg-white p-2 text-sm uppercase tracking-wide text-neutral-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] print:min-h-[5rem] print:flex-1 print:p-1.5 print:text-xs">
                                    {softwareLabel ? (
                                        <p className="whitespace-pre-wrap">{softwareLabel}</p>
                                    ) : (
                                        <span className="text-neutral-400">&nbsp;</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex min-h-0 min-w-0 flex-col">
                                <p className="mb-2 text-sm font-semibold text-[#1c287f] print:mb-1">
                                    Hardware Request
                                </p>
                                <div className="flex min-h-[120px] flex-1 flex-col border border-neutral-500 bg-white p-2 text-sm uppercase tracking-wide text-neutral-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] print:min-h-[5rem] print:flex-1 print:p-1.5 print:text-xs">
                                    {hardwareLabel ? (
                                        <p className="whitespace-pre-wrap">{hardwareLabel}</p>
                                    ) : (
                                        <span className="text-neutral-400">&nbsp;</span>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="mt-8 print:mt-4">
                            <p className="mb-2 text-sm font-semibold text-[#1c287f] print:mb-1 print:text-xs">
                                Request Status
                            </p>
                            <div className="flex flex-wrap gap-8 text-sm print:gap-6 print:text-xs">
                                <label className="flex cursor-default items-start gap-2">
                                    <MarkBoxX checked={isDraft} />
                                    <span>Draft</span>
                                </label>
                                <label className="flex cursor-default items-start gap-2">
                                    <MarkBoxX checked={isSubmitted} />
                                    <span>Submitted</span>
                                </label>
                                <label className="flex cursor-default items-start gap-2">
                                    <MarkBoxX checked={isManagerApproved} />
                                    <span>Approved</span>
                                </label>
                            </div>
                        </section>

                        <div className="mt-10 print:mt-4">
                            <div className="flex min-h-20 items-end justify-center px-2 pb-2 print:min-h-10 print:pb-0.5">
                                {itRequest.employee_signature_url ? (
                                    <img
                                        src={itRequest.employee_signature_url}
                                        alt="Employee signature"
                                        className="max-h-20 w-auto max-w-full object-contain object-bottom"
                                    />
                                ) : null}
                            </div>
                            <div className="border-b border-neutral-800" />
                            <p className="mt-1 text-center text-xs font-medium text-[#3c4295]">
                                Employees Signature
                            </p>
                        </div>

                        <div
                            className="hidden min-h-0 print:block print:flex-1"
                            aria-hidden
                        />

                        <AccentRule />

                        <section className="shrink-0 pb-8 print:pb-2">
                            <div className="mb-4 grid grid-cols-[1fr_11rem] items-end gap-3 print:mb-1.5">
                                <h2 className="text-sm font-bold uppercase tracking-wide text-[#00107f] print:text-xs">
                                    Manager / Supervisor Approval
                                </h2>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#00107f]">Date Approved</p>
                                    <FormInputBox>
                                        <span className="text-neutral-400 normal-case">&nbsp;</span>
                                    </FormInputBox>
                                </div>
                            </div>

                            <div className="mb-6 flex flex-wrap gap-8 text-sm print:mb-2 print:gap-5 print:text-xs">
                                <label className="flex cursor-default items-start gap-2">
                                    <MarkBoxX checked={isRejectedStatus} />
                                    <span>Rejected</span>
                                </label>
                                <label className="flex cursor-default items-start gap-2">
                                    <MarkBoxX checked={isManagerApproved} />
                                    <span>Approved</span>
                                </label>
                            </div>

                            <div className="mt-8 print:mt-3">
                                <div className="border-b border-neutral-800 pb-1 print:pb-0" />
                                <p className="mt-1 text-center text-xs font-medium text-[#3c4295] print:text-[10px]">
                                    Signature
                                </p>
                                {itRequest.approved_by_signature_url ? (
                                    <div className="mt-2 flex justify-center print:mt-0.5">
                                        <img
                                            src={itRequest.approved_by_signature_url}
                                            alt=""
                                            className="h-16 max-w-xs object-contain object-bottom print:h-10"
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        <p className="mt-6 shrink-0 text-center text-[10px] text-neutral-500 print:mt-2 print:text-[9px]">
                            Ref: {refCode(itRequest)}
                        </p>
                    </div>
                </article>
            </div>

            <style>{`
                @page {
                    size: A4 portrait;
                    margin: 6mm;
                }
                @media print {
                    .no-print { display: none !important; }
                    html,
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        min-height: 100vh;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .it-print-root {
                        box-sizing: border-box;
                        min-height: 100vh !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .it-print-article {
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        box-sizing: border-box;
                    }
                    #app {
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                        min-height: 100vh !important;
                    }
                    #app > * {
                        width: 100% !important;
                        max-width: none !important;
                    }
                }
            `}</style>
        </>
    );
}
