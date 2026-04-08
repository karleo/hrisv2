import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { ReactNode } from 'react';

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
    created_at: string;
    employee?: Employee;
    department?: Department;
    employee_signature_url?: string | null;
    approved_by_signature_url?: string | null;
};

const ABSENCE_LABELS: { label: string; value: string }[] = [
    { label: 'Personal Leave', value: 'Personal Leave' },
    { label: 'Sick leave', value: 'Sick Leave' },
    { label: 'Maternity', value: 'Maternity Leave' },
    { label: 'Emergency Leave', value: 'Emergency Leave' },
    { label: 'Annual Leave', value: 'Annual Leave' },
];

const DETAIL_OPTIONS = ['W/ medical Report', 'W/ Out medical Report'] as const;

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

function daysLabel(n: number | null): string {
    if (n === null || n === undefined) {
        return '';
    }
    if (n === 1) {
        return '1 DAY';
    }
    return `${n} DAYS`;
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
            <div className="flex h-1 shrink-0 self-center rounded-sm overflow-hidden">
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

function MarkBoxDot({ checked }: { checked: boolean }) {
    return (
        <span
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-neutral-700 bg-white"
            aria-hidden
        >
            {checked ? <span className="h-2 w-2 rounded-full bg-neutral-900" /> : null}
        </span>
    );
}

export default function LeaveRequestPrint({
    leaveRequest,
    companyLogoUrl,
}: {
    leaveRequest: LeaveRequest;
    companyLogoUrl: string | null;
}) {
    const handlePrint = () => window.print();

    const selectedAbsence = leaveRequest.absence_types?.[0] ?? '';
    const isOthers = selectedAbsence === 'Others';
    const remarksText = leaveRequest.remarks?.trim() || '';
    const isApproved = Boolean(leaveRequest.approved_by_signature_url);

    return (
        <>
            <Head title={`Leave Request ${leaveRequest.code} – Print`} />
            <div className="leave-print-root min-h-screen bg-white p-4 text-[#111a6b] print:min-h-screen print:flex print:flex-col print:bg-white print:p-1">
                <div className="no-print mb-6 flex items-center justify-between gap-4 border-b border-neutral-300 pb-4">
                    <Link
                        href={`/leave-requests/${leaveRequest.id}`}
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

                <article className="leave-print-article mx-auto w-full max-w-[920px] border border-neutral-400 bg-white p-10 print:mx-0 print:flex print:min-h-0 print:max-w-none print:flex-1 print:flex-col print:p-5">
                    {/* Header */}
                    <header className="-mx-10 -mt-10 mb-6 shrink-0 border-b border-neutral-300 bg-white px-10 py-6 print:-mx-5 print:-mt-5 print:mb-3 print:px-5 print:py-3">
                        <div className="flex min-h-24 flex-row items-center justify-between gap-4 print:min-h-[6rem]">
                            <div className="flex min-w-0 flex-1 items-center pt-2 print:pt-0">
                                <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#111a8a] print:text-xl">
                                    Leave Form
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
                    {/* Employee details */}
                    <section className="space-y-3">
                        <div className="grid grid-cols-[1fr_150px] items-end gap-3">
                            <h2 className="text-sm font-semibold text-[#48525a]">Employees Details</h2>
                            <div className="min-w-0">
                                <p className="mb-1 text-xs font-semibold text-[#1c287f]">Date</p>
                                <FormInputBox>
                                    {formatUsDate(leaveRequest.date) || (
                                        <span className="text-neutral-400 normal-case">—</span>
                                    )}
                                </FormInputBox>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="min-w-0">
                                <p className="mb-1 text-xs font-semibold text-[#1c287f]">Full Name</p>
                                <FormInputBox>
                                    {fullName(leaveRequest.employee) ? (
                                        fullName(leaveRequest.employee)
                                    ) : (
                                        <span className="text-neutral-400 normal-case">—</span>
                                    )}
                                </FormInputBox>
                            </div>
                            <div className="min-w-0">
                                <p className="mb-1 text-xs font-semibold text-[#1c287f]">Department/Location:</p>
                                <FormInputBox>
                                    {leaveRequest.department?.name ?? (
                                        <span className="text-neutral-400 normal-case">—</span>
                                    )}
                                </FormInputBox>
                            </div>
                        </div>
                    </section>

                    <AccentRule />

                    {/* Absence, details, remarks */}
                    <section className="grid items-start gap-6 md:grid-cols-3 md:gap-8 print:grid-cols-3 print:items-stretch print:gap-3">
                        <div className="min-w-0">
                            <p className="mb-2 text-sm font-semibold text-[#1c287f]">
                                Type of Absence Requested
                            </p>
                            <ul className="space-y-2 text-sm text-neutral-800 print:space-y-1">
                                {ABSENCE_LABELS.map(({ label, value }) => (
                                    <li key={value} className="flex items-start gap-2">
                                        <MarkBoxX checked={selectedAbsence === value} />
                                        <span>{label}</span>
                                    </li>
                                ))}
                                <li className="flex flex-wrap items-center gap-2">
                                    <span className="flex items-start gap-2">
                                        <MarkBoxX checked={isOthers} />
                                        <span>Others</span>
                                    </span>
                                    <div className="min-w-[120px] flex-1 border-b border-neutral-500 bg-white/80 px-1 py-0.5 text-xs uppercase shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
                                        {isOthers && leaveRequest.absence_other
                                            ? leaveRequest.absence_other
                                            : ''}
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="min-w-0">
                            <p className="mb-2 text-sm font-semibold text-[#1c287f]">Details</p>
                            <ul className="space-y-2 text-sm text-neutral-800 print:space-y-1">
                                {DETAIL_OPTIONS.map((opt) => (
                                    <li key={opt} className="flex items-start gap-2">
                                        <MarkBoxDot checked={leaveRequest.details === opt} />
                                        <span>{opt}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex min-h-0 min-w-0 flex-col md:min-h-[200px] print:min-h-0">
                            <p className="mb-2 text-sm font-semibold text-[#1c287f] print:mb-1">Reason / Remarks</p>
                            <div className="flex min-h-[180px] flex-1 flex-col border border-neutral-500 bg-white p-2 text-sm uppercase tracking-wide text-neutral-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] md:min-h-[200px] print:min-h-[5rem] print:flex-1 print:p-1.5 print:text-xs">
                                {remarksText ? (
                                    <p className="whitespace-pre-wrap">{remarksText}</p>
                                ) : (
                                    <span className="text-neutral-400">&nbsp;</span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Period of absence */}
                    <section className="mt-8 print:mt-4">
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#00107f] print:mb-1.5 print:text-xs">
                            Period of Absence
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-3">
                            <div>
                                <p className="mb-1 text-xs font-semibold text-[#00107f]">From</p>
                                <FormInputBox>
                                    {formatUsDate(leaveRequest.period_from) || (
                                        <span className="text-neutral-400 normal-case">—</span>
                                    )}
                                </FormInputBox>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-semibold text-[#00107f]">To</p>
                                <FormInputBox>
                                    {formatUsDate(leaveRequest.period_to) || (
                                        <span className="text-neutral-400 normal-case">—</span>
                                    )}
                                </FormInputBox>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-semibold text-[#00107f]">Number of Days</p>
                                <FormInputBox>
                                    {daysLabel(leaveRequest.days) || (
                                        <span className="text-neutral-400 normal-case">—</span>
                                    )}
                                </FormInputBox>
                            </div>
                        </div>

                        <div className="mt-10 print:mt-4">
                            <div className="flex min-h-20 items-end justify-center px-2 pb-2 print:min-h-10 print:pb-0.5">
                                {leaveRequest.employee_signature_url ? (
                                    <img
                                        src={leaveRequest.employee_signature_url}
                                        alt="Employee signature"
                                        className="max-h-20 w-auto max-w-full object-contain object-bottom"
                                    />
                                ) : null}
                            </div>
                            <div className="border-b border-neutral-800" />
                            <p className="mt-1 text-center text-xs font-medium text-[#3c4295]">Employees Signature</p>
                        </div>
                    </section>

                    {/* Grows in print so manager + Ref sit toward the bottom of the page */}
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
                                <MarkBoxX checked={false} />
                                <span>Cancelled</span>
                            </label>
                            <label className="flex cursor-default items-start gap-2">
                                <MarkBoxX checked={isApproved} />
                                <span>Approved</span>
                            </label>
                        </div>

                        <div className="mt-8 print:mt-3">
                            <div className="border-b border-neutral-800 pb-1 print:pb-0" />
                            <p className="mt-1 text-center text-xs font-medium text-[#3c4295] print:text-[10px]">
                                Signature
                            </p>
                            {leaveRequest.approved_by_signature_url ? (
                                <div className="mt-2 flex justify-center print:mt-0.5">
                                    <img
                                        src={leaveRequest.approved_by_signature_url}
                                        alt=""
                                        className="h-16 max-w-xs object-contain object-bottom print:h-10"
                                    />
                                </div>
                            ) : null}
                        </div>
                    </section>

                    <p className="mt-6 shrink-0 text-center text-[10px] text-neutral-500 print:mt-2 print:text-[9px]">
                        Ref: {leaveRequest.code}
                    </p>
                    </div>
                </article>
            </div>

            <style>{`
                /* Match on-screen preview: centered card on gray frame; normal page margins. */
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
                    .leave-print-root {
                        box-sizing: border-box;
                        min-height: 100vh !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .leave-print-article {
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
