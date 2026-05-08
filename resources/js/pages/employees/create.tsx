import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronDown, Eye, History, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { EmployeeEmailSignatureCard } from '@/components/employee-email-signature-card';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { useI18n } from '@/lib/i18n';
import { index } from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employees', href: index().url },
    { title: 'Create', href: '/employees/create' },
];

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

type CreateEmployeeTab =
    | 'employee_information'
    | 'work_information'
    | 'documents'
    | 'personal_information'
    | 'leave_configuration';

const createEmployeeTabOrder: CreateEmployeeTab[] = [
    'employee_information',
    'work_information',
    'documents',
    'personal_information',
    'leave_configuration',
];

const createEmployeeTabFields: Record<CreateEmployeeTab, readonly string[]> = {
    employee_information: [
        'photo',
        'employee_code',
        'first_name',
        'last_name',
        'email_address',
        'contact_number',
        'address_1',
        'address_2',
        'company_profile_id',
        'work_timetable_id',
        'department_id',
        'job_position_id',
    ],
    work_information: [
        'joining_date',
        'first_contract_date',
        'start_date',
        'end_date',
        'employee_status',
    ],
    documents: ['documents', 'document_type_ids', 'document_expiry_dates'],
    personal_information: [
        'phone',
        'mobile',
        'date_of_birth',
        'gender',
        'marital_status',
        'emergency_contact_name',
        'emergency_contact_phone',
    ],
    leave_configuration: ['leave_opening_balance'],
};

function validationErrorKeys(
    errors: Record<string, string | string[] | undefined> | undefined,
): string[] {
    if (!errors || typeof errors !== 'object') {
        return [];
    }

    return Object.keys(errors).filter((key) => {
        const value = errors[key];
        if (value === undefined || value === null) {
            return false;
        }
        if (Array.isArray(value)) {
            return value.some((item) => String(item ?? '').length > 0);
        }
        if (typeof value === 'string') {
            return value.length > 0;
        }

        return true;
    });
}

function firstCreateEmployeeTabForValidationErrors(errorKeys: string[]): CreateEmployeeTab | null {
    const roots = new Set(
        errorKeys.map((key) => {
            const dot = key.indexOf('.');

            return dot === -1 ? key : key.slice(0, dot);
        }),
    );

    if (roots.size === 0) {
        return null;
    }

    for (const tab of createEmployeeTabOrder) {
        const fields = createEmployeeTabFields[tab];
        if (fields.some((field) => roots.has(field))) {
            return tab;
        }
    }

    return null;
}

function firstCreateEmployeeFieldForValidationErrors(errorKeys: string[]): string | null {
    const roots = new Set(
        errorKeys.map((key) => {
            const dot = key.indexOf('.');

            return dot === -1 ? key : key.slice(0, dot);
        }),
    );

    for (const tab of createEmployeeTabOrder) {
        const fields = createEmployeeTabFields[tab];
        const field = fields.find((candidate) => roots.has(candidate));
        if (field) {
            return field;
        }
    }

    return errorKeys[0] ?? null;
}

