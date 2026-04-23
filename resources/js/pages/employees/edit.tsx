import { Head, Link, router, usePage } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Download, Eye, History, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { EmployeeEmailSignatureCard } from '@/components/employee-email-signature-card';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { useI18n } from '@/lib/i18n';
import { edit, index } from '@/routes/employees';
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
    company_address_1?: string | null;
    company_address_2?: string | null;
    website?: string | null;
    signature_template?: string | null;
};

type EmployeeDocument = {
    id: number;
    name: string;
    document_type_id?: number | null;
    document_type?: {
        id: number;
        code: string;
        name: string;
        requires_expiry_date?: boolean;
    } | null;
    original_name: string;
    path: string;
    url: string;
    expiry_date?: string | null;
    status?: 'active' | 'expired' | 'archived' | string | null;
    version_number?: number | null;
};

type WorkTimetable = {
    id: number;
    name: string;
};

type DocumentType = {
    id: number;
    code: string;
    name: string;
    requires_expiry_date: boolean;
};

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

type EmployeeNavigation = {
    previousId: number | null;
    nextId: number | null;
};

type ActivityLogEntry = {
    id: number;
    action: 'created' | 'updated' | 'deleted' | string;
    field: string;
    old_value: string | null;
    new_value: string | null;
    performed_by: string;
    performed_at: string | null;
};

const employeeStatuses = [
    'Employed',
    'On Probation',
    'Resigned',
    'Serving Notice Period',
    'Terminated',
    'Absconded',
    'Suspended',
    'Employment Cancelled',
] as const;

const employeeStatusStyleMap: Record<(typeof employeeStatuses)[number], string> = {
    Employed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300',
    'On Probation': 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300',
    Resigned: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300',
    'Serving Notice Period': 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/50 dark:text-orange-300',
    Terminated: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-300',
    Absconded: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-300',
    Suspended: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/50 dark:text-purple-300',
    'Employment Cancelled': 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300',
};

const employeeStatusDotStyleMap: Record<(typeof employeeStatuses)[number], string> = {
    Employed: 'bg-emerald-500',
    'On Probation': 'bg-amber-500',
    Resigned: 'bg-slate-500',
    'Serving Notice Period': 'bg-orange-500',
    Terminated: 'bg-rose-500',
    Absconded: 'bg-red-500',
    Suspended: 'bg-purple-500',
    'Employment Cancelled': 'bg-zinc-500',
};

const employeeStatusTranslationKeyMap: Record<(typeof employeeStatuses)[number], string> = {
    Employed: 'employees.status.employed',
    'On Probation': 'employees.status.onProbation',
    Resigned: 'employees.status.resigned',
    'Serving Notice Period': 'employees.status.servingNoticePeriod',
    Terminated: 'employees.status.terminated',
    Absconded: 'employees.status.absconded',
    Suspended: 'employees.status.suspended',
    'Employment Cancelled': 'employees.status.employmentCancelled',
};

