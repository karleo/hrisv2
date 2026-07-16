import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    Briefcase,
    CalendarDays,
    Clock,
    Download,
    Eye,
    FileText,
    HeartPulse,
    KeyRound,
    Mail,
    MapPin,
    Phone,
    Shield,
    User,
} from 'lucide-react';
import { type ComponentType, type ReactNode, useMemo, useState } from 'react';
import { EmployeeAttendanceTab } from '@/components/employee-attendance-tab';
import { EmployeeEmailSignatureCard } from '@/components/employee-email-signature-card';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
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
};

type WorkTimetable = {
    id: number;
    name: string;
};

type AttendanceRow = {
    date: string;
    device_pin: string;
    device_name: string | null;
    clock_in: string | null;
    clock_out: string | null;
    working_hours: string;
    overtime: string;
    punch_count: number;
};

type AttendancePayload = {
    filters: { from: string; to: string };
    summary: { total_days: number; total_punches: number };
    rows: AttendanceRow[];
};

type Employee = {
    id: number;
    employee_code: string;
    biometric_user_id?: string | null;
    first_name: string;
    last_name: string;
    email_address: string;
    contact_number: string | null;
    address_1: string | null;
    address_2: string | null;
    profile_address_1?: string | null;
    profile_address_2?: string | null;
    role: string;
    photo_url: string | null;
    department?: Department | null;
    job_position?: JobPosition | null;
    company_profile?: CompanyProfile | null;
    work_timetable?: WorkTimetable | null;
    documents?: Array<{
        id: number;
        name: string;
        document_type?: {
            id: number;
            code: string;
            name: string;
        } | null;
        original_name: string;
        url: string;
    }>;
    phone?: string | null;
    mobile?: string | null;
    date_of_birth?: string | null;
    gender?: 'Male' | 'Female' | null;
    marital_status?: 'Single' | 'Married' | 'Other' | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
};

type EmployeeDocument = {
    id: number;
    name: string;
    document_type?: {
        id: number;
        code: string;
        name: string;
    } | null;
    original_name: string;
    url: string;
    expiry_date?: string | null;
    status?: 'active' | 'expired' | 'archived' | string | null;
    version_number?: number | null;
};

type LocalDocumentPreview = {
    name: string;
    url: string;
    html?: string;
    excelHtml?: string;
    csvRows?: string[][];
    note?: string;
};

const MAX_PREVIEW_PARSE_BYTES = 6 * 1024 * 1024;
const MAX_EXCEL_PREVIEW_ROWS = 120;
const MAX_EXCEL_PREVIEW_COLUMNS = 24;

type ProfileTab = 'profile' | 'security' | 'employment' | 'documents' | 'leave' | 'attendance';

function formatDateDdMmYyyy(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return value;
    }

    const [, yyyy, mm, dd] = match;

    return `${dd}/${mm}/${yyyy}`;
}

function documentStatusLabel(status: string | null | undefined): string {
    switch (status) {
        case 'expired':
            return 'Expired';
        case 'archived':
            return 'Archived';
        default:
            return 'Active';
    }
}

function documentStatusClasses(status: string | null | undefined): string {
    switch (status) {
        case 'expired':
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300';
        case 'archived':
            return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300';
        default:
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300';
    }
}

type LeaveUsageLineItem = {
    id: number;
    leave_type: string;
    leave_category: 'paid' | 'unpaid' | string;
    period_from: string | null;
    period_to: string | null;
    days: number | null;
    status: string;
    decided_at: string | null;
};

type LeaveConfig = {
    openingBalance: number;
    approvedDaysUsed: number;
    liveRemainingBalance: number;
    usage: LeaveUsageLineItem[];
};

type EmailSignatureCompanyProfilePayload = {
    company_name: string;
    company_address_1?: string | null;
    company_address_2?: string | null;
    website?: string | null;
    signature_template?: string | null;
};

type EmailSignaturePreviewPayload = {
    fullName: string;
    designation: string | null;
    email: string;
    phone: string | null;
};

function displayValue(value: string | null | undefined): string {
    if (!value || value.trim() === '') {
        return '—';
    }

    return value;
}

