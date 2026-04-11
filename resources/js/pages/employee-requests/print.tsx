import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { ReactNode } from 'react';

type Employee = { id: number; first_name: string; last_name: string };
type Department = { id: number; name: string };
type JobPosition = { id: number; name: string };

type EmployeeRequest = {
    id: number;
    code: string;
    employee_id: number;
    job_position_id: number;
    department_id: number;
    date: string;
    date_of_joining: string;
    status: string;
    departure_date: string | null;
    arrival_date: string | null;
    preferred_airlines: string | null;
    last_encashment_date: string | null;
    bag_allowance: string | null;
    ticket_booking?: boolean;
    passport_request?: boolean;
    ticket_encashment?: boolean;
    amount_2000?: boolean;
    amount_1000?: boolean;
    leave_salary?: string | null;
    passport_ack_airline_name?: string | null;
    passport_ack_home_country?: string | null;
    passport_ack_departure_date_time?: string | null;
    passport_ack_home_country_departure_date_time?: string | null;
    employee?: Employee;
    department?: Department;
    job_position?: JobPosition;
    employee_signature_url?: string | null;
    ceo_signature_url?: string | null;
    approved_by_signature_url?: string | null;
    approved_by_name?: string;
    decided_at?: string | null;
};

function formatUsDate(value: string | null | undefined): string {
    if (value == null || value === '') {
        return '';
    }
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return '';
    }
    const [, y, m, d] = match;
    return `${m}/${d}/${y}`;
}

function formatUsDateTime(value: string | null | undefined): string {
    if (!value) {
        return '';
    }
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return '';
    }
    const [, y, m, d] = match;
    return `${m}/${d}/${y}`;
}

function fullName(emp?: Employee | null): string {
    if (!emp) {
        return '';
    }
    return `${emp.first_name} ${emp.last_name}`.trim();
}

