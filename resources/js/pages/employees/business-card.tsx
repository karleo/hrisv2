import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, Printer, User } from 'lucide-react';
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
};

function buildVCard(
    employee: Employee,
    appName: string
): string {
    const fullName = `${employee.first_name} ${employee.last_name}`;
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCard(fullName)}`,
        `N:${escapeVCard(employee.last_name)};${escapeVCard(employee.first_name)};;;`,
    ];
    if (employee.photo_url) {
        lines.push(`PHOTO;VALUE=URI:${escapeVCard(employee.photo_url)}`);
    }
    const org = employee.company_profile?.company_name || appName;
    if (org) {
        lines.push(`ORG:${escapeVCard(org)}`);
    }
    const companyAddress = employee.company_profile
        ? [employee.company_profile.company_address_1, employee.company_profile.company_address_2].filter(Boolean).join(', ')
        : '';
    if (companyAddress) {
        lines.push(`ADR;TYPE=WORK:;;${escapeVCard(companyAddress)};;;;`);
    }
    if (employee.contact_number) {
        lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(employee.contact_number)}`);
    }
    if (employee.company_profile?.website) {
        lines.push(`URL:${escapeVCard(employee.company_profile.website)}`);
    }
    if (employee.job_position?.name) {
        lines.push(`TITLE:${escapeVCard(employee.job_position.name)}`);
    }
    if (employee.department?.name) {
        lines.push(`NOTE:Department: ${escapeVCard(employee.department.name)}`);
    }
    if (employee.email_address) {
        lines.push(`EMAIL:${escapeVCard(employee.email_address)}`);
    }
    const address = [employee.address_1, employee.address_2].filter(Boolean).join(', ');
    if (address) {
        lines.push(`ADR;TYPE=HOME:;;${escapeVCard(address)};;;;`);
    }
    lines.push('END:VCARD');
    return lines.join('\r\n');
}

function buildCompactVCard(
    employee: Employee,
    appName: string,
): string {
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
    if (employee.job_position?.name) {
        lines.push(`TITLE:${escapeVCard(employee.job_position.name)}`);
    }
    if (employee.contact_number) {
        lines.push(`TEL;TYPE=CELL:${escapeVCard(employee.contact_number)}`);
    }
    if (employee.email_address) {
        lines.push(`EMAIL:${escapeVCard(employee.email_address)}`);
    }
    lines.push('END:VCARD');

    return lines.join('\r\n');
}

function escapeVCard(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function qrCodeDataUrl(data: string, size: number): string {
    const encoded = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
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
    const department = employee.department?.name ?? '';
    const vCard = useMemo(
        () => buildVCard(employee, appName),
        [employee, appName]
    );
    const compactVCard = useMemo(
        () => buildCompactVCard(employee, appName),
        [employee, appName],
    );
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
        <div className={`flex flex-1 flex-col ${embedded ? 'justify-center p-4' : 'gap-6 p-4 md:p-6 print:p-0'}`}>
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
                    <Button onClick={handleDownloadVCard} size="sm" variant="outline">
                        <Download className="mr-2 size-4" />
                        Download as contact (.vcf)
                    </Button>
                </div>
            ) : null}

            {!embedded ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 print:hidden">
                    <p className="text-sm font-medium text-muted-foreground">
                        Scan to add contact
                    </p>
                    <div className="rounded-lg border border-border bg-white p-3">
                        <img
                            src={qrCodeDataUrl(vCard, 180)}
                            alt=""
                            width={180}
                            height={180}
                            className="size-[180px]"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        QR code contains contact details (vCard)
                    </p>
                </div>
            ) : null}

            <div className={`flex ${embedded ? 'min-h-0' : 'min-h-[50vh]'} items-start justify-center print:min-h-0 print:items-center print:justify-center`}>
                <div
                    id="business-card"
                    className={`${embedded ? 'w-[400px] max-w-full' : 'w-[336px]'} overflow-hidden rounded-lg border border-border bg-card shadow-lg print:w-[3.5in] print:rounded-none print:border-2 print:border-foreground print:shadow-none`}
                    style={{ aspectRatio: '3.5 / 2' }}
                >
                    <div className="flex h-full w-full flex-row gap-0">
                        <div className="flex w-[33%] shrink-0 items-center justify-center bg-muted/50 p-2 print:p-1">
                            {employee.photo_url ? (
                                <img
                                    src={employee.photo_url}
                                    alt=""
                                    className="size-20 rounded object-cover print:size-16"
                                />
                            ) : (
                                <div className="flex size-20 items-center justify-center rounded-full bg-muted print:size-16">
                                    <User className="size-10 text-muted-foreground print:size-8" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-1 flex-col justify-center gap-0.5 px-4 py-3 print:gap-0 print:px-3 print:py-2">
                            <p className="text-lg font-semibold leading-tight text-foreground print:text-base">
                                {fullName}
                            </p>
                            {jobTitle && (
                                <p className="text-sm font-medium text-foreground/90 print:text-xs">
                                    {jobTitle}
                                </p>
                            )}
                            {department && (
                                <p className="text-xs text-muted-foreground print:text-[10px]">
                                    {department}
                                </p>
                            )}
                            <div className="mt-1.5 space-y-0.5 border-t border-border/50 pt-1.5 print:mt-1 print:space-y-0 print:border-t print:pt-1">
                                <p className="truncate text-xs text-muted-foreground print:text-[10px]">
                                    {employee.email_address}
                                </p>
                                {employee.contact_number && (
                                    <p className="text-xs text-muted-foreground print:text-[10px]">
                                        {employee.contact_number}
                                    </p>
                                )}
                            </div>
                            <div className="mt-auto flex items-end justify-between gap-2 pt-1 print:pt-0.5">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                    {employee.company_profile?.logo_url && (
                                        <img
                                            src={employee.company_profile.logo_url}
                                            alt=""
                                            className="size-8 shrink-0 object-contain print:size-7"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        {(employee.company_profile?.company_name || appName) && (
                                            <p className="text-[10px] font-medium text-muted-foreground print:text-[8px]">
                                                {employee.company_profile?.company_name || appName}
                                            </p>
                                        )}
                                        {employee.company_profile?.website && (
                                            <a
                                                href={employee.company_profile.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block truncate text-[9px] text-primary underline print:text-[8px]"
                                            >
                                                {employee.company_profile.website.replace(/^https?:\/\//i, '')}
                                            </a>
                                        )}
                                        {employee.company_profile && [employee.company_profile.company_address_1, employee.company_profile.company_address_2].filter(Boolean).length > 0 && (
                                            <p className="truncate text-[9px] text-muted-foreground print:text-[8px]">
                                                {[employee.company_profile.company_address_1, employee.company_profile.company_address_2].filter(Boolean).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="shrink-0" aria-hidden>
                                    <img
                                        src={qrCodeDataUrl(compactVCard, 72)}
                                        alt=""
                                        width={72}
                                        height={72}
                                        className="size-[72px] rounded bg-white p-1"
                                    />
                                </div>
                            </div>
                        </div>
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
                #business-card, #business-card * { visibility: visible; }
                #business-card {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 3.5in;
                    height: 2in;
                    margin: 0;
                    box-shadow: none;
                }
            }`}</style>
        </>
    ) : (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Business card – ${fullName}`} />
            {content}
            <style>{`@media print {
                body * { visibility: hidden; }
                #business-card, #business-card * { visibility: visible; }
                #business-card {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 3.5in;
                    height: 2in;
                    margin: 0;
                    box-shadow: none;
                }
            }`}</style>
        </AppLayout>
    );
}