function ProfileSection({
    title,
    description,
    children,
    className,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm',
                className,
            )}
        >
            <div className="border-b border-border/60 bg-muted/20 px-5 py-4 md:px-6">
                <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
                {description ? (
                    <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
                ) : null}
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2 md:px-6 md:py-5 xl:grid-cols-3">
                {children}
            </div>
        </section>
    );
}

function ProfileField({
    label,
    value,
    icon: Icon,
    className,
}: {
    label: string;
    value: ReactNode;
    icon?: ComponentType<{ className?: string }>;
    className?: string;
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
                {label}
            </p>
            <p className="inline-flex items-start gap-2 text-sm font-medium text-foreground">
                {Icon ? (
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary/70" />
                ) : null}
                <span className="min-w-0 break-words">{value}</span>
            </p>
        </div>
    );
}

export default function EmployeeProfile({
    employee,
    attendance,
    leaveConfig,
    hasEmployeeProfile,
    emailSignatureCompanyProfile,
    emailSignaturePreview,
}: {
    employee: Employee | null;
    attendance: AttendancePayload | null;
    leaveConfig: LeaveConfig;
    hasEmployeeProfile: boolean;
    emailSignatureCompanyProfile: EmailSignatureCompanyProfilePayload | null;
    emailSignaturePreview: EmailSignaturePreviewPayload;
}) {
    const showAttendanceTab = attendance !== null;
    const initialTab = (() => {
        if (typeof window === 'undefined') {
            return 'profile' as const;
        }

        const tab = new URLSearchParams(window.location.search).get('tab');
        if (tab === 'attendance' && showAttendanceTab) {
            return 'attendance' as const;
        }
        if (tab === 'documents' || tab === 'security' || tab === 'leave' || tab === 'employment') {
            return tab;
        }

        return 'profile' as const;
    })();
    const [tab, setTab] = useState<ProfileTab>(initialTab);
    const { t } = useI18n();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Profile', href: '/my-profile' },
    ];
    const [previewDocument, setPreviewDocument] = useState<EmployeeDocument | null>(null);
    const [previewLocalDocument, setPreviewLocalDocument] = useState<LocalDocumentPreview | null>(null);
    const activeDocuments = (employee?.documents ?? []).filter((doc) => (doc.status ?? 'active') === 'active');
    const historicalDocuments = (employee?.documents ?? []).filter((doc) => (doc.status ?? 'active') !== 'active');
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const { props } = usePage<{
        flash?: { success?: string; error?: string };
        auth?: { user?: { name?: string; email?: string } };
    }>();
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const authUserName = props.auth?.user?.name ?? '—';
    const authUserEmail = props.auth?.user?.email ?? '—';

    const profileTabs = useMemo(() => {
        const tabs: Array<{
            id: ProfileTab;
            label: string;
            icon: ComponentType<{ className?: string }>;
        }> = [
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Shield },
            {
                id: 'employment',
                label: t('profile.employmentTab', 'Employment'),
                icon: Briefcase,
            },
        ];

        if (hasEmployeeProfile) {
            tabs.push(
                { id: 'documents', label: 'Documents', icon: FileText },
                { id: 'leave', label: 'Leave', icon: CalendarDays },
            );

            if (showAttendanceTab) {
                tabs.push({ id: 'attendance', label: 'Attendance', icon: Clock });
            }
        }

        return tabs;
    }, [hasEmployeeProfile, showAttendanceTab, t]);

    function formatLeaveDays(value: number | null | undefined): string {
        if (value === null || value === undefined || Number.isNaN(value)) {
            return '0';
        }

        return Number(value).toLocaleString(undefined, {
            minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
            maximumFractionDigits: 2,
        });
    }

    function isImageDocument(name: string): boolean {
        return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
    }

    function isPdfDocument(name: string): boolean {
        return /\.pdf$/i.test(name);
    }

    function isCsvDocument(name: string): boolean {
        return /\.csv$/i.test(name);
    }

    function isExcelDocument(name: string): boolean {
        return /\.(xls|xlsx|xslx)$/i.test(name);
    }

    function isDocxDocument(name: string): boolean {
        return /\.docx$/i.test(name);
    }

    function parseCsvText(text: string): string[][] {
        const lines = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        return lines.map((line) => {
            const values: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const next = line[i + 1];

                if (char === '"' && inQuotes && next === '"') {
                    current += '"';
                    i++;
                    continue;
                }

                if (char === '"') {
                    inQuotes = !inQuotes;
                    continue;
                }

                if (char === ',' && !inQuotes) {
                    values.push(current);
                    current = '';
                    continue;
                }

                current += char;
            }

            values.push(current);
            return values;
        });
    }

    function buildExcelPreviewHtml(
        XLSX: typeof import('xlsx'),
        sheet: import('xlsx').WorkSheet | null
    ): { html?: string; truncated: boolean } {
        if (!sheet) {
            return { html: undefined, truncated: false };
        }

        const ref = sheet['!ref'];
        if (!ref) {
            return {
                html: XLSX.utils.sheet_to_html(sheet),
                truncated: false,
            };
        }

        const range = XLSX.utils.decode_range(ref);
        const cellAddresses = Object.keys(sheet).filter((key) => !key.startsWith('!'));
        const populatedCells = cellAddresses.filter((address) => {
            const cell = sheet[address] as
                | { v?: unknown; w?: string; t?: string }
                | undefined;
            if (!cell) {
                return false;
            }
            if (cell.t === 'z') {
                return false;
            }
            if (cell.v === null || cell.v === undefined) {
                return typeof cell.w === 'string' && cell.w.trim().length > 0;
            }
            if (typeof cell.v === 'string') {
                return cell.v.trim().length > 0;
            }
            return true;
        });
        const dataRange =
            populatedCells.length > 0
                ? populatedCells.reduce(
                      (acc, address) => {
                          const cellPos = XLSX.utils.decode_cell(address);
                          return {
                              s: {
                                  r: Math.min(acc.s.r, cellPos.r),
                                  c: Math.min(acc.s.c, cellPos.c),
                              },
                              e: {
                                  r: Math.max(acc.e.r, cellPos.r),
                                  c: Math.max(acc.e.c, cellPos.c),
                              },
                          };
                      },
                      {
                          s: { ...range.s },
                          e: { ...range.s },
                      }
                  )
                : range;
        const limitedEndRow = Math.min(
            dataRange.e.r,
            dataRange.s.r + MAX_EXCEL_PREVIEW_ROWS - 1
        );
        const limitedEndCol = Math.min(
            dataRange.e.c,
            dataRange.s.c + MAX_EXCEL_PREVIEW_COLUMNS - 1
        );
        const truncated =
            limitedEndRow < dataRange.e.r || limitedEndCol < dataRange.e.c;
        const limitedSheet = {
            ...sheet,
            '!ref': XLSX.utils.encode_range({
                s: dataRange.s,
                e: { r: limitedEndRow, c: limitedEndCol },
            }),
        };

        return {
            html: XLSX.utils.sheet_to_html(limitedSheet),
            truncated,
        };
    }

    async function openDocumentPreview(doc: EmployeeDocument): Promise<void> {
        setPreviewDocument(null);
        setPreviewLocalDocument(null);
        const documentViewUrl = `/my-profile/documents/${doc.id}/view`;
        const previewSources = [documentViewUrl, doc.url];

        if (isImageDocument(doc.original_name) || isPdfDocument(doc.original_name)) {
            setPreviewDocument({
                ...doc,
                url: documentViewUrl,
            });
            return;
        }

        try {
            let selectedPreviewUrl = documentViewUrl;
            let blob: Blob | null = null;

            for (const source of previewSources) {
                try {
                    const response = await fetch(source);
                    if (!response.ok) {
                        continue;
                    }

                    blob = await response.blob();
                    selectedPreviewUrl = source;
                    break;
                } catch {
                    continue;
                }
            }

            if (blob === null) {
                throw new Error('Unable to fetch document for preview.');
            }

            const localFile = new File([blob], doc.original_name, {
                type: blob.type || 'application/octet-stream',
            });

            const basePreview: LocalDocumentPreview = {
                name: localFile.name,
                url: selectedPreviewUrl,
            };

            if (isDocxDocument(localFile.name)) {
                const mammoth = await import('mammoth');
                const arrayBuffer = await localFile.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setPreviewLocalDocument({
                    ...basePreview,
                    html: result.value,
                    note: 'Rendered from Word document.',
                });
                return;
            }

            if (isExcelDocument(localFile.name)) {
                if (localFile.size > MAX_PREVIEW_PARSE_BYTES) {
                    setPreviewLocalDocument({
                        ...basePreview,
                        note: 'This Excel file is too large for in-app preview. Please open it in a new tab.',
                    });
                    return;
                }

                const XLSX = await import('xlsx');
                const arrayBuffer = await localFile.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, {
                    type: 'array',
                    sheets: 0,
                    cellFormula: false,
                    cellHTML: false,
                    cellStyles: false,
                });
                const firstSheetName = workbook.SheetNames[0];
                const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;
                const preview = buildExcelPreviewHtml(XLSX, sheet);
                setPreviewLocalDocument({
                    ...basePreview,
                    excelHtml: preview.html,
                    note: firstSheetName
                        ? `Rendered from sheet: ${firstSheetName}${preview.truncated ? ` (showing first ${MAX_EXCEL_PREVIEW_ROWS} rows x ${MAX_EXCEL_PREVIEW_COLUMNS} columns)` : ''}`
                        : 'Excel file has no sheets.',
                });
                return;
            }

            if (isCsvDocument(localFile.name)) {
                const csvText = await localFile.text();
                setPreviewLocalDocument({
                    ...basePreview,
                    csvRows: parseCsvText(csvText),
                    note: 'Rendered from CSV file.',
                });
                return;
            }

            setPreviewLocalDocument({
                ...basePreview,
                note: 'Preview is not available for this file type. Use Open in new tab.',
            });
        } catch {
            setPreviewLocalDocument({
                name: doc.original_name,
                url: documentViewUrl,
                note: 'Could not render this file in-app. Please open it in a new tab.',
            });
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Profile" />

            <div className="flex h-full flex-1 flex-col gap-5 p-4 md:p-6 lg:p-8">
                <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-sm dark:border-slate-700/70 dark:from-slate-800/90 dark:via-slate-800/45 dark:to-transparent">
                    <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
                        <div className="flex min-w-0 items-center gap-4">
                            {hasEmployeeProfile && employee ? (
                                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-background/80 shadow-sm md:size-20">
                                    {employee.photo_url ? (
                                        <img
                                            src={employee.photo_url}
                                            alt="Employee photo"
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <User className="size-8 text-muted-foreground md:size-10" />
                                    )}
                                </div>
                            ) : (
                                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm md:size-20">
                                    <User className="size-8 text-primary md:size-10" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">
                                    Employee profile
                                </p>
                                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight md:text-3xl">
                                    {hasEmployeeProfile && employee
                                        ? `${employee.first_name} ${employee.last_name}`
                                        : 'My Profile'}
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {hasEmployeeProfile && employee
                                        ? `${employee.employee_code} · ${employee.job_position?.name ?? 'Employee'}`
                                        : hasEmployeeProfile
                                          ? 'View your information from Employee Master.'
                                          : 'View your account profile information.'}
                                </p>
                            </div>
                        </div>
                        {hasEmployeeProfile && employee ? (
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                                    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
                                        Department
                                    </p>
                                    <p className="mt-1 truncate text-sm font-semibold">
                                        {employee.department?.name ?? '—'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                                    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
                                        Company
                                    </p>
                                    <p className="mt-1 truncate text-sm font-semibold">
                                        {employee.company_profile?.company_name ?? '—'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                                    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
                                        Timetable
                                    </p>
                                    <p className="mt-1 truncate text-sm font-semibold">
                                        {employee.work_timetable?.name ?? '—'}
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </section>

                <nav className="overflow-x-auto rounded-2xl border border-border bg-card/90 p-2 shadow-sm backdrop-blur-sm">
                    <div className="flex min-w-max gap-2">
                        {profileTabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                                    tab === id
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                                )}
                            >
                                <Icon className="size-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </nav>

                <div className="min-h-0 flex-1 space-y-6">
                    <div className={cn('space-y-6', tab === 'profile' ? '' : 'hidden')}>
                        {hasEmployeeProfile && employee ? (
                            <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                                <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm xl:sticky xl:top-6 xl:self-start">
                                    <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />
                                    <div className="flex flex-col items-center gap-4 p-6">
                                        <div className="relative flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted/20 shadow-sm">
                                            {employee.photo_url ? (
                                                <img
                                                    src={employee.photo_url}
                                                    alt="Employee photo"
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <User className="size-12 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="w-full rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-center">
                                            <p className="text-lg font-bold tracking-tight">
                                                {employee.first_name} {employee.last_name}
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {employee.employee_code}
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {employee.job_position?.name ?? '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <ProfileSection
                                        title="Contact & identity"
                                        description="Primary contact details and employee identifiers."
                                    >
                                        <ProfileField
                                            label="Full name"
                                            value={`${employee.first_name} ${employee.last_name}`}
                                            icon={User}
                                        />
                                        <ProfileField
                                            label="Employee code"
                                            value={employee.employee_code}
                                        />
                                        <ProfileField
                                            label="Email"
                                            value={employee.email_address}
                                            icon={Mail}
                                        />
                                        <ProfileField
                                            label="Contact number"
                                            value={displayValue(employee.contact_number)}
                                            icon={Phone}
                                        />
                                        <ProfileField
                                            label="Phone"
                                            value={displayValue(employee.phone)}
                                            icon={Phone}
                                        />
                                        <ProfileField
                                            label="Mobile"
                                            value={displayValue(employee.mobile)}
                                            icon={Phone}
                                        />
                                    </ProfileSection>

                                    <ProfileSection
                                        title="Work details"
                                        description="Your role, department, and schedule."
                                    >
                                        <ProfileField
                                            label="Department"
                                            value={displayValue(employee.department?.name)}
                                            icon={Building2}
                                        />
                                        <ProfileField
                                            label="Job position"
                                            value={displayValue(employee.job_position?.name)}
                                            icon={Briefcase}
                                        />
                                        <ProfileField
                                            label="Work timetable"
                                            value={displayValue(employee.work_timetable?.name)}
                                            icon={Clock}
                                        />
                                        <ProfileField
                                            label="Company"
                                            value={displayValue(employee.company_profile?.company_name)}
                                            icon={Building2}
                                        />
                                        <ProfileField
                                            label="Address"
                                            value={displayValue(
                                                [employee.address_1, employee.address_2]
                                                    .filter(Boolean)
                                                    .join(', '),
                                            )}
                                            icon={MapPin}
                                            className="sm:col-span-2 xl:col-span-3"
                                        />
                                    </ProfileSection>

                                    <ProfileSection
                                        title="Personal details"
                                        description="Personal information on file."
                                    >
                                        <ProfileField
                                            label="Date of birth"
                                            value={displayValue(employee.date_of_birth)}
                                        />
                                        <ProfileField
                                            label="Gender"
                                            value={displayValue(employee.gender)}
                                        />
                                        <ProfileField
                                            label="Marital status"
                                            value={displayValue(employee.marital_status)}
                                        />
                                    </ProfileSection>

                                    <ProfileSection
                                        title="Emergency contact"
                                        description="Who to reach in case of emergency."
                                    >
                                        <ProfileField
                                            label="Contact name"
                                            value={displayValue(employee.emergency_contact_name)}
                                            icon={HeartPulse}
                                        />
                                        <ProfileField
                                            label="Contact phone"
                                            value={displayValue(employee.emergency_contact_phone)}
                                            icon={Phone}
                                        />
                                    </ProfileSection>
                                </div>
                            </div>
                        ) : (
                            <ProfileSection
                                title="Account information"
                                description="No employee profile is linked to this account."
                            >
                                <ProfileField label="Name" value={authUserName} icon={User} />
                                <ProfileField label="Email" value={authUserEmail} icon={Mail} />
                                <div className="sm:col-span-2 xl:col-span-3">
                                    <p className="text-muted-foreground rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm">
                                        Security settings are available under the Security tab.
                                    </p>
                                </div>
                            </ProfileSection>
                        )}
                    </div>

                    <div className={cn(tab === 'security' ? '' : 'hidden')}>
                        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
                            <div className="h-1 bg-gradient-to-r from-primary/70 to-transparent" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <KeyRound className="size-4 text-primary" />
                                    Account security
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-sm">
                                    Keep your account secure by updating your password regularly.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPasswordDialogOpen(true)}
                                >
                                    <KeyRound className="mr-2 size-4" />
                                    Change password
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div
                        className={cn(
                            'overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm',
                            tab === 'employment' ? '' : 'hidden',
                        )}
                    >
                        <div className="border-b border-border/60 bg-muted/20 px-5 py-4 md:px-6">
                            <h3 className="flex items-center gap-2 text-sm font-semibold">
                                <Briefcase className="size-4 text-primary" />
                                {t('profile.employmentTab', 'Employment')}
                            </h3>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                                Email signature and employment branding.
                            </p>
                        </div>
                        <div className="p-5 md:p-6">
                            <EmployeeEmailSignatureCard
                                fullName={emailSignaturePreview.fullName}
                                designation={emailSignaturePreview.designation}
                                email={emailSignaturePreview.email}
                                phone={emailSignaturePreview.phone}
                                companyProfile={emailSignatureCompanyProfile}
                            />
                        </div>
                    </div>

                    <Card
                        className={cn(
                            'overflow-hidden rounded-2xl border-border/80 shadow-sm',
                            tab === 'documents' && hasEmployeeProfile ? '' : 'hidden',
                        )}
                    >
                        <div className="h-1 bg-gradient-to-r from-primary/70 to-transparent" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="size-4 text-primary" />
                                Documents
                            </CardTitle>
                            <p className="text-muted-foreground text-sm">
                                Active files and document history on your employee record.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(employee?.documents?.length ?? 0) === 0 ? (
                                <p className="text-muted-foreground text-sm">No documents available.</p>
                            ) : (
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold">Active Documents</h4>
                                            <span className="text-xs text-muted-foreground">
                                                {activeDocuments.length} item{activeDocuments.length === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                        {activeDocuments.length > 0 ? (
                                            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_140px_120px] gap-3 rounded-xl bg-muted/30 px-4 py-2.5 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                                <span>Document type</span>
                                                <span>Status</span>
                                                <span>Expiry date</span>
                                                <span className="text-right">Actions</span>
                                            </div>
                                        ) : null}
                                        {activeDocuments.length > 0 ? activeDocuments.map((doc) => (
                                            <div key={doc.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_140px_120px] items-center gap-3 rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm transition-colors hover:bg-muted/20">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{doc.document_type?.name ?? doc.name}</p>
                                                    <p className="text-muted-foreground truncate text-xs">{doc.original_name}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${documentStatusClasses(doc.status)}`}>
                                                            {documentStatusLabel(doc.status)}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Version {doc.version_number ?? 1}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {formatDateDdMmYyyy(doc.expiry_date)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => void openDocumentPreview(doc)}
                                                    >
                                                        <Eye className="size-4" />
                                                        <span className="sr-only">Preview</span>
                                                    </Button>
                                                    <Button asChild type="button" variant="outline" size="sm">
                                                        <a href={doc.url} download={doc.original_name}>
                                                            <Download className="mr-1 size-4" />
                                                            Download
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                                                No active documents.
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold">Archived / Expired History</h4>
                                            <span className="text-xs text-muted-foreground">
                                                {historicalDocuments.length} item{historicalDocuments.length === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                        {historicalDocuments.length > 0 ? (
                                            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_140px_120px] gap-3 rounded-xl bg-muted/30 px-4 py-2.5 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                                <span>Document type</span>
                                                <span>Status</span>
                                                <span>Expiry date</span>
                                                <span className="text-right">Actions</span>
                                            </div>
                                        ) : null}
                                        {historicalDocuments.length > 0 ? historicalDocuments.map((doc) => (
                                            <div key={doc.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_140px_120px] items-center gap-3 rounded-xl border border-border/70 bg-muted/15 p-4">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{doc.document_type?.name ?? doc.name}</p>
                                                    <p className="text-muted-foreground truncate text-xs">{doc.original_name}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${documentStatusClasses(doc.status)}`}>
                                                            {documentStatusLabel(doc.status)}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Version {doc.version_number ?? 1}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {formatDateDdMmYyyy(doc.expiry_date)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => void openDocumentPreview(doc)}
                                                    >
                                                        <Eye className="size-4" />
                                                        <span className="sr-only">Preview</span>
                                                    </Button>
                                                    <Button asChild type="button" variant="outline" size="sm">
                                                        <a href={doc.url} download={doc.original_name}>
                                                            <Download className="mr-1 size-4" />
                                                            Download
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                                                No archived or expired records yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card
                        className={cn(
                            'overflow-hidden rounded-2xl border-border/80 shadow-sm',
                            tab === 'leave' && hasEmployeeProfile ? '' : 'hidden',
                        )}
                    >
                        <div className="h-1 bg-gradient-to-r from-primary/70 to-transparent" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CalendarDays className="size-4 text-primary" />
                                Leave policy
                            </CardTitle>
                            <p className="text-muted-foreground text-sm">
                                Your balance summary and approved leave usage.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 shadow-sm">
                                    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
                                        Opening balance
                                    </p>
                                    <p className="mt-2 text-3xl font-bold tracking-tight">
                                        {formatLeaveDays(leaveConfig.openingBalance)}
                                        <span className="text-muted-foreground ml-1 text-base font-medium">days</span>
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 shadow-sm">
                                    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
                                        Approved leave used
                                    </p>
                                    <p className="mt-2 text-3xl font-bold tracking-tight">
                                        {formatLeaveDays(leaveConfig.approvedDaysUsed)}
                                        <span className="text-muted-foreground ml-1 text-base font-medium">days</span>
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-emerald-300/50 bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 p-5 shadow-sm dark:border-emerald-700/50 dark:from-emerald-950/30 dark:to-emerald-900/10">
                                    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
                                        Live remaining balance
                                    </p>
                                    <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                                        {formatLeaveDays(leaveConfig.liveRemainingBalance)}
                                        <span className="text-muted-foreground ml-1 text-base font-medium">days</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold">Leave usage</h4>
                                    <span className="text-muted-foreground text-xs">Approved requests only</span>
                                </div>
                                <div className="overflow-hidden rounded-2xl border border-border/80 shadow-sm">
                                    <div className="max-h-[28rem] overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 z-10 bg-muted/60 text-left backdrop-blur-sm">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold">Leave type</th>
                                                    <th className="px-4 py-3 font-semibold">Category</th>
                                                    <th className="px-4 py-3 font-semibold">From</th>
                                                    <th className="px-4 py-3 font-semibold">To</th>
                                                    <th className="px-4 py-3 font-semibold">Days</th>
                                                    <th className="px-4 py-3 font-semibold">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leaveConfig.usage.length > 0 ? (
                                                    leaveConfig.usage.map((item) => (
                                                        <tr key={item.id} className="border-t border-border/70 hover:bg-muted/20">
                                                            <td className="px-4 py-3">{item.leave_type}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium">
                                                                    {item.leave_category === 'unpaid'
                                                                        ? 'Unpaid'
                                                                        : 'Paid'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">{item.period_from ?? '—'}</td>
                                                            <td className="px-4 py-3">{item.period_to ?? '—'}</td>
                                                            <td className="px-4 py-3">
                                                                {item.days !== null
                                                                    ? formatLeaveDays(item.days)
                                                                    : '—'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-flex rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                                                    Approved
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="text-muted-foreground px-4 py-8 text-center"
                                                        >
                                                            No approved leave usage yet.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className={cn('space-y-4', tab === 'attendance' && showAttendanceTab ? '' : 'hidden')}>
                        {employee ? (
                            attendance ? (
                                <EmployeeAttendanceTab
                                    employeeId={employee.id}
                                    attendance={attendance}
                                    viewMode
                                    context="my-profile"
                                />
                            ) : (
                                <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
                                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                                        Attendance data is not available. Reload this page or contact HR if the issue
                                        persists.
                                    </CardContent>
                                </Card>
                            )
                        ) : null}
                    </div>
                </div>
            </div>

            <Dialog
                open={passwordDialogOpen}
                onOpenChange={(open) => {
                    setPasswordDialogOpen(open);
                    if (!open) {
                        passwordForm.reset();
                        passwordForm.clearErrors();
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            passwordForm.put('/settings/password', {
                                preserveScroll: true,
                                onSuccess: () => {
                                    passwordForm.reset();
                                    passwordForm.clearErrors();
                                    setPasswordDialogOpen(false);
                                },
                                onError: () => {
                                    passwordForm.reset('password', 'password_confirmation');
                                },
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="profile-current-password">Current password</Label>
                            <Input
                                id="profile-current-password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Current password"
                                value={passwordForm.data.current_password}
                                onChange={(event) => passwordForm.setData('current_password', event.target.value)}
                            />
                            <InputError message={passwordForm.errors.current_password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-new-password">New password</Label>
                            <Input
                                id="profile-new-password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="New password"
                                value={passwordForm.data.password}
                                onChange={(event) => passwordForm.setData('password', event.target.value)}
                            />
                            <InputError message={passwordForm.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-confirm-password">Confirm password</Label>
                            <Input
                                id="profile-confirm-password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Confirm password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(event) => passwordForm.setData('password_confirmation', event.target.value)}
                            />
                            <InputError message={passwordForm.errors.password_confirmation} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-muted-foreground">
                                {passwordForm.recentlySuccessful ? 'Password updated successfully.' : ' '}
                            </p>
                            <Button type="submit" disabled={passwordForm.processing}>
                                Save password
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={previewDocument !== null || previewLocalDocument !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewDocument(null);
                        setPreviewLocalDocument(null);
                    }
                }}
            >
                <DialogContent className="w-[96vw] max-w-[96vw] overflow-hidden sm:max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>
                            {previewDocument?.name ?? previewLocalDocument?.name ?? 'Document preview'}
                        </DialogTitle>
                    </DialogHeader>
                    {previewDocument || previewLocalDocument ? (
                        <div className="min-w-0 space-y-3">
                            <div className="min-w-0 overflow-hidden rounded-md border bg-muted/20 p-2">
                                {previewDocument ? (
                                    <iframe
                                        src={previewDocument.url}
                                        title={previewDocument.original_name}
                                        className="h-[70vh] w-full rounded-md border bg-white"
                                    />
                                ) : previewLocalDocument?.html ? (
                                    <div className="h-[70vh] min-w-0 w-full max-w-full overflow-hidden rounded bg-white">
                                        <div className="h-full w-full overflow-x-auto overflow-y-auto p-4">
                                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: previewLocalDocument.html,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : previewLocalDocument?.excelHtml ? (
                                    <div className="h-[70vh] min-w-0 w-full max-w-full overflow-hidden rounded bg-white">
                                        <div className="h-full min-w-0 w-full touch-pan-x overflow-x-auto overflow-y-auto">
                                            <div
                                                className="min-w-max p-2 text-xs sm:text-sm [&_table]:border-collapse [&_table]:bg-white [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_td]:align-top [&_td]:whitespace-nowrap [&_th]:border [&_th]:bg-muted/20 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold"
                                                dangerouslySetInnerHTML={{
                                                    __html: previewLocalDocument.excelHtml,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : previewLocalDocument?.csvRows ? (
                                    <div className="h-[70vh] min-w-0 w-full max-w-full overflow-hidden rounded bg-white">
                                        <div className="h-full min-w-0 w-full touch-pan-x overflow-x-auto overflow-y-auto">
                                            <table className="w-max min-w-full border-collapse text-xs sm:text-sm">
                                                <tbody>
                                                    {previewLocalDocument.csvRows.length > 0 ? (
                                                        previewLocalDocument.csvRows.map((row, rowIndex) => (
                                                            <tr key={`csv-r-${rowIndex}`}>
                                                                {row.length > 0 ? (
                                                                    row.map((cell, colIndex) => (
                                                                        <td
                                                                            key={`csv-c-${rowIndex}-${colIndex}`}
                                                                            className="min-w-[140px] border px-2 py-1 align-top whitespace-nowrap"
                                                                        >
                                                                            {cell}
                                                                        </td>
                                                                    ))
                                                                ) : (
                                                                    <td className="border px-2 py-1">&nbsp;</td>
                                                                )}
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td className="border px-2 py-1 text-muted-foreground">
                                                                No CSV data to preview.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 p-4 text-sm text-muted-foreground">
                                        <p>Preview is not available for this file type.</p>
                                    </div>
                                )}
                            </div>
                            {previewLocalDocument?.note ? (
                                <p className="text-xs text-muted-foreground">{previewLocalDocument.note}</p>
                            ) : null}
                            <div className="flex justify-end">
                                <Button asChild type="button" variant="outline" size="sm">
                                    <a
                                        href={previewDocument?.url ?? previewLocalDocument?.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Open in new tab
                                    </a>
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

