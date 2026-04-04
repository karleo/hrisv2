import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { ReactNode } from 'react';

type Employee = { id: number; first_name: string; last_name: string };
type Department = { id: number; name: string };
type Hardware = { id: number; code: string; name: string };

type ItAssetRequest = {
    id: number;
    code: string;
    date: string | null;
    date_issued: string | null;
    status: string;
    serial_number: string | null;
    remarks: string | null;
    asset_type?: string | null;
    employee_signature_url?: string | null;
    issued_by_signature_url?: string | null;
    employee?: Employee;
    department?: Department;
    issued_by_employee?: Employee;
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

const ASSET_TERMS_TEXT =
    'I hereby acknowledge that I have received the above mentioned assets. I understand that this asset belongs to PRIME LOGISTICS FZCO and is under my possession for carrying out my office work. I hereby assure that I will take care of the assets of the company to the best possible extent. I understand that the above mentioned are for business purposes and I agree not to share any of these and will not share my security code(s). In the event I lose and damage any during my employment, I further agree and understand to be responsible for the replacement costs and return all items issued to me by PRIME LOGISTICS FZCO by my last day of employment.';

function TermsAndConditionsBlock() {
    return (
        <section className="mt-8 print:mt-5">
            <p className="text-left text-sm leading-relaxed text-[#111a6b] print:text-xs print:leading-snug">
                {ASSET_TERMS_TEXT}
            </p>
        </section>
    );
}

function DualSignatureColumn({
    secondaryLabel,
    displayName,
    signatureUrl,
    signatureAlt,
    uppercaseSecondary = false,
}: {
    secondaryLabel: string;
    displayName: string;
    signatureUrl: string | null | undefined;
    signatureAlt: string;
    uppercaseSecondary?: boolean;
}) {
    return (
        <div className="flex min-w-0 flex-col px-1 sm:px-3">
            <div className="flex min-h-[5rem] items-end justify-center px-1 pb-1 print:min-h-[4rem] print:pb-0.5">
                {signatureUrl ? (
                    <img
                        src={signatureUrl}
                        alt={signatureAlt}
                        className="max-h-[4.5rem] w-auto max-w-full object-contain object-bottom print:max-h-16"
                    />
                ) : null}
            </div>
            <div className="border-b border-neutral-800" />
            <p className="mt-1.5 text-center text-xs font-semibold text-[#00107f] print:mt-1 print:text-[11px]">
                Signature
            </p>
            <p
                className={`mt-0.5 text-center text-[11px] font-semibold text-[#00107f] print:text-[10px] ${uppercaseSecondary ? 'uppercase tracking-wide' : ''}`}
            >
                {secondaryLabel}
            </p>
            <div className="mt-3 print:mt-2">
                <FormInputBox className="justify-center text-center">
                    {displayName.trim() ? (
                        displayName
                    ) : (
                        <span className="text-neutral-400 normal-case">—</span>
                    )}
                </FormInputBox>
            </div>
        </div>
    );
}

export default function ItAssetRequestPrint({
    itAssetRequest,
    hardware,
    companyLogoUrl,
}: {
    itAssetRequest: ItAssetRequest;
    hardware: Hardware[];
    companyLogoUrl: string | null;
}) {
    const handlePrint = () => window.print();

    const hardwareLabel =
        hardware.length > 0
            ? hardware.map((item) => `${item.code} - ${item.name}`).join('\n')
            : '';

    const statusNorm = (itAssetRequest.status ?? '').toLowerCase();
    const isDraft = statusNorm === 'draft';
    const isSubmitted = statusNorm === 'submitted';
    const isIssued = Boolean(itAssetRequest.issued_by_signature_url);

    const remarksText = itAssetRequest.remarks?.trim() || '';

    return (
        <>
            <Head title={`IT Asset Request ${itAssetRequest.code} – Print`} />
            <div className="it-asset-print-root min-h-screen bg-[#d9d9d9] p-4 text-[#111a6b] print:min-h-screen print:flex print:flex-col print:bg-[#d9d9d9] print:p-1">
                <div className="no-print mb-6 flex items-center justify-between gap-4 border-b border-neutral-300 pb-4">
                    <Link
                        href={`/it-asset-requests/${itAssetRequest.id}`}
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

                <article className="it-asset-print-article mx-auto w-full max-w-[920px] border border-neutral-400 bg-[#e6e6e6] p-10 print:mx-0 print:flex print:min-h-0 print:max-w-none print:flex-1 print:flex-col print:p-5">
                    <header className="-mx-10 -mt-10 mb-6 shrink-0 border-b border-neutral-300 bg-white px-10 py-6 print:-mx-5 print:-mt-5 print:mb-3 print:px-5 print:py-3">
                        <div className="flex min-h-24 flex-row items-center justify-between gap-4 print:min-h-[3.75rem]">
                            <div className="flex min-w-0 flex-1 items-center pt-2 print:pt-0">
                                <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#111a8a] print:text-xl">
                                    IT Asset Request Form
                                </h1>
                            </div>
                            <div className="flex h-24 min-w-0 max-w-[45%] shrink-0 items-center justify-end sm:min-w-[15rem] print:h-[3.75rem]">
                                {companyLogoUrl ? (
                                    <img
                                        src={companyLogoUrl}
                                        alt=""
                                        className="max-h-24 w-auto max-w-full object-contain object-right-bottom sm:max-w-[300px] print:max-h-[3.75rem]"
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
                                <h2 className="text-sm font-semibold text-[#48525a]">Request Details</h2>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">Request Date</p>
                                    <FormInputBox>
                                        {formatUsDate(itAssetRequest.date) || (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">Full Name</p>
                                    <FormInputBox>
                                        {fullName(itAssetRequest.employee) ? (
                                            fullName(itAssetRequest.employee)
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
                                        {itAssetRequest.department?.name ?? (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">Request Code</p>
                                    <FormInputBox>
                                        {itAssetRequest.code ? (
                                            itAssetRequest.code
                                        ) : (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">Serial Number</p>
                                    <FormInputBox>
                                        {itAssetRequest.serial_number ?? (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">Date Issued</p>
                                    <FormInputBox>
                                        {formatUsDate(itAssetRequest.date_issued) || (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-semibold text-[#1c287f]">Asset Type</p>
                                    <FormInputBox>
                                        {itAssetRequest.asset_type?.trim() ? (
                                            itAssetRequest.asset_type.trim()
                                        ) : (
                                            <span className="text-neutral-400 normal-case">—</span>
                                        )}
                                    </FormInputBox>
                                </div>
                            </div>
                        </section>

                        <AccentRule />

                        <section className="grid items-start gap-6 md:grid-cols-2 md:gap-8 print:grid-cols-2 print:items-stretch print:gap-3">
                            <div className="flex min-h-0 min-w-0 flex-col">
                                <p className="mb-2 text-sm font-semibold text-[#1c287f] print:mb-1">Hardware</p>
                                <div className="flex min-h-[120px] flex-1 flex-col border border-neutral-500 bg-white p-2 text-sm uppercase tracking-wide text-neutral-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] print:min-h-[5rem] print:flex-1 print:p-1.5 print:text-xs">
                                    {hardwareLabel ? (
                                        <p className="whitespace-pre-wrap">{hardwareLabel}</p>
                                    ) : (
                                        <span className="text-neutral-400">&nbsp;</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex min-h-0 min-w-0 flex-col">
                                <p className="mb-2 text-sm font-semibold text-[#1c287f] print:mb-1">Remarks</p>
                                <div className="flex min-h-[120px] flex-1 flex-col border border-neutral-500 bg-white p-2 text-sm uppercase tracking-wide text-neutral-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] print:min-h-[5rem] print:flex-1 print:p-1.5 print:text-xs">
                                    {remarksText ? (
                                        <p className="whitespace-pre-wrap">{remarksText}</p>
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
                                    <MarkBoxX checked={isIssued} />
                                    <span>Issued</span>
                                </label>
                            </div>
                        </section>

                        <AccentRule />

                        <TermsAndConditionsBlock />

                        <section className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-4 print:mt-6 print:grid-cols-2 print:gap-3">
                            <DualSignatureColumn
                                secondaryLabel="Employee's Signature"
                                displayName={fullName(itAssetRequest.employee)}
                                signatureUrl={itAssetRequest.employee_signature_url}
                                signatureAlt="Employee signature"
                            />
                            <DualSignatureColumn
                                secondaryLabel="Issued By"
                                displayName={fullName(itAssetRequest.issued_by_employee)}
                                signatureUrl={itAssetRequest.issued_by_signature_url}
                                signatureAlt="Issued by signature"
                                uppercaseSecondary
                            />
                        </section>

                        <div
                            className="hidden min-h-0 print:block print:flex-1"
                            aria-hidden
                        />

                        <p className="mt-8 shrink-0 text-center text-[10px] text-neutral-500 print:mt-4 print:text-[9px]">
                            Ref: {itAssetRequest.code}
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
                    .it-asset-print-root {
                        box-sizing: border-box;
                        min-height: 100vh !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .it-asset-print-article {
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