function focusCreateEmployeeField(field: string | null): void {
    if (!field) {
        return;
    }

    const rootField = field.split('.', 1)[0];
    const target = document.querySelector<HTMLElement>(
        `[name="${rootField}"], [name="${rootField}[]"], #${rootField}`,
    );

    if (!target) {
        return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.focus({ preventScroll: true });
}

export default function Create({
    departments,
    jobPositions,
    companyProfiles,
    workTimetables,
    documentTypes,
    canViewActivityLogs = false,
}: {
    departments: Department[];
    jobPositions: JobPosition[];
    companyProfiles: CompanyProfile[];
    workTimetables: WorkTimetable[];
    documentTypes: DocumentType[];
    canViewActivityLogs?: boolean;
}) {
    const { t } = useI18n();
    const page = usePage<{
        errors?: Record<string, string | string[] | undefined>;
    }>();
    const pageRef = useRef(page);
    pageRef.current = page;
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [documentRows, setDocumentRows] = useState<
        Array<{
            id: string;
            file: File | null;
            documentTypeId: string;
            expiryDate: string;
            saved: boolean;
            previewUrl: string | null;
            savedFileName: string | null;
            savedDocumentTypeName: string | null;
            savedExpiryDate: string | null;
            savedFile: File | null;
        }>
    >([
        {
            id: crypto.randomUUID(),
            file: null,
            documentTypeId: '',
            expiryDate: '',
            saved: false,
            previewUrl: null,
            savedFileName: null,
            savedDocumentTypeName: null,
            savedExpiryDate: null,
            savedFile: null,
        },
    ]);
    const documentTypeNameById = Object.fromEntries(
        documentTypes.map((documentType) => [String(documentType.id), documentType.name])
    );
    const documentTypeRequiresExpiryById = Object.fromEntries(
        documentTypes.map((documentType) => [String(documentType.id), documentType.requires_expiry_date])
    );
    const [previewDocument, setPreviewDocument] = useState<{
        name: string;
        url: string;
        html?: string;
        excelRows?: string[][];
        note?: string;
    } | null>(null);
    const [signatureFirstName, setSignatureFirstName] = useState('');
    const [signatureLastName, setSignatureLastName] = useState('');
    const [signatureEmail, setSignatureEmail] = useState('');
    const [signatureMobile, setSignatureMobile] = useState('');
    const [signatureCompanyProfileId, setSignatureCompanyProfileId] = useState('');
    const [signatureJobPositionId, setSignatureJobPositionId] = useState('');
    const [joiningDate, setJoiningDate] = useState('');
    const [tab, setTab] = useState<CreateEmployeeTab>('employee_information');
    const tabOrder = createEmployeeTabOrder;
    const tabLabel: Record<CreateEmployeeTab, string> = {
        employee_information: 'Employee Information',
        work_information: 'Employement',
        documents: 'Documents',
        personal_information: 'Personal Information',
        leave_configuration: 'Leave Policy',
    };
    const selectedCompanyProfile =
        companyProfiles.find(
            (profile) => String(profile.id) === signatureCompanyProfileId
        ) ?? null;
    const employeeDesignation =
        jobPositions.find(
            (jobPosition) => String(jobPosition.id) === signatureJobPositionId
        )?.name ?? '';

    function showFirstValidationError(errorKeys: string[]): void {
        if (errorKeys.length === 0) {
            return;
        }

        const nextTab =
            firstCreateEmployeeTabForValidationErrors(errorKeys) ??
            'employee_information';
        const field = firstCreateEmployeeFieldForValidationErrors(errorKeys);
        setTab(nextTab);
        window.setTimeout(() => {
            focusCreateEmployeeField(field);
        }, 0);
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Photo size must be 5 MB or less.');
                e.target.value = '';
                setPhotoPreview(null);
                return;
            }
            setPhotoPreview(URL.createObjectURL(file));
        } else {
            setPhotoPreview(null);
        }
    }

    function addDocumentRow() {
        setDocumentRows((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                file: null,
                documentTypeId: '',
                expiryDate: '',
                saved: false,
                previewUrl: null,
                savedFileName: null,
                savedDocumentTypeName: null,
                savedExpiryDate: null,
                savedFile: null,
            },
        ]);
    }

    function removeDocumentRow(id: string) {
        setDocumentRows((prev) => {
            if (prev.length <= 1) {
                return [
                    {
                        ...prev[0],
                        file: null,
                        documentTypeId: '',
                        expiryDate: '',
                        saved: false,
                        previewUrl: null,
                        savedFileName: null,
                        savedDocumentTypeName: null,
                        savedExpiryDate: null,
                        savedFile: null,
                    },
                ];
            }
            return prev.filter((row) => row.id !== id);
        });
    }

    function setRowDocumentTypeId(id: string, value: string) {
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

    function setRowExpiryDate(id: string, value: string) {
        setDocumentRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, expiryDate: value } : row
            )
        );
    }

    function setRowFile(id: string, file: File | null) {
        setDocumentRows((prev) =>
            prev.map((row) =>
                row.id === id
                    ? {
                          ...row,
                          file,
                          saved: false,
                          previewUrl: file ? URL.createObjectURL(file) : null,
                          savedFileName: file ? file.name : null,
                          savedDocumentTypeName: file
                              ? (documentTypeNameById[row.documentTypeId] ?? null)
                              : null,
                          savedExpiryDate: file
                              ? row.expiryDate || null
                              : null,
                          savedFile: file,
                      }
                    : row
            )
        );
    }

    function saveDocumentsLocally() {
        if (!documentRows.some((row) => row.file)) {
            return;
        }
        setDocumentRows((prev) =>
            prev.map((row) =>
                row.file
                    ? {
                          ...row,
                          saved: true,
                          savedFileName: row.file.name,
                          savedDocumentTypeName:
                              documentTypeNameById[row.documentTypeId] ?? null,
                          savedExpiryDate: row.expiryDate || null,
                          savedFile: row.file,
                          file: null,
                      }
                    : row
            )
        );
    }

    function isImageFile(name: string) {
        return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
    }

    function isPdfFile(name: string) {
        return /\.pdf$/i.test(name);
    }

    function isOfficeFile(name: string) {
        return /\.(doc|docx|xls|xlsx)$/i.test(name);
    }


    async function openDocumentPreview(row: (typeof documentRows)[number]) {
        if (!row.previewUrl) {
            return;
        }

        const name = row.savedFileName ?? row.file?.name ?? 'Document';
        const basePreview = { name, url: row.previewUrl };
        const fileForParsing = row.savedFile ?? row.file;

        if (!fileForParsing || (!isOfficeFile(name) && !isPdfFile(name) && !isImageFile(name))) {
            setPreviewDocument(basePreview);
            return;
        }

        try {
            if (/\.docx?$/i.test(name)) {
                const mammoth = await import('mammoth');
                const arrayBuffer = await fileForParsing.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setPreviewDocument({
                    ...basePreview,
                    html: result.value,
                    note: 'Rendered from uploaded Word file.',
                });
                return;
            }

            if (/\.xlsx?$/i.test(name)) {
                const XLSX = await import('xlsx');
                const arrayBuffer = await fileForParsing.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                if (!firstSheetName) {
                    setPreviewDocument({
                        ...basePreview,
                        note: 'Excel file has no sheets.',
                    });
                    return;
                }
                const sheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
                    header: 1,
                    raw: false,
                });
                const excelRows = rows.map((r) => r.map((cell) => (cell ?? '').toString()));
                setPreviewDocument({
                    ...basePreview,
                    excelRows,
                    note: `Rendered from sheet: ${firstSheetName}`,
                });
                return;
            }
        } catch {
            setPreviewDocument({
                ...basePreview,
                note: 'Could not render this file. You can still download and open it.',
            });
            return;
        }

        setPreviewDocument(basePreview);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    Back to Employees
                </Link>

                <Form
                    id="employee-create-form"
                    {...EmployeeController.store.form()}
                    noValidate
                    className="flex flex-1 flex-col gap-8"
                    encType="multipart/form-data"
                    options={{
                        preserveScroll: true,
                        onError: (validationErrors) => {
                            showFirstValidationError(
                                validationErrorKeys(validationErrors),
                            );
                        },
                        onFinish: () => {
                            window.setTimeout(() => {
                                if (!isMountedRef.current) {
                                    return;
                                }
                                const keys = validationErrorKeys(
                                    pageRef.current.props.errors,
                                );
                                if (keys.length === 0) {
                                    return;
                                }
                                showFirstValidationError(keys);
                            }, 0);
                        },
                    }}
                >
                    {({ processing, errors }) => (
                        <>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                            <div className="min-w-0 flex-1 [&_header]:mb-0">
                                <Heading
                                    title="Create Employee"
                                    description="Add a new employee to the master list"
                                />
                            </div>
                            <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:max-w-none lg:shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={tab === 'employee_information'}
                                    onClick={() => {
                                        const current = tabOrder.indexOf(tab);
                                        if (current > 0) {
                                            setTab(tabOrder[current - 1]);
                                        }
                                    }}
                                >
                                    Previous
                                </Button>
                                {tab !== 'leave_configuration' && (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const current = tabOrder.indexOf(tab);
                                            if (current < tabOrder.length - 1) {
                                                setTab(tabOrder[current + 1]);
                                            }
                                        }}
                                    >
                                        Next
                                    </Button>
                                )}
                                {tab === 'leave_configuration' && (
                                    <Button disabled={processing} type="submit">
                                        Create Employee
                                    </Button>
                                )}
                                <Link href={index()}>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="min-w-[7.5rem]"
                                    >
                                        Discard
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {tabOrder.map((item, index) => (
                                    <Button
                                        key={item}
                                        type="button"
                                        variant={tab === item ? 'default' : 'outline'}
                                        onClick={() => setTab(item)}
                                        className="gap-2"
                                    >
                                        <span className="inline-flex size-5 items-center justify-center rounded-full border border-current/30 text-xs">
                                            {index + 1}
                                        </span>
                                        {tabLabel[item]}
                                    </Button>
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Step {tabOrder.indexOf(tab) + 1} of {tabOrder.length}:{' '}
                                {tabLabel[tab]}
                            </p>
                        </div>

                        <div className="grid flex-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
                            {/* Left column: Photo + Documents */}
                            <div className="flex flex-col gap-6">
                                {/* Employee photo */}
                                <Card className="lg:sticky lg:top-6">
                                    <CardHeader>
                                        <CardTitle>Employee Photo</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative flex aspect-square w-full max-w-[210px] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 transition-colors hover:border-primary/35">
                                            {photoPreview ? (
                                                <img
                                                    src={photoPreview}
                                                    alt="Preview"
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
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full max-w-[210px]"
                                            onClick={() =>
                                                photoInputRef.current?.click()
                                            }
                                        >
                                            {photoPreview
                                                ? 'Change photo'
                                                : 'Upload photo'}
                                        </Button>
                                        <InputError message={errors.photo} />
                                    </div>
                                    </CardContent>
                                </Card>

                            </div>

                            {/* Right column: Form fields */}
                            <Card className={tab === 'employee_information' ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle>Employee Information</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Enter basic details, contact information, and organization assignment.
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="employee_code">
                                            Employee Code <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="employee_code"
                                            name="employee_code"
                                            required
                                            maxLength={50}
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
                                                First Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                required
                                                maxLength={255}
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
                                                Last Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="last_name"
                                                name="last_name"
                                                required
                                                maxLength={255}
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
                                                Email Address <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="email_address"
                                                name="email_address"
                                                type="email"
                                                required
                                                maxLength={255}
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
                                                Contact Number <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="contact_number"
                                                name="contact_number"
                                                required
                                                maxLength={50}
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
                                            placeholder="Street address"
                                        />
                                        <InputError message={errors.address_1} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="address_2">
                                            Address 2
                                        </Label>
                                        <Input
                                            id="address_2"
                                            name="address_2"
                                            maxLength={255}
                                            placeholder="Apt, suite, etc. (optional)"
                                        />
                                        <InputError message={errors.address_2} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="company_profile_id">
                                                Company Profile
                                            </Label>
                                            <select
                                                id="company_profile_id"
                                                name="company_profile_id"
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
                                                Work timetable{' '}
                                                <span className="text-destructive">*</span>
                                            </Label>
                                            <select
                                                id="work_timetable_id"
                                                name="work_timetable_id"
                                                required
                                                defaultValue={
                                                    workTimetables[0]?.id ?? ''
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
                                                Master weekly template (Settings → Work timetables).
                                                Late / early and overtime are computed from this tag.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="department_id">
                                                Department <span className="text-destructive">*</span>
                                            </Label>
                                            <select
                                                id="department_id"
                                                name="department_id"
                                                required
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
                                                Job Position <span className="text-destructive">*</span>
                                            </Label>
                                            <select
                                                id="job_position_id"
                                                name="job_position_id"
                                                required
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

                                </CardContent>
                            </Card>

                            <Card className={tab === 'work_information' ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle>Employement</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Capture key employment timeline dates.
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-6">
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
                                            />
                                            <InputError
                                                message={errors.end_date}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 md:max-w-sm">
                                        <Label htmlFor="employee_status">
                                            Employee Status
                                        </Label>
                                        <select
                                            id="employee_status"
                                            name="employee_status"
                                            defaultValue="Employed"
                                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {employeeStatuses.map((status) => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.employee_status} />
                                    </div>

                                    <EmployeeEmailSignatureCard
                                        fullName={`${signatureFirstName} ${signatureLastName}`.trim()}
                                        designation={employeeDesignation}
                                        email={signatureEmail}
                                        phone={signatureMobile}
                                        companyProfile={selectedCompanyProfile}
                                    />
                                </CardContent>
                            </Card>

                            <Card className={tab === 'documents' ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle>Documents</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Upload multiple documents (e.g. ID, contract). Max 10 MB each.
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mb-3"
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
                                                    {!row.saved && (
                                                        <div className="grid gap-2 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
                                                            <div className="grid gap-1.5">
                                                                <Label
                                                                    htmlFor={`document_type_${i}`}
                                                                    className="text-xs"
                                                                >
                                                                    Document type
                                                                </Label>
                                                                <select
                                                                    id={`document_type_${i}`}
                                                                    name="document_type_ids[]"
                                                                    value={row.documentTypeId}
                                                                    onChange={(e) =>
                                                                        setRowDocumentTypeId(
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
                                                                    key={`${row.id}-${row.saved ? 'saved' : 'edit'}-${row.previewUrl ?? 'none'}`}
                                                                    type="file"
                                                                    name="documents[]"
                                                                    onChange={(e) =>
                                                                        setRowFile(
                                                                            row.id,
                                                                            e.target.files?.[0] ?? null
                                                                        )
                                                                    }
                                                                    className="h-8 text-sm"
                                                                />
                                                            </div>
                                                            <div className="grid gap-1.5">
                                                                <Label
                                                                    htmlFor={`document_expiry_${i}`}
                                                                    className="text-xs"
                                                                >
                                                                    Expiry Date
                                                                </Label>
                                                                <Input
                                                                    id={`document_expiry_${i}`}
                                                                    type="date"
                                                                    name="document_expiry_dates[]"
                                                                    value={row.expiryDate}
                                                                    onChange={(e) =>
                                                                        setRowExpiryDate(
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
                                                                onClick={() => removeDocumentRow(row.id)}
                                                            >
                                                                <X className="size-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {(row.file || row.savedFileName) ? (
                                                        <div className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background px-2 py-1.5">
                                                            <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        Document type
                                                                    </p>
                                                                    <p className="truncate text-xs font-medium text-foreground">
                                                                        {row.savedDocumentTypeName ??
                                                                            documentTypeNameById[
                                                                                row.documentTypeId
                                                                            ] ??
                                                                            'Not selected'}
                                                                    </p>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        File
                                                                    </p>
                                                                    <p className="truncate text-xs font-medium text-foreground">
                                                                        {row.savedFileName ??
                                                                            row.file?.name}
                                                                    </p>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        Expiry Date
                                                                    </p>
                                                                    <p className="truncate text-xs font-medium text-foreground">
                                                                        {row.savedExpiryDate || '-'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {row.saved && row.previewUrl ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-7"
                                                                        onClick={() =>
                                                                            void openDocumentPreview(
                                                                                row
                                                                            )
                                                                        }
                                                                    >
                                                                        <Eye className="size-4" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-7 text-destructive hover:text-destructive"
                                                                        onClick={() =>
                                                                            removeDocumentRow(row.id)
                                                                        }
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    Click Save to confirm this line
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <InputError
                                        message={
                                            errors.documents ??
                                            errors['documents.0'] ??
                                            errors['document_type_ids.0'] ??
                                            errors['document_expiry_dates.0']
                                        }
                                    />
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            type="button"
                                            disabled={processing}
                                            onClick={saveDocumentsLocally}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={tab === 'personal_information' ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" name="phone" maxLength={50} placeholder="e.g. +971 50 123 4567" />
                                            <InputError message={errors.phone} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="mobile">Mobile</Label>
                                            <Input id="mobile" name="mobile" maxLength={50} placeholder="e.g. +971 50 123 4567" />
                                            <InputError message={errors.mobile} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="date_of_birth">Date of Birth</Label>
                                            <Input id="date_of_birth" name="date_of_birth" type="date" />
                                            <InputError message={errors.date_of_birth} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="gender">Gender</Label>
                                            <select
                                                id="gender"
                                                name="gender"
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
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
                                            <select
                                                id="marital_status"
                                                name="marital_status"
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">Select</option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <InputError message={errors.marital_status} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                                            <Input id="emergency_contact_name" name="emergency_contact_name" maxLength={255} />
                                            <InputError message={errors.emergency_contact_name} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 md:max-w-sm">
                                        <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                                        <Input id="emergency_contact_phone" name="emergency_contact_phone" maxLength={50} />
                                        <InputError message={errors.emergency_contact_phone} />
                                    </div>

                                </CardContent>
                            </Card>

                            <Card className={tab === 'leave_configuration' ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle>Leave Policy</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Set the employee opening leave balance. Remaining balance is calculated automatically after leave approvals.
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2 md:max-w-sm">
                                        <Label htmlFor="leave_opening_balance">
                                            Opening Balance (days)
                                        </Label>
                                        <Input
                                            id="leave_opening_balance"
                                            name="leave_opening_balance"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            defaultValue="0"
                                            placeholder="0.00"
                                        />
                                        <InputError message={errors.leave_opening_balance} />
                                        <p className="text-xs text-muted-foreground">
                                            Example: 21.5 means 21.5 days available as opening balance.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Complete each step, then click Create Employee.
                        </p>
                        <Dialog
                            open={previewDocument !== null}
                            onOpenChange={(open) =>
                                !open && setPreviewDocument(null)
                            }
                        >
                            <DialogContent className="sm:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Document Preview</DialogTitle>
                                </DialogHeader>
                                {previewDocument ? (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium">
                                            {previewDocument.name}
                                        </p>
                                        <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted/20 p-2">
                                            {isImageFile(previewDocument.name) ? (
                                                <img
                                                    src={previewDocument.url}
                                                    alt={previewDocument.name}
                                                    className="mx-auto h-auto max-w-full rounded"
                                                />
                                            ) : isPdfFile(
                                                  previewDocument.name
                                              ) ? (
                                                <iframe
                                                    src={previewDocument.url}
                                                    title={previewDocument.name}
                                                    className="h-[70vh] w-full rounded border-0"
                                                />
                                            ) : previewDocument.html ? (
                                                <div className="prose prose-sm max-w-none rounded bg-white p-4 dark:prose-invert">
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: previewDocument.html,
                                                        }}
                                                    />
                                                </div>
                                            ) : previewDocument.excelRows ? (
                                                <div className="overflow-auto rounded bg-white p-2">
                                                    <table className="min-w-full border-collapse text-sm">
                                                        <tbody>
                                                            {previewDocument.excelRows.length > 0 ? (
                                                                previewDocument.excelRows.map(
                                                                    (row, rowIndex) => (
                                                                        <tr key={`r-${rowIndex}`}>
                                                                            {row.length > 0 ? (
                                                                                row.map((cell, colIndex) => (
                                                                                    <td
                                                                                        key={`c-${rowIndex}-${colIndex}`}
                                                                                        className="border px-2 py-1 align-top"
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
                                                                        No data to preview.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 p-4 text-sm text-muted-foreground">
                                                    {isOfficeFile(
                                                        previewDocument.name
                                                    ) ? (
                                                        <p>
                                                            Word/Excel preview
                                                            is not available
                                                            before upload.
                                                            Download and open
                                                            the file to review
                                                            it.
                                                        </p>
                                                    ) : (
                                                        <p>
                                                            Preview is not
                                                            available for this
                                                            file type.
                                                        </p>
                                                    )}
                                                    <a
                                                        href={
                                                            previewDocument.url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary underline underline-offset-2"
                                                        download={
                                                            previewDocument.name
                                                        }
                                                    >
                                                        Download file
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        {previewDocument.note ? (
                                            <p className="text-xs text-muted-foreground">
                                                {previewDocument.note}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                            </DialogContent>
                        </Dialog>
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
                                                        0 {t('activity.entries', 'entries')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('activity.description.employeeTimeline', 'Timeline of employee profile changes.')}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="border-t border-border/70 px-5 pb-5 pt-4">
                                        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center">
                                            <p className="text-sm font-medium">{t('activity.emptyTitle', 'No activity captured yet')}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {t(
                                                    'activity.emptyDescription.employeeCreate',
                                                    'Activity history will appear here once this employee is created and updated.',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ) : null}
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
