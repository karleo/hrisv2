import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Building2, Briefcase, CheckCircle2, Clock, Download, Eye, KeyRound, Mail, MapPin, Phone, User } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import MultiAngleFaceProfileField, { type FaceProfileFiles } from '@/components/multi-angle-face-profile-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
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

type Employee = {
    id: number;
    employee_code: string;
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

type FaceLoginInfo = {
    enabled: boolean;
    enrolled_at: string | null;
    provider: string | null;
    angles: string[];
};

type EmployeeDocument = {
    id: number;
    name: string;
    original_name: string;
    url: string;
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

type LocalDocumentPreview = {
    name: string;
    url: string;
    html?: string;
    excelHtml?: string;
    csvRows?: string[][];
    note?: string;
};

const emptyFaceProfile = (): FaceProfileFiles => ({
    front: null,
    left: null,
    right: null,
});

const MAX_PREVIEW_PARSE_BYTES = 6 * 1024 * 1024;
const MAX_EXCEL_PREVIEW_ROWS = 120;
const MAX_EXCEL_PREVIEW_COLUMNS = 24;

export default function EmployeeProfile({
    employee,
    faceLogin,
    leaveConfig,
    hasEmployeeProfile,
}: {
    employee: Employee | null;
    faceLogin: FaceLoginInfo;
    leaveConfig: LeaveConfig;
    hasEmployeeProfile: boolean;
}) {
    const [tab, setTab] = useState<'profile' | 'security' | 'documents' | 'leave'>('profile');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Profile', href: '/my-profile' },
    ];
    const [enableFaceLogin, setEnableFaceLogin] = useState(!faceLogin.enabled);
    const [faceSaving, setFaceSaving] = useState(false);
    const [faceProfile, setFaceProfile] = useState<FaceProfileFiles>(emptyFaceProfile);
    const [previewDocument, setPreviewDocument] = useState<EmployeeDocument | null>(null);
    const [previewLocalDocument, setPreviewLocalDocument] = useState<LocalDocumentPreview | null>(null);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const { props } = usePage<{
        flash?: { success?: string; error?: string };
        errors?: Record<string, string>;
        auth?: { user?: { name?: string; email?: string } };
    }>();
    const errors = props.errors ?? {};
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const faceProfileComplete = Boolean(faceProfile.front && faceProfile.left && faceProfile.right);
    const processing = faceSaving;
    const enrolledAtLabel = faceLogin.enrolled_at ? new Date(faceLogin.enrolled_at).toLocaleString() : null;
    const enrolledAngles = faceLogin.angles.length > 0 ? faceLogin.angles.join(', ') : 'front, left, right';
    const authUserName = props.auth?.user?.name ?? '—';
    const authUserEmail = props.auth?.user?.email ?? '—';

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

            <div className="flex min-h-screen flex-col bg-muted/30 px-4 py-8 md:px-8">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                        <p className="text-muted-foreground mt-1">
                            {hasEmployeeProfile
                                ? 'View your information from Employee Master.'
                                : 'View your account profile information.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={tab === 'profile' ? 'default' : 'outline'}
                            className="rounded-lg"
                            onClick={() => setTab('profile')}
                        >
                            Profile
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={tab === 'security' ? 'default' : 'outline'}
                            className="rounded-lg"
                            onClick={() => setTab('security')}
                        >
                            Security
                        </Button>
                        {hasEmployeeProfile ? (
                            <>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={tab === 'documents' ? 'default' : 'outline'}
                                    className="rounded-lg"
                                    onClick={() => setTab('documents')}
                                >
                                    Documents
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={tab === 'leave' ? 'default' : 'outline'}
                                    className="rounded-lg"
                                    onClick={() => setTab('leave')}
                                >
                                    Leave
                                </Button>
                            </>
                        ) : null}
                    </div>

                    <div className={`grid gap-6 ${hasEmployeeProfile ? 'md:grid-cols-[220px_1fr]' : ''} ${tab === 'profile' ? '' : 'hidden'}`}>
                        {hasEmployeeProfile && employee ? (
                            <>
                                <Card>
                                    <CardContent className="flex flex-col items-center gap-3 p-6">
                                        <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                            {employee.photo_url ? (
                                                <img
                                                    src={employee.photo_url}
                                                    alt="Employee photo"
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <User className="size-10 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold">{employee.first_name} {employee.last_name}</p>
                                            <p className="text-muted-foreground text-sm">{employee.employee_code}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Employee Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Full Name</p>
                                            <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Employee Code</p>
                                            <p className="font-medium">{employee.employee_code}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Email</p>
                                            <p className="inline-flex items-center gap-2 font-medium">
                                                <Mail className="size-4 text-muted-foreground" />
                                                {employee.email_address}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Contact Number</p>
                                            <p className="inline-flex items-center gap-2 font-medium">
                                                <Phone className="size-4 text-muted-foreground" />
                                                {employee.contact_number ?? '—'}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Department</p>
                                            <p className="inline-flex items-center gap-2 font-medium">
                                                <Building2 className="size-4 text-muted-foreground" />
                                                {employee.department?.name ?? '—'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Job Position</p>
                                            <p className="inline-flex items-center gap-2 font-medium">
                                                <Briefcase className="size-4 text-muted-foreground" />
                                                {employee.job_position?.name ?? '—'}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Work Timetable</p>
                                            <p className="inline-flex items-center gap-2 font-medium">
                                                <Clock className="size-4 text-muted-foreground" />
                                                {employee.work_timetable?.name ?? '—'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Company</p>
                                            <p className="font-medium">{employee.company_profile?.company_name ?? '—'}</p>
                                        </div>

                                        <div className="space-y-1 sm:col-span-2">
                                            <p className="text-muted-foreground text-xs">Address</p>
                                            <p className="inline-flex items-center gap-2 font-medium">
                                                <MapPin className="size-4 text-muted-foreground" />
                                                {[employee.address_1, employee.address_2].filter(Boolean).join(', ') || '—'}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Phone</p>
                                            <p className="font-medium">{employee.phone ?? '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Mobile</p>
                                            <p className="font-medium">{employee.mobile ?? '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Date of Birth</p>
                                            <p className="font-medium">{employee.date_of_birth ?? '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Gender</p>
                                            <p className="font-medium">{employee.gender ?? '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Marital Status</p>
                                            <p className="font-medium">{employee.marital_status ?? '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Emergency Contact Name</p>
                                            <p className="font-medium">{employee.emergency_contact_name ?? '—'}</p>
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <p className="text-muted-foreground text-xs">Emergency Contact Phone</p>
                                            <p className="font-medium">{employee.emergency_contact_phone ?? '—'}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Account Information</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-xs">Name</p>
                                        <p className="font-medium">{authUserName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-xs">Email</p>
                                        <p className="font-medium">{authUserEmail}</p>
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <p className="text-muted-foreground text-xs">Note</p>
                                        <p className="text-muted-foreground">
                                            No employee profile is linked to this account. Security settings are available under the Security tab.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card className={tab === 'security' && hasEmployeeProfile ? '' : 'hidden'}>
                        <CardHeader>
                            <CardTitle>Account Security</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Keep your account secure by updating your password regularly.
                            </p>
                            <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                                <KeyRound className="mr-2 size-4" />
                                Change password
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className={tab === 'security' ? '' : 'hidden'}>
                        <CardHeader>
                            <CardTitle>Face Login</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className={`rounded-lg border px-3 py-2 text-sm ${
                                    faceLogin.enabled
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100'
                                        : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100'
                                }`}
                            >
                                <p className="inline-flex items-center gap-2 font-medium">
                                    <CheckCircle2 className="size-4" aria-hidden />
                                    {faceLogin.enabled ? 'Face login is enabled.' : 'Face login is disabled.'}
                                </p>
                                <p className="mt-1 text-xs opacity-90">
                                    {faceLogin.enabled
                                        ? `Angles: ${enrolledAngles}. ${
                                              faceLogin.provider ? `Provider: ${faceLogin.provider}. ` : ''
                                          }${enrolledAtLabel ? `Enrolled at: ${enrolledAtLabel}.` : ''}`
                                        : 'Enable and capture front, left, and right angles to use face login.'}
                                </p>
                            </div>

                            {props.flash?.success ? (
                                <p
                                    role="status"
                                    className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100"
                                >
                                    {props.flash.success}
                                </p>
                            ) : null}
                            {props.flash?.error ? (
                                <p
                                    role="alert"
                                    className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                                >
                                    {props.flash.error}
                                </p>
                            ) : null}

                            <div className="flex flex-wrap gap-2">
                                {!enableFaceLogin ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEnableFaceLogin(true)}
                                        disabled={processing}
                                    >
                                        Enable / Update face login
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setEnableFaceLogin(false);
                                            setFaceProfile(emptyFaceProfile());
                                        }}
                                        disabled={processing}
                                    >
                                        Cancel enrollment
                                    </Button>
                                )}

                                {faceLogin.enabled ? (
                                    <p className="text-xs text-muted-foreground">
                                        To disable face login, contact an administrator.
                                    </p>
                                ) : null}
                            </div>

                            {enableFaceLogin ? (
                                <div className="space-y-3 rounded-lg border p-3">
                                    <MultiAngleFaceProfileField
                                        value={faceProfile}
                                        onChange={setFaceProfile}
                                        disabled={processing}
                                        errors={{
                                            face_capture_front: errors.face_capture_front,
                                            face_capture_left: errors.face_capture_left,
                                            face_capture_right: errors.face_capture_right,
                                        }}
                                    />
                                    <InputError message={errors.face_capture_front} />
                                    <Button
                                        type="button"
                                        disabled={!faceProfileComplete || processing}
                                        onClick={() => {
                                            router.post('/my-profile/face-login', {
                                                forceFormData: true,
                                                face_capture_front: faceProfile.front,
                                                face_capture_left: faceProfile.left,
                                                face_capture_right: faceProfile.right,
                                            }, {
                                                onStart: () => setFaceSaving(true),
                                                onFinish: () => setFaceSaving(false),
                                                onSuccess: () => {
                                                    setEnableFaceLogin(false);
                                                    setFaceProfile(emptyFaceProfile());
                                                },
                                            });
                                        }}
                                    >
                                        Save face login
                                    </Button>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card className={tab === 'documents' && hasEmployeeProfile ? '' : 'hidden'}>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(employee?.documents?.length ?? 0) === 0 ? (
                                <p className="text-muted-foreground text-sm">No documents available.</p>
                            ) : (
                                employee?.documents?.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{doc.name}</p>
                                            <p className="text-muted-foreground truncate text-xs">{doc.original_name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
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
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card className={tab === 'leave' && hasEmployeeProfile ? '' : 'hidden'}>
                        <CardHeader>
                            <CardTitle>Leave Policy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border border-border bg-muted/20 p-4">
                                    <p className="text-xs text-muted-foreground">Opening Balance</p>
                                    <p className="mt-1 text-2xl font-semibold">
                                        {formatLeaveDays(leaveConfig.openingBalance)} days
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border bg-muted/20 p-4">
                                    <p className="text-xs text-muted-foreground">Approved Leave Used</p>
                                    <p className="mt-1 text-2xl font-semibold">
                                        {formatLeaveDays(leaveConfig.approvedDaysUsed)} days
                                    </p>
                                </div>
                                <div className="rounded-lg border border-emerald-300/50 bg-emerald-50/60 p-4 dark:border-emerald-700/50 dark:bg-emerald-950/20">
                                    <p className="text-xs text-muted-foreground">Live Remaining Balance</p>
                                    <p className="mt-1 text-2xl font-semibold">
                                        {formatLeaveDays(leaveConfig.liveRemainingBalance)} days
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold">Leave Usage</h4>
                                    <span className="text-xs text-muted-foreground">Approved requests only</span>
                                </div>
                                <div className="overflow-hidden rounded-lg border border-border">
                                    <div className="max-h-80 overflow-auto">
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
                                                        <tr key={item.id} className="border-t border-border/70">
                                                            <td className="px-3 py-2">{item.leave_type}</td>
                                                            <td className="px-3 py-2">
                                                                <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium">
                                                                    {item.leave_category === 'unpaid'
                                                                        ? 'Unpaid'
                                                                        : 'Paid'}
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
                        </CardContent>
                    </Card>
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