function boxText(value: string | null | undefined): ReactNode {
    const t = value?.trim() ?? '';
    return t ? t : <span className="text-neutral-400 normal-case">—</span>;
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

export default function EmployeeRequestPrint({
    employeeRequest,
    companyLogoUrl,
}: {
    employeeRequest: EmployeeRequest;
    companyLogoUrl: string | null;
}) {
    const handlePrint = () => window.print();
    const isApproved = Boolean(employeeRequest.approved_by_signature_url);
    const approverName = employeeRequest.approved_by_name?.trim() ?? '';
    const approvedDate = isApproved
        ? formatUsDateTime(employeeRequest.decided_at) || formatUsDate(employeeRequest.date)
        : '';
    const ticketBooking = Boolean(employeeRequest.ticket_booking);
    const passportRequest = Boolean(employeeRequest.passport_request);
    const ticketEncashment = Boolean(employeeRequest.ticket_encashment);
    const amount2000 = Boolean(employeeRequest.amount_2000);
    const amount1000 = Boolean(employeeRequest.amount_1000);

    return (
        <>
            <Head title={`Employee Request ${employeeRequest.code} – Print`} />
            <div className="employee-print-root min-h-screen bg-white p-4 text-[#111a6b] print:flex print:min-h-screen print:flex-col print:bg-white print:p-1">
                <div className="no-print mb-6 flex items-center justify-between gap-4 border-b border-neutral-300 pb-4">
                    <Link
                        href={`/employee-requests/${employeeRequest.id}`}
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

                <article className="employee-print-article mx-auto w-full max-w-[920px] border border-neutral-400 bg-white p-10 print:mx-0 print:flex print:min-h-0 print:max-w-none print:flex-1 print:flex-col print:p-5">
                    <header className="-mx-10 -mt-10 mb-6 shrink-0 border-b border-neutral-300 bg-white px-10 py-6 print:-mx-5 print:-mt-5 print:mb-3 print:px-5 print:py-3">
                        <div className="flex min-h-24 flex-row items-center justify-between gap-4 print:min-h-[6rem]">
                            <div className="flex min-w-0 flex-1 items-center pt-2 print:pt-0">
                                <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#111a8a] print:text-xl">
                                    Employee Request Form
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
                                <h2 className="text-sm font-semibold text-[#48525a]">
                                    Employee Information
                                </h2>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">Date</p>
                                    <FormInputBox>
                                        {formatUsDate(employeeRequest.date) || (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">
                                        Requested by (Full name)
                                    </p>
                                    <FormInputBox>
                                        {fullName(employeeRequest.employee) ? (
                                            fullName(employeeRequest.employee)
                                        ) : (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">
                                        Department / Location
                                    </p>
                                    <FormInputBox>
                                        {employeeRequest.department?.name ?? (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">
                                        Designation
                                    </p>
                                    <FormInputBox>
                                        {employeeRequest.job_position?.name ?? (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">
                                        Date of joining
                                    </p>
                                    <FormInputBox>
                                        {formatUsDate(employeeRequest.date_of_joining) || (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>
                        </section>

                        <AccentRule />

                        <section>
                            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#00107f] print:mb-2 print:text-xs">
                                Request details
                            </h2>
                            <div className="mb-6 grid gap-6 md:grid-cols-2 print:mb-4 print:gap-4">
                                <div className="min-w-0">
                                    <p className="mb-2 text-sm font-semibold text-[#1c287f] print:mb-1 print:text-xs">
                                        Request type
                                    </p>
                                    <ul className="space-y-2 text-sm text-neutral-800 print:space-y-1 print:text-xs">
                                        <li className="flex items-start gap-2">
                                            <MarkBoxX checked={ticketBooking} />
                                            <span>Ticket booking</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <MarkBoxX checked={passportRequest} />
                                            <span>Passport</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <MarkBoxX checked={ticketEncashment} />
                                            <span>Ticket encashment</span>
                                        </li>
                                    </ul>
                                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-800 print:mt-2 print:gap-3 print:text-xs">
                                        <span className="font-semibold text-[#1c287f]">Amount:</span>
                                        <label className="flex cursor-default items-center gap-2">
                                            <span className="tabular-nums">2000</span>
                                            <MarkBoxX checked={amount2000} />
                                        </label>
                                        <label className="flex cursor-default items-center gap-2">
                                            <span className="tabular-nums">1000</span>
                                            <MarkBoxX checked={amount1000} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="grid min-w-0 gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-3">
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#00107f]">
                                        Departure date
                                    </p>
                                    <FormInputBox>
                                        {formatUsDate(employeeRequest.departure_date) || (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#00107f]">
                                        Arrival date
                                    </p>
                                    <FormInputBox>
                                        {formatUsDate(employeeRequest.arrival_date) || (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#00107f]">
                                        Preferred airlines
                                    </p>
                                    <FormInputBox>{boxText(employeeRequest.preferred_airlines)}</FormInputBox>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#00107f]">
                                        Last encashment date
                                    </p>
                                    <FormInputBox>
                                        {formatUsDate(employeeRequest.last_encashment_date) || (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#00107f]">
                                        Bag allowance
                                    </p>
                                    <FormInputBox>{boxText(employeeRequest.bag_allowance)}</FormInputBox>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#00107f]">
                                        Leave salary
                                    </p>
                                    <FormInputBox>
                                        {boxText(employeeRequest.leave_salary)}
                                    </FormInputBox>
                                </div>
                            </div>

                            <div className="mt-6 rounded-md border border-neutral-300 bg-white/60 p-3 print:mt-3 print:p-2">
                                <p className="text-sm font-semibold text-[#1c287f] print:text-xs">
                                    Passport: Acknowledgement / Remarks / Flight details
                                </p>
                                <p className="mt-1 text-xs text-neutral-700 print:text-[10px]">
                                    This is to acknowledge that I received my passport in good condition. Signed below with date.
                                </p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 print:mt-2 print:gap-2">
                                    <div className="min-w-0">
                                        <p className="mb-1 text-xs font-semibold text-[#00107f]">Name of airlines</p>
                                        <FormInputBox>{boxText(employeeRequest.passport_ack_airline_name)}</FormInputBox>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="mb-1 text-xs font-semibold text-[#00107f]">Home country</p>
                                        <FormInputBox>{boxText(employeeRequest.passport_ack_home_country)}</FormInputBox>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="mb-1 text-xs font-semibold text-[#00107f]">Departure date/time</p>
                                        <FormInputBox>{boxText(employeeRequest.passport_ack_departure_date_time)}</FormInputBox>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="mb-1 text-xs font-semibold text-[#00107f]">Home country departure date/time</p>
                                        <FormInputBox>{boxText(employeeRequest.passport_ack_home_country_departure_date_time)}</FormInputBox>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mt-8 print:mt-4">
                            <div className="flex min-h-20 items-end justify-center px-2 pb-2 print:min-h-10 print:pb-0.5">
                                {employeeRequest.employee_signature_url ? (
                                    <img
                                        src={employeeRequest.employee_signature_url}
                                        alt="Employee signature"
                                        className="max-h-20 w-auto max-w-full object-contain object-bottom"
                                    />
                                ) : null}
                            </div>
                            <div className="border-b border-neutral-800" />
                            <p className="mt-1 text-center text-xs font-medium text-[#3c4295]">
                                Employee signature
                            </p>
                        </section>

                        <div
                            className="hidden min-h-0 print:block print:flex-1"
                            aria-hidden
                        />

                        <AccentRule />

                        <section className="shrink-0 pb-8 print:pb-2">
                            <div className="mb-4 grid grid-cols-[1fr_11rem] items-end gap-3 print:mb-1.5">
                                <h2 className="text-sm font-bold uppercase tracking-wide text-[#00107f] print:text-xs">
                                    Manager / supervisor approval
                                </h2>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#00107f]">
                                        Date approved
                                    </p>
                                    <FormInputBox>
                                        {approvedDate || (
                                            <span className="text-neutral-400 normal-case">&nbsp;</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>

                            {approverName ? (
                                <div className="mb-4 min-w-0 print:mb-2">
                                    <p className="mb-1 text-xs font-semibold text-[#00107f]">
                                        Approved by
                                    </p>
                                    <FormInputBox>{approverName}</FormInputBox>
                                </div>
                            ) : null}

                            <div className="mb-6 flex flex-wrap gap-8 text-sm print:mb-2 print:gap-5 print:text-xs">
                                <span className="flex cursor-default items-start gap-2 opacity-60">
                                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-neutral-700 bg-white text-[10px] font-bold leading-none" />
                                    <span>Cancelled</span>
                                </span>
                                <span className="flex cursor-default items-start gap-2">
                                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-neutral-700 bg-white text-[10px] font-bold leading-none text-neutral-900">
                                        {isApproved ? '✕' : ''}
                                    </span>
                                    <span>Approved</span>
                                </span>
                            </div>

                            <div className="mt-8 print:mt-3">
                                <div className="flex min-h-20 items-end justify-center px-2 pb-2 print:min-h-10 print:pb-0.5">
                                    {employeeRequest.approved_by_signature_url ? (
                                        <img
                                            src={employeeRequest.approved_by_signature_url}
                                            alt=""
                                            className="max-h-20 w-auto max-w-full object-contain object-bottom"
                                        />
                                    ) : null}
                                </div>
                                <div className="border-b border-neutral-800" />
                                <p className="mt-1 text-center text-xs font-medium text-[#3c4295] print:text-[10px]">
                                    Signature
                                </p>
                            </div>

                            <div className="mt-8 print:mt-4">
                                <div className="mx-auto max-w-xs">
                                    <div className="flex min-h-16 items-end justify-center px-2 pb-1 print:min-h-10 print:pb-0">
                                        {employeeRequest.ceo_signature_url ? (
                                            <img
                                                src={employeeRequest.ceo_signature_url}
                                                alt=""
                                                className="h-14 max-w-xs object-contain object-bottom print:h-9"
                                            />
                                        ) : null}
                                    </div>
                                    <div className="border-b border-neutral-800" />
                                    <p className="mt-1 text-center text-xs font-medium text-[#3c4295] print:text-[10px]">
                                        CEO signature
                                    </p>
                                </div>
                            </div>
                        </section>

                        <p className="mt-6 shrink-0 text-center text-[10px] text-neutral-500 print:mt-2 print:text-[9px]">
                            Ref: {employeeRequest.code}
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
                    .employee-print-root {
                        box-sizing: border-box;
                        min-height: 100vh !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .employee-print-article {
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