function formatDocumentDate(value: string | null | undefined): string {
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

const MAX_PREVIEW_PARSE_BYTES = 6 * 1024 * 1024;
const MAX_EXCEL_PREVIEW_ROWS = 120;
const MAX_EXCEL_PREVIEW_COLUMNS = 24;

type Employee = {
    id: number;
    user_id: number | null;
    employee_code: string;
    first_name: string;
    last_name: string;
    email_address: string;
    contact_number: string | null;
    address_1: string | null;
    address_2: string | null;
    company_profile_id: number | null;
    department_id: number;
    job_position_id: number;
    role: 'Employee' | 'Manager' | 'CEO';
    photo: string | null;
    photo_url: string | null;
    documents: EmployeeDocument[];
    work_timetable_id: number | null;
    employee_status:
        | 'Employed'
        | 'Active'
        | 'On Probation'
        | 'Resigned'
        | 'Serving Notice Period'
        | 'Terminated'
        | 'Absconded'
        | 'Suspended'
        | 'Employment Cancelled';
    work_timetable?: WorkTimetable | null;
    joining_date?: string | null;
    first_contract_date?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    phone?: string | null;
    mobile?: string | null;
    date_of_birth?: string | null;
    gender?: 'Male' | 'Female' | null;
    marital_status?: 'Single' | 'Married' | 'Other' | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    leave_opening_balance?: number | null;
};

export default function Edit({
    employee,
    departments,
    jobPositions,
    companyProfiles,
    workTimetables,
    documentTypes,
    activityLogs,
    canViewActivityLogs = false,
    leaveConfig,
    employeeNavigation,
    employeeLoginActive = null,
    viewMode = false,
}: {
    employee: Employee;
    departments: Department[];
    jobPositions: JobPosition[];
    companyProfiles: CompanyProfile[];
    workTimetables: WorkTimetable[];
    documentTypes: DocumentType[];
    activityLogs: ActivityLogEntry[];
    canViewActivityLogs?: boolean;
    leaveConfig: LeaveConfig;
    employeeNavigation: EmployeeNavigation;
    employeeLoginActive?: boolean | null;
    viewMode?: boolean;
}) {
    const { t, locale } = useI18n();
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        employee.photo_url ?? null
    );
    const [documentFiles, setDocumentFiles] = useState<Array<File | null>>([]);
    const [documentRows, setDocumentRows] = useState<
        Array<{ id: string; documentTypeId: string; expiryDate: string }>
    >([{ id: crypto.randomUUID(), documentTypeId: '', expiryDate: '' }]);
    const [previewDocument, setPreviewDocument] = useState<EmployeeDocument | null>(null);
    const activeDocuments = (employee.documents ?? []).filter((doc) => (doc.status ?? 'active') === 'active');
    const historicalDocuments = (employee.documents ?? []).filter((doc) => (doc.status ?? 'active') !== 'active');
    const [previewLocalDocument, setPreviewLocalDocument] = useState<{
        name: string;
        url: string;
        html?: string;
        excelHtml?: string;
        csvRows?: string[][];
        note?: string;
    } | null>(null);
    const [previewCsvRows, setPreviewCsvRows] = useState<string[][] | null>(null);
    const [joiningDate, setJoiningDate] = useState(employee.joining_date ?? '');
    const formatLeaveDays = (value: number): string =>
        value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    const formatAuditDateLabel = (value: string | null): string => {
        if (!value) {
            return t('activity.unknownDate', 'Unknown date');
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat(locale, {
            month: 'short',
            day: 'numeric',
        }).format(parsed);
    };
    const formatAuditTimeLabel = (value: string | null): string => {
        if (!value) {
            return '—';
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat(locale, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
            .format(parsed)
            .toLowerCase();
    };
    const auditDayKey = (value: string | null): string => {
        if (!value) {
            return 'unknown';
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return 'unknown';
        }

        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };
    const formatAuditFieldName = (value: string): string =>
        value
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    const formatAuditValue = (value: string | null): string =>
        value === null || value.trim() === '' ? '—' : value;
    const getAuditActionLabelClass = (action: string): string => {
        switch (action) {
            case 'created':
                return 'text-emerald-600 dark:text-emerald-300';
            case 'deleted':
                return 'text-rose-600 dark:text-rose-300';
            default:
                return 'text-blue-600 dark:text-blue-300';
        }
    };
    const getActorInitials = (actor: string): string => {
        const normalized = actor.trim();
        if (normalized === '') {
            return 'SY';
        }

        const parts = normalized.split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    };
    const activityTimeline = Object.entries(
        activityLogs.reduce<Record<string, ActivityLogEntry[]>>((groups, log) => {
            const key = auditDayKey(log.performed_at);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(log);

            return groups;
        }, {})
    ).sort(([a], [b]) => (a < b ? 1 : -1));
    const page = usePage();
    const flash = (page.props as { flash?: { success?: string; error?: string } }).flash;
    const queryString = page.url.includes('?') ? page.url.split('?', 2)[1] ?? '' : '';
    const tabFromQuery = new URLSearchParams(queryString).get('tab');
    const readOnlyView = viewMode;
    const hasLinkedUser = employee.user_id !== null;
    const initialTab: 'employee_information' | 'work_information' | 'private_information' | 'documents' | 'leave_configuration' =
        tabFromQuery === 'documents' ||
        tabFromQuery === 'leave_configuration' ||
        tabFromQuery === 'private_information' ||
        tabFromQuery === 'work_information' ||
        tabFromQuery === 'employee_information'
            ? tabFromQuery
            : 'employee_information';
    const [tab, setTab] = useState<'employee_information' | 'work_information' | 'private_information' | 'documents' | 'leave_configuration'>(initialTab);
    const normalizedEmployeeStatus =
        employee.employee_status === 'Active' ? 'Employed' : employee.employee_status;
    const employeeCompanyProfile =
        companyProfiles.find(
            (profile) => profile.id === employee.company_profile_id
        )?.company_name ?? '';
    const employeeStatusLabel = t(
        employeeStatusTranslationKeyMap[normalizedEmployeeStatus],
        normalizedEmployeeStatus,
    );
    const [signatureFirstName, setSignatureFirstName] = useState(
        employee.first_name
    );
    const [signatureLastName, setSignatureLastName] = useState(employee.last_name);
    const [signatureEmail, setSignatureEmail] = useState(employee.email_address);
    const [signatureMobile, setSignatureMobile] = useState(
        employee.contact_number ?? employee.mobile ?? employee.phone ?? ''
    );
    const [signatureJobPositionId, setSignatureJobPositionId] = useState(
        String(employee.job_position_id)
    );
    const [signatureCompanyProfileId, setSignatureCompanyProfileId] = useState(
        employee.company_profile_id === null ? '' : String(employee.company_profile_id)
    );
    const employeeDesignation =
        jobPositions.find((job) => String(job.id) === signatureJobPositionId)
            ?.name ?? '';
    const selectedCompanyProfile =
        companyProfiles.find(
            (profile) => String(profile.id) === signatureCompanyProfileId
        ) ?? null;
    const documentTypeNameById = Object.fromEntries(
        documentTypes.map((documentType) => [String(documentType.id), documentType.name])
    );
    const documentTypeRequiresExpiryById = Object.fromEntries(
        documentTypes.map((documentType) => [String(documentType.id), documentType.requires_expiry_date])
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('sidebar.employees', 'Employees'), href: index().url },
        {
            title: `${employee.first_name} ${employee.last_name}`,
            href: edit({ employee: employee.id }).url,
        },
    ];

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Photo size must be 5 MB or less.');
                e.target.value = '';
                setPhotoPreview(employee.photo_url ?? null);
                return;
            }
            setPhotoPreview(URL.createObjectURL(file));
        } else {
            setPhotoPreview(employee.photo_url ?? null);
        }
    }

    function addDocumentRow() {
        setDocumentRows((prev) => [
            ...prev,
            { id: crypto.randomUUID(), documentTypeId: '', expiryDate: '' },
        ]);
    }

    function removeDocumentRow(id: string) {
        setDocumentRows((prev) => {
            const idx = prev.findIndex((r) => r.id === id);
            if (idx === -1) {
                return prev;
            }
            const nextRows = prev.filter((r) => r.id !== id);
            const nextFiles = [...documentFiles];
            nextFiles.splice(idx, 1);
            setDocumentFiles(nextFiles);
            return nextRows.length > 0
                ? nextRows
                : [{ id: crypto.randomUUID(), documentTypeId: '', expiryDate: '' }];
        });
    }

    function setDocumentRowDocumentTypeId(id: string, value: string) {
        setDocumentRows((prev) =>
            prev.map((row) =>
                row.id === id
                    ? {
                          ...row,
                          documentTypeId: value,
                          expiryDate:
                              value !== '' &&
                              documentTypeRequiresExpiryById[value] === false
                                  ? ''
                                  : row.expiryDate,
                      }
                    : row
            )
        );
    }

    function setDocumentRowExpiryDate(id: string, value: string) {
        setDocumentRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, expiryDate: value } : row
            )
        );
    }

    function setDocumentRowFile(id: string, file: File | null) {
        const idx = documentRows.findIndex((row) => row.id === id);
        if (idx === -1) {
            return;
        }
        setDocumentFiles((prev) => {
            const next = [...prev];
            next[idx] = file;
            return next;
        });
    }

    function deleteDocument(doc: EmployeeDocument) {
        if (confirm(`Remove "${doc.original_name}"?`)) {
            router.delete(
                `/employees/${employee.id}/documents/${doc.id}`,
                {
                    preserveScroll: true,
                    preserveState: true,
                }
            );
        }
    }

    function getDocumentViewUrl(documentId: number): string {
        return `/employees/${employee.id}/documents/${documentId}/view`;
    }

    function isImageDocument(fileName: string): boolean {
        return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
    }

    function isPdfDocument(fileName: string): boolean {
        return /\.pdf$/i.test(fileName);
    }

    function isCsvDocument(fileName: string): boolean {
        return /\.csv$/i.test(fileName);
    }

    function isOfficeDocument(fileName: string): boolean {
        return /\.(doc|docx|xls|xlsx|xslx)$/i.test(fileName);
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

    async function openExistingDocumentPreview(doc: EmployeeDocument) {
        setPreviewCsvRows(null);
        setPreviewLocalDocument(null);

        if (
            isImageDocument(doc.original_name) ||
            isPdfDocument(doc.original_name)
        ) {
            setPreviewDocument(doc);
            return;
        }

        try {
            const response = await fetch(getDocumentViewUrl(doc.id));
            const blob = await response.blob();
            const localFile = new File([blob], doc.original_name, {
                type: blob.type || 'application/octet-stream',
            });
            setPreviewDocument(null);
            await openLocalDocumentPreview(localFile);
            return;
        } catch {
            // Fall back to existing behavior if local parsing fails.
            if (isCsvDocument(doc.original_name)) {
                try {
                    const response = await fetch(getDocumentViewUrl(doc.id));
                    const csvText = await response.text();
                    setPreviewCsvRows(parseCsvText(csvText));
                } catch {
                    setPreviewCsvRows([]);
                }
            }
        }

        setPreviewDocument(doc);
    }

    async function openLocalDocumentPreview(file: File) {
        const basePreview = {
            name: file.name,
            url: URL.createObjectURL(file),
        };

        try {
            if (/\.docx?$/i.test(file.name)) {
                const mammoth = await import('mammoth');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setPreviewLocalDocument({
                    ...basePreview,
                    html: result.value,
                    note: 'Rendered from uploaded Word file.',
                });
                return;
            }

            if (/\.(xls|xlsx|xslx)$/i.test(file.name)) {
                if (file.size > MAX_PREVIEW_PARSE_BYTES) {
                    setPreviewLocalDocument({
                        ...basePreview,
                        note: 'This Excel file is too large for in-app preview. Please open it in a new tab.',
                    });
                    return;
                }

                const XLSX = await import('xlsx');
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, {
                    type: 'array',
                    sheets: 0,
                    cellFormula: false,
                    cellHTML: false,
                    cellStyles: false,
                });
                const firstSheetName = workbook.SheetNames[0];
                const sheet = firstSheetName
                    ? workbook.Sheets[firstSheetName]
                    : null;
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

            if (/\.csv$/i.test(file.name)) {
                const csvText = await file.text();
                setPreviewLocalDocument({
                    ...basePreview,
                    csvRows: parseCsvText(csvText),
                    note: 'Rendered from uploaded CSV file.',
                });
                return;
            }
        } catch {
            setPreviewLocalDocument({
                ...basePreview,
                note: 'Could not render this file. You can still open it in a new tab.',
            });
            return;
        }

        setPreviewLocalDocument(basePreview);
    }


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`${readOnlyView ? 'View' : 'Edit'} ${employee.first_name} ${employee.last_name}`}
            />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    {t('employees.backToEmployees', 'Back to Employees')}
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-start gap-3">
                        <Heading
                            title={readOnlyView ? t('employees.viewEmployee', 'View Employee') : t('employees.editEmployee', 'Edit Employee')}
                            description={readOnlyView ? t('employees.viewEmployeeDetails', 'View employee details') : t('employees.updateEmployeeDetails', 'Update employee details')}
                        />
                        <div
                            className={`mt-0.5 inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm ${employeeStatusStyleMap[normalizedEmployeeStatus]}`}
                        >
                            <span
                                className={`size-2.5 rounded-full ${employeeStatusDotStyleMap[normalizedEmployeeStatus]}`}
                            />
                            <span className="text-[11px] uppercase tracking-wide opacity-80">
                                {t('employees.employmentStatus', 'Employment Status')}
                            </span>
                            <span className="font-semibold">
                                {employeeStatusLabel}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {readOnlyView ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    href={
                                        employeeNavigation.previousId
                                            ? `${edit({ employee: employeeNavigation.previousId }).url}?mode=view&tab=${tab}`
                                            : '#'
                                    }
                                    className={
                                        employeeNavigation.previousId
                                            ? ''
                                            : 'pointer-events-none'
                                    }
                                >
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        disabled={!employeeNavigation.previousId}
                                        aria-label="View previous employee"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </Button>
                                </Link>
                                <Link
                                    href={
                                        employeeNavigation.nextId
                                            ? `${edit({ employee: employeeNavigation.nextId }).url}?mode=view&tab=${tab}`
                                            : '#'
                                    }
                                    className={
                                        employeeNavigation.nextId
                                            ? ''
                                            : 'pointer-events-none'
                                    }
                                >
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        disabled={!employeeNavigation.nextId}
                                        aria-label="View next employee"
                                    >
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </Link>
                                <Link
                                    href={`${edit({ employee: employee.id }).url}?tab=${tab}`}
                                >
                                    <Button type="button">Edit</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    type="submit"
                                    form={tab === 'private_information' ? 'employee-private-form' : 'employee-main-form'}
                                >
                                    Save
                                </Button>
                                <Link
                                    href={`${edit({ employee: employee.id }).url}?mode=view&tab=${tab}`}
                                >
                                    <Button type="button" variant="outline">
                                        Discard
                                    </Button>
                                </Link>
                                <Link href={index()}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
                {flash?.success ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                        {flash.success}
                    </div>
                ) : null}
                {flash?.error ? (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {flash.error}
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant={tab === 'employee_information' ? 'default' : 'outline'}
                        onClick={() => setTab('employee_information')}
                    >
                        Employee Information
                    </Button>
                    <Button
                        type="button"
                        variant={tab === 'documents' ? 'default' : 'outline'}
                        onClick={() => setTab('documents')}
                    >
                        Documents
                    </Button>
                    <Button
                        type="button"
                        variant={tab === 'work_information' ? 'default' : 'outline'}
                        onClick={() => setTab('work_information')}
                    >
                        Employement
                    </Button>
                    <Button
                        type="button"
                        variant={tab === 'private_information' ? 'default' : 'outline'}
                        onClick={() => setTab('private_information')}
                    >
                        Personal Information
                    </Button>
                    <Button
                        type="button"
                        variant={tab === 'leave_configuration' ? 'default' : 'outline'}
                        onClick={() => setTab('leave_configuration')}
                    >
                        Leave Policy
                    </Button>
                </div>

                {tab !== 'private_information' ? (
                    <Form
                        {...EmployeeController.update.form(employee.id)}
                        id="employee-main-form"
                        className="flex flex-1 flex-col gap-8"
                        encType="multipart/form-data"
                        onSuccess={() => {
                            if (tab === 'documents') {
                                setDocumentRows([
                                    {
                                        id: crypto.randomUUID(),
                                        label: '',
                                        expiryDate: '',
                                    },
                                ]);
                                setDocumentFiles([]);
                                setDocumentLabels([]);
                            }
                        }}
                    >
                        {({ errors }) => (
                            <>
                            <div className="grid flex-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
                            {/* Left column: Photo + Documents */}
                            <div className="flex flex-col gap-6">
                                {/* Employee photo */}
                                <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:sticky lg:top-6">
                                    <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />
                                    <div className="flex flex-col items-center gap-4 p-5">
                                        <div className="relative flex aspect-square w-full max-w-[210px] items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted/20 shadow-sm">
                                            {photoPreview ? (
                                                <img
                                                    src={photoPreview}
                                                    alt=""
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    <ImagePlus className="mx-auto size-10" />
                                                    <span className="mt-2 block text-xs">
                                                        No photo
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            ref={photoInputRef}
                                            type="file"
                                            name="photo"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={handlePhotoChange}
                                        />
                                        {!readOnlyView ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full max-w-[210px] rounded-lg"
                                                onClick={() =>
                                                    photoInputRef.current?.click()
                                                }
                                            >
                                                {photoPreview
                                                    ? 'Change photo'
                                                    : 'Upload photo'}
                                            </Button>
                                        ) : null}
                                        <div className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-center">
                                            <p className="text-base font-bold tracking-tight text-foreground">
                                                {employee.first_name} {employee.last_name}
                                            </p>
                                            {employeeDesignation ? (
                                                <p className="text-sm text-muted-foreground">
                                                    {employeeDesignation}
                                                </p>
                                            ) : null}
                                            {employeeCompanyProfile ? (
                                                <p className="text-sm text-muted-foreground">
                                                    {employeeCompanyProfile}
                                                </p>
                                            ) : null}
                                        </div>
                                        <InputError message={errors.photo} />
                                    </div>
                                </div>
                            </div>

                            {/* Right column: Form fields */}
                            <div className={`rounded-xl border border-border bg-card p-6 shadow-sm ${tab === 'employee_information' ? '' : 'hidden'}`}>
                                <fieldset disabled={readOnlyView} className="space-y-6">
                                    <input type="hidden" name="tab" value="employee_information" />
                                    <div className="grid gap-2">
                                        <Label htmlFor="employee_code">
                                            Employee Code
                                        </Label>
                                        <Input
                                            id="employee_code"
                                            name="employee_code"
                                            required
                                            maxLength={50}
                                            defaultValue={employee.employee_code}
                                            placeholder="e.g. EMP-0001"
                                            autoComplete="off"
                                        />
                                        <InputError
                                            message={errors.employee_code}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="first_name">
                                                First Name
                                            </Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                required
                                                maxLength={255}
                                                defaultValue={
                                                    employee.first_name
                                                }
                                                placeholder="John"
                                                onChange={(event) =>
                                                    setSignatureFirstName(
                                                        event.target.value
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.first_name}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="last_name">
                                                Last Name
                                            </Label>
                                            <Input
                                                id="last_name"
                                                name="last_name"
                                                required
                                                maxLength={255}
                                                defaultValue={employee.last_name}
                                                placeholder="Doe"
                                                onChange={(event) =>
                                                    setSignatureLastName(
                                                        event.target.value
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.last_name}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email_address">
                                                Email Address
                                            </Label>
                                            <Input
                                                id="email_address"
                                                name="email_address"
                                                type="email"
                                                required
                                                maxLength={255}
                                                defaultValue={
                                                    employee.email_address
                                                }
                                                placeholder="john.doe@example.com"
                                                onChange={(event) =>
                                                    setSignatureEmail(
                                                        event.target.value
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.email_address}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="contact_number">
                                                Contact Number
                                            </Label>
                                            <Input
                                                id="contact_number"
                                                name="contact_number"
                                                maxLength={50}
                                                defaultValue={
                                                    employee.contact_number ?? ''
                                                }
                                                placeholder="+1 234 567 8900"
                                                onChange={(event) =>
                                                    setSignatureMobile(
                                                        event.target.value
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.contact_number}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="address_1">
                                            Address 1
                                        </Label>
                                        <Input
                                            id="address_1"
                                            name="address_1"
                                            maxLength={255}
                                            defaultValue={
                                                employee.address_1 ?? ''
                                            }
                                            placeholder="Street address"
                                        />
                                        <InputError
                                            message={errors.address_1}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="address_2">
                                            Address 2
                                        </Label>
                                        <Input
                                            id="address_2"
                                            name="address_2"
                                            maxLength={255}
                                            defaultValue={
                                                employee.address_2 ?? ''
                                            }
                                            placeholder="Apt, suite, etc. (optional)"
                                        />
                                        <InputError
                                            message={errors.address_2}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="company_profile_id">
                                                Company Profile
                                            </Label>
                                            <select
                                                id="company_profile_id"
                                                name="company_profile_id"
                                                defaultValue={
                                                    employee.company_profile_id ?? ''
                                                }
                                                onChange={(event) =>
                                                    setSignatureCompanyProfileId(
                                                        event.target.value
                                                    )
                                                }
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">
                                                    Select company profile
                                                </option>
                                                {companyProfiles.map((profile) => (
                                                    <option
                                                        key={profile.id}
                                                        value={profile.id}
                                                    >
                                                        {profile.company_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.company_profile_id}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Shown on business card.
                                            </p>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="work_timetable_id">
                                                Work timetable
                                            </Label>
                                            <select
                                                id="work_timetable_id"
                                                name="work_timetable_id"
                                                required
                                                defaultValue={
                                                    employee.work_timetable_id ??
                                                    employee.work_timetable?.id ??
                                                    ''
                                                }
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">
                                                    Select work timetable
                                                </option>
                                                {workTimetables.map((wt) => (
                                                    <option key={wt.id} value={wt.id}>
                                                        {wt.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.work_timetable_id}
                                            />
                                            <p className="text-muted-foreground text-xs">
                                                Master weekly template for attendance
                                                (early/late, overtime).
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="department_id">
                                                Department
                                            </Label>
                                            <select
                                                id="department_id"
                                                name="department_id"
                                                required
                                                defaultValue={
                                                    employee.department_id
                                                }
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">
                                                    Select department
                                                </option>
                                                {departments.map((dept) => (
                                                    <option
                                                        key={dept.id}
                                                        value={dept.id}
                                                    >
                                                        {dept.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.department_id}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="job_position_id">
                                                Job Position
                                            </Label>
                                            <select
                                                id="job_position_id"
                                                name="job_position_id"
                                                required
                                                defaultValue={
                                                    employee.job_position_id
                                                }
                                                onChange={(event) =>
                                                    setSignatureJobPositionId(
                                                        event.target.value
                                                    )
                                                }
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">
                                                    Select job position
                                                </option>
                                                {jobPositions.map((job) => (
                                                    <option
                                                        key={job.id}
                                                        value={job.id}
                                                    >
                                                        {job.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.job_position_id}
                                            />
                                        </div>
                                    </div>

                                </fieldset>
                            </div>

                            <div className={`rounded-xl border border-border bg-card p-6 shadow-sm ${tab === 'work_information' ? '' : 'hidden'}`}>
                                <fieldset disabled={readOnlyView} className="space-y-6">
                                    <input type="hidden" name="tab" value="work_information" />
                                    <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="joining_date">
                                                Joining Date
                                            </Label>
                                            <Input
                                                id="joining_date"
                                                name="joining_date"
                                                type="date"
                                                value={joiningDate}
                                                onChange={(e) =>
                                                    setJoiningDate(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.joining_date}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="first_contract_date">
                                                First Contract Date
                                            </Label>
                                            <Input
                                                id="first_contract_date"
                                                name="first_contract_date"
                                                type="date"
                                                defaultValue={
                                                    employee.first_contract_date ??
                                                    ''
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.first_contract_date
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="start_date">
                                                Start Date
                                            </Label>
                                            <Input
                                                id="start_date"
                                                name="start_date"
                                                type="date"
                                                defaultValue={employee.start_date ?? ''}
                                            />
                                            <InputError
                                                message={errors.start_date}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="end_date">
                                                End Date
                                            </Label>
                                            <Input
                                                id="end_date"
                                                name="end_date"
                                                type="date"
                                                defaultValue={employee.end_date ?? ''}
                                            />
                                            <InputError
                                                message={errors.end_date}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="user_active">
                                                Login Access
                                            </Label>
                                            <select
                                                id="user_active"
                                                name="user_active"
                                                defaultValue={
                                                    hasLinkedUser
                                                        ? employeeLoginActive === false
                                                            ? '0'
                                                            : '1'
                                                        : ''
                                                }
                                                disabled={!hasLinkedUser}
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="1">Active (can login)</option>
                                                <option value="0">Inactive (blocked from login)</option>
                                            </select>
                                            <InputError message={errors.user_active} />
                                            {!hasLinkedUser ? (
                                                <p className="text-xs text-muted-foreground">
                                                    This employee has no linked user account yet.
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="employee_status">
                                                {t('employees.employmentStatus', 'Employment Status')}
                                            </Label>
                                            <select
                                                id="employee_status"
                                                name="employee_status"
                                                defaultValue={normalizedEmployeeStatus}
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {employeeStatuses.map((status) => (
                                                    <option key={status} value={status}>
                                                        {t(
                                                            employeeStatusTranslationKeyMap[status],
                                                            status,
                                                        )}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.employee_status} />
                                        </div>
                                    </div>

                                </fieldset>
                                <EmployeeEmailSignatureCard
                                    fullName={`${signatureFirstName} ${signatureLastName}`.trim()}
                                    designation={employeeDesignation}
                                    email={signatureEmail}
                                    phone={signatureMobile}
                                    companyProfile={selectedCompanyProfile}
                                />
                            </div>

                            <div className={`rounded-xl border border-border bg-card p-6 shadow-sm ${tab === 'leave_configuration' ? '' : 'hidden'}`}>
                                <fieldset disabled={readOnlyView} className="space-y-4">
                                    <input type="hidden" name="tab" value="leave_configuration" />
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">
                                            Leave Policy
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Set opening leave balance manually. Remaining balance updates automatically from approved leave usage.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="grid gap-2 md:col-span-1">
                                            <Label htmlFor="leave_opening_balance">
                                                Opening Balance (days)
                                            </Label>
                                            <Input
                                                id="leave_opening_balance"
                                                name="leave_opening_balance"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                defaultValue={employee.leave_opening_balance ?? leaveConfig.openingBalance ?? 0}
                                            />
                                            <InputError message={errors.leave_opening_balance} />
                                            <p className="text-xs text-muted-foreground">
                                                Manual starting balance. This value is stored and never overwritten by usage calculations.
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-muted/20 p-4">
                                            <p className="text-xs text-muted-foreground">Approved Leave Used</p>
                                            <p className="mt-1 text-2xl font-semibold text-foreground">
                                                {formatLeaveDays(leaveConfig.approvedDaysUsed)} days
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-emerald-300/50 bg-emerald-50/60 p-4 dark:border-emerald-700/50 dark:bg-emerald-950/20">
                                            <p className="text-xs text-muted-foreground">Live Remaining Balance</p>
                                            <p className="mt-1 text-2xl font-semibold text-foreground">
                                                {formatLeaveDays(leaveConfig.liveRemainingBalance)} days
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-foreground">Leave Usage</h4>
                                            <span className="text-xs text-muted-foreground">
                                                Approved requests only
                                            </span>
                                        </div>
                                        <div className="overflow-hidden rounded-lg border border-border">
                                            <div className="max-h-72 overflow-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/40 text-left">
                                                        <tr>
                                                            <th className="px-3 py-2 font-medium">Leave Type</th>
                                                            <th className="px-3 py-2 font-medium">Category</th>
                                                            <th className="px-3 py-2 font-medium">From</th>
                                                            <th className="px-3 py-2 font-medium">To</th>
                                                            <th className="px-3 py-2 font-medium">Days</th>
                                                            <th className="px-3 py-2 font-medium">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {leaveConfig.usage.length > 0 ? (
                                                            leaveConfig.usage.map((item) => (
                                                                <tr
                                                                    key={item.id}
                                                                    className="border-t border-border/70"
                                                                >
                                                                    <td className="px-3 py-2">{item.leave_type}</td>
                                                                    <td className="px-3 py-2">
                                                                        <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium">
                                                                            {item.leave_category === 'unpaid' ? 'Unpaid Leave' : 'Paid Leave'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2">{item.period_from ?? '—'}</td>
                                                                    <td className="px-3 py-2">{item.period_to ?? '—'}</td>
                                                                    <td className="px-3 py-2">
                                                                        {item.days !== null
                                                                            ? formatLeaveDays(item.days)
                                                                            : '—'}
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <span className="inline-flex rounded-full border border-emerald-300/60 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                                                            Approved
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan={6}
                                                                    className="px-3 py-4 text-center text-muted-foreground"
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
                                </fieldset>
                            </div>

                            <div className={`rounded-xl border border-border bg-card p-6 shadow-sm ${tab === 'documents' ? '' : 'hidden'}`}>
                                <Label className="mb-3 block text-base font-medium">
                                    Documents
                                </Label>
                                <p className="mb-3 text-sm text-muted-foreground">
                                    Upload multiple documents (e.g. ID, contract). Max 10 MB each.
                                </p>
                                <input type="hidden" name="tab" value="documents" />
                                {(employee.documents?.length > 0) && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold">Active Documents</h4>
                                                <span className="text-xs text-muted-foreground">
                                                    {activeDocuments.length} item{activeDocuments.length === 1 ? '' : 's'}
                                                </span>
                                            </div>
                                            {activeDocuments.length > 0 ? (
                                                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_140px_104px] gap-3 px-3 text-[11px] font-medium text-muted-foreground">
                                                    <span>Document type</span>
                                                    <span>Status</span>
                                                    <span>File</span>
                                                    <span>Expiry Date</span>
                                                    <span className="text-right">Actions</span>
                                                </div>
                                            ) : null}
                                            {activeDocuments.length > 0 ? activeDocuments.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_140px_104px] items-center gap-3 rounded-md border border-border/70 bg-background px-3 py-2"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-medium text-foreground">
                                                        {doc.document_type?.name ?? doc.name}
                                                    </p>
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
                                                    <p className="truncate text-xs font-medium text-foreground">
                                                        {doc.original_name}
                                                    </p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-medium text-foreground">
                                                        {formatDocumentDate(doc.expiry_date)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 shrink-0"
                                                        onClick={() =>
                                                            void openExistingDocumentPreview(
                                                                doc
                                                            )
                                                        }
                                                        aria-label="Preview document"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>
                                                    <a
                                                        href={getDocumentViewUrl(doc.id)}
                                                        download={doc.original_name}
                                                    >
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 shrink-0"
                                                            aria-label="Download document"
                                                        >
                                                            <Download className="size-4" />
                                                        </Button>
                                                    </a>
                                                    {!readOnlyView ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 shrink-0 text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                deleteDocument(doc)
                                                            }
                                                            aria-label="Remove document"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    ) : null}
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
                                                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_140px_72px] gap-3 px-3 text-[11px] font-medium text-muted-foreground">
                                                    <span>Document type</span>
                                                    <span>Status</span>
                                                    <span>File</span>
                                                    <span>Expiry Date</span>
                                                    <span className="text-right">Actions</span>
                                                </div>
                                            ) : null}
                                            {historicalDocuments.length > 0 ? historicalDocuments.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_140px_72px] items-center gap-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-medium text-foreground">
                                                            {doc.document_type?.name ?? doc.name}
                                                        </p>
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
                                                        <p className="truncate text-xs font-medium text-foreground">{doc.original_name}</p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-medium text-foreground">{formatDocumentDate(doc.expiry_date)}</p>
                                                    </div>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 shrink-0"
                                                            onClick={() => void openExistingDocumentPreview(doc)}
                                                            aria-label="Preview document"
                                                        >
                                                            <Eye className="size-4" />
                                                        </Button>
                                                        <a href={getDocumentViewUrl(doc.id)} download={doc.original_name}>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 shrink-0"
                                                                aria-label="Download document"
                                                            >
                                                                <Download className="size-4" />
                                                            </Button>
                                                        </a>
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
                                {!readOnlyView ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mb-3 mt-4"
                                            onClick={addDocumentRow}
                                        >
                                            <Plus className="mr-2 size-4" />
                                            Add line
                                        </Button>
                                        {documentRows.length > 0 && (
                                            <div className="space-y-3">
                                                {documentRows.map((row, i) => (
                                                    <div
                                                        key={row.id}
                                                        className="space-y-2 rounded-md border border-border bg-muted/30 p-3"
                                                    >
                                                        <div className="grid gap-2 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
                                                            <div className="grid gap-1.5">
                                                                <Label className="text-xs">
                                                                    Document type
                                                                </Label>
                                                                <select
                                                                    name="document_type_ids[]"
                                                                    value={row.documentTypeId}
                                                                    onChange={(e) =>
                                                                        setDocumentRowDocumentTypeId(
                                                                            row.id,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="border-input focus-visible:ring-ring flex h-8 w-full rounded-md border bg-background px-2 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    <option value="">
                                                                        Select document type
                                                                    </option>
                                                                    {documentTypes.map((documentType) => (
                                                                        <option
                                                                            key={documentType.id}
                                                                            value={String(
                                                                                documentType.id
                                                                            )}
                                                                        >
                                                                            {documentType.code} -{' '}
                                                                            {documentType.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="grid gap-1.5">
                                                                <Label className="text-xs">
                                                                    File
                                                                </Label>
                                                                <Input
                                                                    type="file"
                                                                    name="documents[]"
                                                                    onChange={(e) =>
                                                                        setDocumentRowFile(
                                                                            row.id,
                                                                            e.target.files?.[0] ??
                                                                                null
                                                                        )
                                                                    }
                                                                    className="h-8 text-sm"
                                                                />
                                                            </div>
                                                            <div className="grid gap-1.5">
                                                                <Label className="text-xs">
                                                                    Expiry Date
                                                                </Label>
                                                                <Input
                                                                    type="date"
                                                                    name="document_expiry_dates[]"
                                                                    value={row.expiryDate}
                                                                    onChange={(e) =>
                                                                        setDocumentRowExpiryDate(
                                                                            row.id,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="h-8 text-sm"
                                                                    disabled={
                                                                        row.documentTypeId !== '' &&
                                                                        !documentTypeRequiresExpiryById[
                                                                            row.documentTypeId
                                                                        ]
                                                                    }
                                                                />
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-destructive hover:text-destructive"
                                                                onClick={() =>
                                                                    removeDocumentRow(
                                                                        row.id
                                                                    )
                                                                }
                                                            >
                                                                <X className="size-4" />
                                                            </Button>
                                                        </div>
                                                        {documentFiles[i] ? (
                                                            <div className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background px-2 py-1.5">
                                                                <p className="truncate text-xs text-muted-foreground">
                                                                    {documentFiles[i]?.name}
                                                                </p>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7"
                                                                    onClick={() => {
                                                                        const file =
                                                                            documentFiles[
                                                                                i
                                                                            ];
                                                                        if (file) {
                                                                            void openLocalDocumentPreview(
                                                                                file
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <Eye className="size-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7"
                                                                    aria-label="Download document"
                                                                    onClick={() => {
                                                                        const file = documentFiles[i];
                                                                        if (!file) {
                                                                            return;
                                                                        }

                                                                        const url = URL.createObjectURL(file);
                                                                        const link = document.createElement('a');
                                                                        link.href = url;
                                                                        link.download = file.name;
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                        URL.revokeObjectURL(url);
                                                                    }}
                                                                >
                                                                    <Download className="size-4" />
                                                                </Button>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : null}
                                <InputError
                                    message={
                                        errors.documents ??
                                        errors['documents.0'] ??
                                        errors['document_type_ids.0'] ??
                                        errors['document_expiry_dates.0']
                                    }
                                />
                            </div>
                            </div>
                            </>
                        )}
                    </Form>
                ) : null}

                {tab === 'private_information' ? (
                    <Form
                        id="employee-private-form"
                        action={`/employees/${employee.id}/private-information`}
                        method="patch"
                        className="grid flex-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start"
                    >
                        {({ errors }) => (
                            <>
                            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:sticky lg:top-6">
                                <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />
                                <div className="flex flex-col items-center gap-4 p-5">
                                    <div className="relative flex aspect-square w-full max-w-[210px] items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted/20 shadow-sm">
                                        {photoPreview ? (
                                            <img
                                                src={photoPreview}
                                                alt=""
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-muted-foreground">
                                                <ImagePlus className="mx-auto size-10" />
                                                <span className="mt-2 block text-xs">
                                                    No photo
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    {!readOnlyView ? (
                                        <>
                                            <input
                                                ref={photoInputRef}
                                                type="file"
                                                name="photo"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={handlePhotoChange}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full max-w-[210px] rounded-lg"
                                                onClick={() =>
                                                    photoInputRef.current?.click()
                                                }
                                            >
                                                {photoPreview
                                                    ? 'Change photo'
                                                    : 'Upload photo'}
                                            </Button>
                                        </>
                                    ) : null}
                                    <div className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-center">
                                        <p className="text-base font-bold tracking-tight text-foreground">
                                            {employee.first_name} {employee.last_name}
                                        </p>
                                        {employeeDesignation ? (
                                            <p className="text-sm text-muted-foreground">
                                                {employeeDesignation}
                                            </p>
                                        ) : null}
                                        {employeeCompanyProfile ? (
                                            <p className="text-sm text-muted-foreground">
                                                {employeeCompanyProfile}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <fieldset disabled={readOnlyView} className="space-y-6">
                                <input type="hidden" name="tab" value="private_information" />
                                <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" name="phone" maxLength={50} defaultValue={employee.phone ?? ''} placeholder="e.g. +971 50 123 4567" />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="mobile">Mobile</Label>
                                        <Input id="mobile" name="mobile" maxLength={50} defaultValue={employee.mobile ?? ''} placeholder="e.g. +971 50 123 4567" />
                                        <InputError message={errors.mobile} />
                                    </div>
                                </div>

                                <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                                        <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={employee.date_of_birth ?? ''} />
                                        <InputError message={errors.date_of_birth} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <select id="gender" name="gender" defaultValue={employee.gender ?? ''} className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                        <InputError message={errors.gender} />
                                    </div>
                                </div>

                                <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="marital_status">Marital Status</Label>
                                        <select id="marital_status" name="marital_status" defaultValue={employee.marital_status ?? ''} className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="">Select</option>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <InputError message={errors.marital_status} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                                        <Input id="emergency_contact_name" name="emergency_contact_name" maxLength={255} defaultValue={employee.emergency_contact_name ?? ''} />
                                        <InputError message={errors.emergency_contact_name} />
                                    </div>
                                </div>

                                <div className="grid gap-2 md:max-w-sm">
                                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                                    <Input id="emergency_contact_phone" name="emergency_contact_phone" maxLength={50} defaultValue={employee.emergency_contact_phone ?? ''} />
                                    <InputError message={errors.emergency_contact_phone} />
                                </div>

                            </fieldset>
                            </div>
                            </>
                        )}
                    </Form>
                ) : null}

                {canViewActivityLogs ? (
                    <Collapsible
                        defaultOpen={false}
                        className="overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-sm"
                    >
                        <CollapsibleTrigger asChild>
                            <button
                                type="button"
                                className="group flex w-full items-center justify-between gap-3 bg-gradient-to-r from-muted/20 via-card to-card px-5 py-4 text-left transition-colors hover:bg-muted/40"
                            >
                                <div className="inline-flex min-w-0 items-start gap-3">
                                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                                        <History className="size-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold tracking-tight">
                                                {t('activity.title', 'Activity Log')}
                                            </p>
                                            <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                {activityLogs.length} {t('activity.entries', 'entries')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                'activity.description.employeeView',
                                                'View employee record changes by HR/Admin users.',
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="space-y-4 border-t border-border/70 px-5 pb-5 pt-4">
                                {activityLogs.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center">
                                        <p className="text-sm font-medium">{t('activity.emptyTitle', 'No activity captured yet')}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {t(
                                                'activity.emptyDescription.employeeEdit',
                                                'Changes will appear here automatically once employee details are updated.',
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="max-h-[30rem] space-y-6 overflow-auto pr-1">
                                        {activityTimeline.map(([day, entries]) => (
                                            <div key={day} className="space-y-3">
                                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                                    {formatAuditDateLabel(entries[0]?.performed_at ?? null)}
                                                </p>
                                                <div className="space-y-3">
                                                    {entries.map((log) => (
                                                        <div key={log.id} className="relative pl-8">
                                                            <span className="absolute bottom-[-18px] left-2.5 top-5 border-l border-dashed border-border/80" />
                                                            <span className="absolute left-0 top-2.5 inline-flex size-5 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[10px] font-semibold text-primary">
                                                                •
                                                            </span>
                                                            <div className="rounded-xl border border-border/70 bg-background px-4 py-3 shadow-sm transition-colors hover:bg-muted/20">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="min-w-0">
                                                                        <div className="flex min-w-0 items-center gap-2">
                                                                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
                                                                                {getActorInitials(log.performed_by || t('activity.system', 'System'))}
                                                                            </span>
                                                                            <p className="min-w-0 truncate text-sm">
                                                                                <span className="font-semibold">{log.performed_by || t('activity.system', 'System')}</span>{' '}
                                                                                <span className={`${getAuditActionLabelClass(log.action)} font-semibold capitalize`}>
                                                                                    {log.action}
                                                                                </span>{' '}
                                                                                <span className="text-muted-foreground">{t('activity.field', 'field')}</span>{' '}
                                                                                <span className="font-medium">{formatAuditFieldName(log.field)}</span>
                                                                            </p>
                                                                        </div>
                                                                        <div className="mt-2 ml-10 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                                            <span className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5">
                                                                                {t('activity.from', 'from')}: {formatAuditValue(log.old_value)}
                                                                            </span>
                                                                            <span className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5">
                                                                                {t('activity.to', 'to')}: {formatAuditValue(log.new_value)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="shrink-0 text-xs text-muted-foreground">
                                                                        {formatAuditTimeLabel(log.performed_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ) : null}
            </div>

            <Dialog
                open={previewDocument !== null || previewLocalDocument !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewDocument(null);
                        setPreviewLocalDocument(null);
                        setPreviewCsvRows(null);
                    }
                }}
            >
                <DialogContent className="w-[95vw] max-w-[95vw] overflow-hidden sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Document Preview</DialogTitle>
                    </DialogHeader>
                    {previewDocument || previewLocalDocument ? (
                        <div className="min-w-0 space-y-3">
                            <p className="text-sm font-medium">
                                {previewDocument?.original_name ??
                                    previewLocalDocument?.name}
                            </p>
                            <div className="max-h-[70vh] min-w-0 overflow-hidden rounded-md border bg-muted/20 p-2">
                                {previewDocument &&
                                isImageDocument(previewDocument.original_name) ? (
                                    <img
                                        src={getDocumentViewUrl(previewDocument.id)}
                                        alt={previewDocument.original_name}
                                        className="mx-auto h-auto max-w-full rounded"
                                    />
                                ) : previewDocument &&
                                  isPdfDocument(previewDocument.original_name) ? (
                                    <iframe
                                        src={getDocumentViewUrl(previewDocument.id)}
                                        title={previewDocument.original_name}
                                        className="h-[70vh] w-full rounded border-0"
                                    />
                                ) : previewDocument &&
                                  isCsvDocument(previewDocument.original_name) ? (
                                    <div className="h-[70vh] min-w-0 w-full max-w-full overflow-hidden rounded bg-white">
                                        <div className="h-full min-w-0 w-full touch-pan-x overflow-x-auto overflow-y-auto p-2">
                                            <table className="w-max min-w-full border-collapse text-xs sm:text-sm">
                                                <tbody>
                                                    {(previewCsvRows ?? []).length > 0 ? (
                                                        (previewCsvRows ?? []).map(
                                                            (row, rowIndex) => (
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
                                                            )
                                                        )
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
                                        <div className="h-full min-w-0 w-full touch-pan-x overflow-x-auto overflow-y-auto p-2">
                                            <div
                                                className="min-w-max text-xs sm:text-sm [&_table]:border-collapse [&_table]:bg-white [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_td]:align-top [&_td]:whitespace-nowrap [&_th]:border [&_th]:bg-muted/20 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold"
                                                dangerouslySetInnerHTML={{
                                                    __html: previewLocalDocument.excelHtml,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : previewLocalDocument?.csvRows ? (
                                    <div className="h-[70vh] min-w-0 w-full max-w-full overflow-hidden rounded bg-white">
                                        <div className="h-full min-w-0 w-full touch-pan-x overflow-x-auto overflow-y-auto p-2">
                                            <table className="w-max min-w-full border-collapse text-xs sm:text-sm">
                                                <tbody>
                                                    {previewLocalDocument.csvRows.length > 0 ? (
                                                        previewLocalDocument.csvRows.map(
                                                            (row, rowIndex) => (
                                                                <tr key={`local-csv-r-${rowIndex}`}>
                                                                    {row.length > 0 ? (
                                                                        row.map((cell, colIndex) => (
                                                                            <td
                                                                                key={`local-csv-c-${rowIndex}-${colIndex}`}
                                                                                className="min-w-[140px] border px-2 py-1 align-top whitespace-nowrap"
                                                                            >
                                                                                {cell}
                                                                            </td>
                                                                        ))
                                                                    ) : (
                                                                        <td className="border px-2 py-1">&nbsp;</td>
                                                                    )}
                                                                </tr>
                                                            )
                                                        )
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
                                ) : previewLocalDocument &&
                                  isImageDocument(previewLocalDocument.name) ? (
                                    <img
                                        src={previewLocalDocument.url}
                                        alt={previewLocalDocument.name}
                                        className="mx-auto h-auto max-w-full rounded"
                                    />
                                ) : previewLocalDocument &&
                                  isPdfDocument(previewLocalDocument.name) ? (
                                    <iframe
                                        src={previewLocalDocument.url}
                                        title={previewLocalDocument.name}
                                        className="h-[70vh] w-full rounded border-0"
                                    />
                                ) : (
                                    <div className="space-y-2 p-4 text-sm text-muted-foreground">
                                        <p>Preview is not available for this file type.</p>
                                        <a
                                            href={
                                                previewDocument
                                                    ? getDocumentViewUrl(
                                                          previewDocument.id
                                                      )
                                                    : previewLocalDocument?.url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary underline underline-offset-2"
                                        >
                                            Open in new tab
                                        </a>
                                    </div>
                                )}
                            </div>
                            {previewLocalDocument?.note ? (
                                <p className="text-xs text-muted-foreground">
                                    {previewLocalDocument.note}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
