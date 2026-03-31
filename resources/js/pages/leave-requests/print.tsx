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
            className={`flex min-h-9 items-center border border-neutral-400 bg-white px-2 py-1.5 text-sm uppercase tracking-wide text-neutral-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] ${className}`}
        >
            {children}
        </div>
    );
}

function AccentRule() {
    return (
        <div className="my-5 flex h-px items-stretch">
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
    companyName,
    companyLogoUrl,
}: {
    leaveRequest: LeaveRequest;
    companyName: string;
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
            <div className="min-h-screen bg-white p-6 text-neutral-800 print:bg-white print:p-4">
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

                <article className="mx-auto max-w-4xl px-1 print:max-w-none">
                    {/* Header */}
                    <header className="mb-6 flex flex-row items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="h-14 w-1 shrink-0 bg-[#1a237e]" aria-hidden />
                            <h1 className="font-serif text-3xl font-normal tracking-tight text-[#1a237e] md:text-4xl">
                                Leave Form
                            </h1>
                        </div>
                        <div className="flex shrink-0 flex-col items-end text-right">
                            {companyLogoUrl ? (
                                <img
                                    src={companyLogoUrl}
                                    alt=""
                                    className="mb-1 h-14 w-auto max-w-[200px] object-contain print:h-12"
                                />
                            ) : null}
                            <p className="max-w-[220px] text-xs font-semibold uppercase leading-tight text-[#1a237e]">
                                {companyName}
                            </p>
                        </div>
                    </header>

                    {/* Employee details */}
                    <section className="space-y-4">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="min-w-[200px] flex-1 space-y-4">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-neutral-600">Full Name</p>
                                    <FormInputBox>
                                        {fullName(leaveRequest.employee) ? (
                                            fullName(leaveRequest.employee)
                                        ) : (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                                <div>
                                    <p className="mb-1 text-xs font-medium text-neutral-600">Department / Location</p>
                                    <FormInputBox>
                                        {leaveRequest.department?.name ?? (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>
                            <div className="w-40 shrink-0">
                                <p className="mb-1 text-xs font-medium text-neutral-600">Date</p>
                                <FormInputBox>
                                    {formatUsDate(leaveRequest.date) || (
                                        <span className="text-neutral-400 normal-case">—</span>
                                    )}
                                </FormInputBox>
                            </div>
                        </div>
                    </section>

                    <AccentRule />

                    {/* Absence, details, remarks */}
                    <section className="grid gap-6 md:grid-cols-3 md:gap-4">
                        <div>
                            <p className="mb-3 text-xs font-semibold text-neutral-700">
                                Type of Absence Requested
                            </p>
                            <ul className="space-y-2 text-sm text-neutral-800">
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

                        <div>
                            <p className="mb-3 text-xs font-semibold text-neutral-700">Details</p>
                            <ul className="space-y-2 text-sm text-neutral-800">
                                {DETAIL_OPTIONS.map((opt) => (
                                    <li key={opt} className="flex items-start gap-2">
                                        <MarkBoxDot checked={leaveRequest.details === opt} />
                                        <span>{opt}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="md:min-h-[200px]">
                            <p className="mb-3 text-xs font-semibold text-neutral-700">Reason / Remarks</p>
                            <div className="flex min-h-[180px] flex-col border border-neutral-500 bg-white p-2 text-sm uppercase tracking-wide text-neutral-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] md:min-h-[200px]">
                                {remarksText ? (
                                    <p className="whitespace-pre-wrap">{remarksText}</p>
                                ) : (
                                    <span className="text-neutral-400">&nbsp;</span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Period of absence */}
                    <section className="mt-8">
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#1a237e]">
                            Period of Absence
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <p className="mb-1 text-xs font-medium text-neutral-600">From</p>
                                <FormInputBox>
                                    {formatUsDate(leaveRequest.period_from) || (
                                        <span className="text-neutral-400 normal-case">—</span>
                                    )}
                                </FormInputBox>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-medium text-neutral-600">To</p>
                                <FormInputBox>
                                    {formatUsDate(leaveRequest.period_to) || (
                                        <span className="text-neutral-400 normal-case">—</span>
                                    )}
                                </FormInputBox>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-medium text-neutral-600">Number of Days</p>
                                <FormInputBox>
                                    {daysLabel(leaveRequest.days) || (
                                        <span className="text-neutral-400 normal-case">—</span>
                                    )}
                                </FormInputBox>
                            </div>
                        </div>

                        <div className="mt-10">
                            <div className="flex min-h-20 items-end justify-center px-2 pb-2 print:min-h-[5.5rem]">
                                {leaveRequest.employee_signature_url ? (
                                    <img
                                        src={leaveRequest.employee_signature_url}
                                        alt="Employee signature"
                                        className="max-h-20 w-auto max-w-full object-contain object-bottom print:max-h-24"
                                    />
                                ) : null}
                            </div>
                            <div className="border-b border-neutral-800" />
                            <p className="mt-1 text-center text-xs text-neutral-600">Employees Signature</p>
                        </div>
                    </section>

                    <AccentRule />

                    {/* Manager approval */}
                    <section className="pb-8">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                            <h2 className="text-sm font-bold uppercase tracking-wide text-[#1a237e]">
                                Manager / Supervisor Approval
                            </h2>
                            <div className="w-44 shrink-0">
                                <p className="mb-1 text-xs font-medium text-neutral-600">Date Approved</p>
                                <FormInputBox>
                                    <span className="text-neutral-400 normal-case">&nbsp;</span>
                                </FormInputBox>
                            </div>
                        </div>

                        <div className="mb-6 flex flex-wrap gap-8 text-sm">
                            <label className="flex cursor-default items-start gap-2">
                                <MarkBoxX checked={false} />
                                <span>Cancelled</span>
                            </label>
                            <label className="flex cursor-default items-start gap-2">
                                <MarkBoxX checked={isApproved} />
                                <span>Approved</span>
                            </label>
                        </div>

                        <div className="mt-8">
                            <div className="border-b border-neutral-800 pb-1" />
                            <p className="mt-1 text-center text-xs text-neutral-600">CEO / Manager Signature</p>
                            {leaveRequest.approved_by_signature_url ? (
                                <div className="mt-2 flex justify-center">
                                    <img
                                        src={leaveRequest.approved_by_signature_url}
                                        alt=""
                                        className="h-16 max-w-xs object-contain object-bottom"
                                    />
                                </div>
                            ) : null}
                        </div>
                    </section>

                    <p className="mt-6 text-center text-[10px] text-neutral-500 print:mt-4">Ref: {leaveRequest.code}</p>
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
