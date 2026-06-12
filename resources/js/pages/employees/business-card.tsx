import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';

type Department = {
    id: number;
    code: string;
    name: string;
};

type JobPosition = {
    id: number;
    code: string;
    name: string;
};

type CompanyProfile = {
    id: number;
    company_name: string;
    company_address_1: string | null;
    company_address_2: string | null;
    website: string | null;
    logo_url: string | null;
    business_card_logo_url: string | null;
    business_card_back_logo_urls: (string | null)[];
};

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    email_address: string;
    contact_number: string | null;
    address_1: string | null;
    address_2: string | null;
    company_profile: CompanyProfile | null;
    department?: Department | null;
    job_position?: JobPosition | null;
    role: 'Employee' | 'Manager' | 'CEO';
    photo_url: string | null;
    company_logo_url?: string | null;
};

function buildVCard(employee: Employee, appName: string): string {
    const fullName = `${employee.first_name} ${employee.last_name}`;
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCard(fullName)}`,
        `N:${escapeVCard(employee.last_name)};${escapeVCard(employee.first_name)};;;`,
    ];
    const org = employee.company_profile?.company_name || appName;
    if (org) {
        lines.push(`ORG:${escapeVCard(org)}`);
    }
    const companyAddress = employee.company_profile
        ? [
              employee.company_profile.company_address_1,
              employee.company_profile.company_address_2,
          ]
              .filter(Boolean)
              .join(', ')
        : '';
    if (companyAddress) {
        lines.push(`ADR;TYPE=WORK:;;${escapeVCard(companyAddress)};;;;`);
    }
    if (employee.contact_number) {
        lines.push(
            `TEL;TYPE=WORK,VOICE:${escapeVCard(employee.contact_number)}`,
        );
    }
    if (employee.company_profile?.website) {
        lines.push(`URL:${escapeVCard(employee.company_profile.website)}`);
    }
    if (employee.job_position?.name) {
        lines.push(`TITLE:${escapeVCard(employee.job_position.name)}`);
    }
    if (employee.email_address) {
        lines.push(`EMAIL:${escapeVCard(employee.email_address)}`);
    }
    lines.push('END:VCARD');
    return lines.join('\r\n');
}

function escapeVCard(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,');
}

function qrCodeDataUrl(data: string, size: number): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

export default function BusinessCard({
    employee,
    appName,
    embedded = false,
}: {
    employee: Employee;
    appName: string;
    embedded?: boolean;
}) {
    const fullName = `${employee.first_name} ${employee.last_name}`;
    const jobTitle = employee.job_position?.name ?? '';
    const vCard = useMemo(
        () => buildVCard(employee, appName),
        [employee, appName],
    );
    const qrCodeUrl = useMemo(() => qrCodeDataUrl(vCard, 320), [vCard]);
    const companyName = employee.company_profile?.company_name || appName;
    const website =
        employee.company_profile?.website
            ?.replace(/^https?:\/\//i, '')
            .replace(/\/$/, '') ?? '';
    const companyAddressParts = [
        employee.company_profile?.company_address_1,
        employee.company_profile?.company_address_2,
    ].filter((part): part is string => Boolean(part && part.trim() !== ''));
    const logoUrl =
        employee.company_logo_url ||
        employee.company_profile?.business_card_logo_url ||
        employee.company_profile?.logo_url ||
        '/images/prime-logistics-mark.png';
    const backLogoPositions = [
        'absolute top-[13%] left-[7%] flex w-[39%] items-center justify-center',
        'absolute top-[18%] right-[7%] flex w-[39%] items-center justify-center',
        'absolute top-[49%] left-[31%] flex w-[20%] items-center justify-center',
        'absolute top-[49%] right-[27%] flex w-[22%] items-center justify-center',
    ];
    const backLogoImageClasses = [
        'max-h-[clamp(5rem,12vw,8.5rem)] w-full scale-125 object-contain',
        'max-h-[clamp(5rem,12vw,8.5rem)] w-full scale-[2.1] object-contain',
        'max-h-[clamp(1.3rem,3.2vw,2.2rem)] w-full scale-100 object-contain',
        'max-h-[clamp(2.4rem,5.6vw,3.8rem)] w-full scale-[1.45] object-contain',
    ];
    const backLogoUrls = (
        employee.company_profile?.business_card_back_logo_urls ?? []
    ).filter((url): url is string => Boolean(url));
    const officePhone = '+971 4 339 7059';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employees', href: index().url },
        { title: fullName, href: '#' },
        { title: 'Business card', href: '#' },
    ];

    function handlePrint() {
        window.print();
    }

    function handleDownloadVCard() {
        const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${employee.first_name}_${employee.last_name}.vcf`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const content = (
        <div
            className={`flex flex-1 flex-col ${embedded ? 'justify-center p-4' : 'gap-6 p-4 md:p-6 print:p-0'}`}
        >
            {!embedded ? (
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <Link
                        href={index().url}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Employees
                    </Link>
                    <Button onClick={handlePrint} size="sm">
                        <Printer className="mr-2 size-4" />
                        Print / Save as PDF
                    </Button>
                    <Button
                        onClick={handleDownloadVCard}
                        size="sm"
                        variant="outline"
                    >
                        <Download className="mr-2 size-4" />
                        Download as contact (.vcf)
                    </Button>
                </div>
            ) : null}

            <div
                className={`flex ${embedded ? 'min-h-0' : 'min-h-[50vh]'} flex-col items-center gap-8 print:min-h-0 print:gap-4`}
            >
                <div
                    id="business-card-front"
                    data-business-card
                    className={`${embedded ? 'w-[520px] max-w-full' : 'w-full max-w-[920px]'} relative overflow-hidden border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.25)] print:w-[3.76in] print:rounded-none print:border print:border-slate-300 print:shadow-none`}
                    style={{ aspectRatio: '940 / 500' }}
                >
                    <div className="flex h-full flex-col bg-white font-['Trebuchet_MS',Arial,sans-serif]">
                        <div className="flex items-start justify-between px-[7%] pt-[7%]">
                            <div className="min-w-0">
                                <h1 className="text-[clamp(1.5rem,4vw,3rem)] leading-none font-bold tracking-[-0.03em] text-[#07134f] print:text-[18px]">
                                    {fullName}
                                </h1>
                                <p className="mt-2 text-[clamp(1rem,2.5vw,1.75rem)] leading-tight font-bold text-[#2077ad] print:mt-1 print:text-[11px]">
                                    {jobTitle || 'Designation'}
                                </p>
                            </div>
                            <img
                                src={logoUrl}
                                alt=""
                                className="ml-5 h-[clamp(4.5rem,12vw,9rem)] w-[28%] shrink-0 object-contain object-right-top print:h-[48px]"
                            />
                        </div>

                        <div className="mt-auto grid grid-cols-[1fr_auto_1.25fr] items-start gap-[6%] px-[7%] pb-[8%]">
                            <div className="min-w-0 text-[clamp(0.95rem,2.3vw,1.55rem)] leading-[1.22] text-[#1e2744] print:text-[9px]">
                                <p className="mb-2 font-bold text-[#2077ad] print:mb-1">
                                    {companyName}
                                </p>
                                {companyAddressParts.length > 0 ? (
                                    companyAddressParts.map((part) => (
                                        <p key={part}>{part}</p>
                                    ))
                                ) : (
                                    <p>Company address</p>
                                )}
                            </div>

                            <div className="h-full min-h-[7rem] w-1 bg-[#f2c500] print:min-h-[42px] print:w-px" />

                            <div className="min-w-0 space-y-2 text-[clamp(0.95rem,2.3vw,1.55rem)] leading-tight text-[#1e2744] print:space-y-0.5 print:text-[9px]">
                                {employee.email_address ? (
                                    <p>
                                        <span className="font-bold text-[#2077ad]">
                                            E:
                                        </span>{' '}
                                        {employee.email_address}
                                    </p>
                                ) : null}
                                {employee.contact_number ? (
                                    <p>
                                        <span className="font-bold text-[#2077ad]">
                                            M:
                                        </span>{' '}
                                        {employee.contact_number}
                                    </p>
                                ) : null}
                                <p>
                                    <span className="font-bold text-[#2077ad]">
                                        T:
                                    </span>{' '}
                                    {officePhone}
                                </p>
                                {website ? (
                                    <p className="pt-4 print:pt-1">{website}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-[4%] bg-[#f2c500]" />
                    </div>
                </div>

                <div
                    id="business-card-back"
                    data-business-card
                    className={`${embedded ? 'w-[520px] max-w-full' : 'w-full max-w-[920px]'} relative overflow-hidden border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.25)] print:w-[3.76in] print:rounded-none print:border print:border-slate-300 print:shadow-none`}
                    style={{ aspectRatio: '940 / 500' }}
                >
                    <div className="relative h-full w-full overflow-hidden bg-white font-['Trebuchet_MS',Arial,sans-serif]">
                        {backLogoUrls.map((backLogoUrl, index) => (
                            <div
                                key={`${backLogoUrl}-${index}`}
                                className={backLogoPositions[index]}
                            >
                                <img
                                    src={backLogoUrl}
                                    alt={`Business card back logo ${index + 1}`}
                                    className={backLogoImageClasses[index]}
                                />
                            </div>
                        ))}

                        <svg
                            className="absolute inset-x-0 bottom-0 h-[35%] w-full"
                            viewBox="0 0 940 175"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <path
                                fill="#f2c500"
                                d="M0 12 C165 42 315 92 470 104 C630 116 770 56 940 12 L940 54 C770 86 635 129 470 122 C310 115 170 70 0 42 Z"
                            />
                            <path
                                fill="#f2c500"
                                d="M0 104 C170 128 330 145 500 142 C665 139 802 104 940 82 L940 175 L0 175 Z"
                            />
                        </svg>

                        <img
                            src={qrCodeUrl}
                            alt={`vCard QR code for ${fullName}`}
                            className="absolute right-[3%] bottom-[4%] size-[clamp(4.5rem,10vw,7rem)] bg-white p-2"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return embedded ? (
        <>
            <Head title={`Business card – ${fullName}`} />
            {content}
            <style>{`@media print {
                body * { visibility: hidden; }
                [data-business-card], [data-business-card] * { visibility: visible; }
                [data-business-card] {
                    position: relative;
                    width: 3.76in;
                    height: 2in;
                    margin: 0 0 0.15in 0;
                    box-shadow: none;
                    page-break-inside: avoid;
                }
            }`}</style>
        </>
    ) : (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Business card – ${fullName}`} />
            {content}
            <style>{`@media print {
                body * { visibility: hidden; }
                [data-business-card], [data-business-card] * { visibility: visible; }
                [data-business-card] {
                    position: relative;
                    width: 3.76in;
                    height: 2in;
                    margin: 0 0 0.15in 0;
                    box-shadow: none;
                    page-break-inside: avoid;
                }
            }`}</style>
        </AppLayout>
    );
}
