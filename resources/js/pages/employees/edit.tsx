import { Head, Link, router, usePage } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft, Eye, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { edit, index } from '@/routes/employees';
import documents from '@/routes/employees/documents';
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

type EmployeeDocument = {
    id: number;
    name: string;
    original_name: string;
    path: string;
    url: string;
};

type WorkTimetable = {
    id: number;
    name: string;
};

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
    work_timetable?: WorkTimetable | null;
    joining_date?: string | null;
    first_contract_date?: string | null;
    phone?: string | null;
    mobile?: string | null;
    date_of_birth?: string | null;
    gender?: 'Male' | 'Female' | 'Other' | null;
    marital_status?: 'Single' | 'Married' | 'Other' | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
};

export default function Edit({
    employee,
    departments,
    jobPositions,
    companyProfiles,
    workTimetables,
    employeeLoginActive = null,
    viewMode = false,
}: {
    employee: Employee;
    departments: Department[];
    jobPositions: JobPosition[];
    companyProfiles: CompanyProfile[];
    workTimetables: WorkTimetable[];
    employeeLoginActive?: boolean | null;
    viewMode?: boolean;
}) {
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        employee.photo_url ?? null
    );
    const [documentFiles, setDocumentFiles] = useState<Array<File | null>>([]);
    const [documentLabels, setDocumentLabels] = useState<string[]>([]);
    const [documentRows, setDocumentRows] = useState<
        Array<{ id: string; label: string; expiryDate: string }>
    >([{ id: crypto.randomUUID(), label: '', expiryDate: '' }]);
    const [previewDocument, setPreviewDocument] = useState<EmployeeDocument | null>(null);
    const [previewLocalDocument, setPreviewLocalDocument] = useState<{
        name: string;
        url: string;
        html?: string;
        excelRows?: string[][];
        csvRows?: string[][];
        note?: string;
    } | null>(null);
    const [previewCsvRows, setPreviewCsvRows] = useState<string[][] | null>(null);
    const [joiningDate, setJoiningDate] = useState(employee.joining_date ?? '');
    const page = usePage();
    const query = (page.props as { ziggy?: { query?: { tab?: string } } }).ziggy?.query;
    const tabFromQuery = query?.tab;
    const readOnlyView = viewMode;
    const hasLinkedUser = employee.user_id !== null;
    const initialTab: 'employee_information' | 'work_information' | 'private_information' | 'documents' =
        tabFromQuery === 'documents' ||
        tabFromQuery === 'private_information' ||
        tabFromQuery === 'work_information' ||
        tabFromQuery === 'employee_information'
            ? tabFromQuery
            : 'employee_information';
    const [tab, setTab] = useState<'employee_information' | 'work_information' | 'private_information' | 'documents'>(initialTab);
    const employeeDesignation =
        jobPositions.find((job) => job.id === employee.job_position_id)?.name ??
        '';
    const employeeCompanyProfile =
        companyProfiles.find(
            (profile) => profile.id === employee.company_profile_id
        )?.company_name ?? '';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employees', href: index().url },
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

    function setDocumentLabelAt(index: number, value: string) {
        setDocumentLabels((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }

    function addDocumentRow() {
        setDocumentRows((prev) => [
            ...prev,
            { id: crypto.randomUUID(), label: '', expiryDate: '' },
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
            const nextLabels = [...documentLabels];
            nextFiles.splice(idx, 1);
            nextLabels.splice(idx, 1);
            setDocumentFiles(nextFiles);
            setDocumentLabels(nextLabels);
            return nextRows.length > 0
                ? nextRows
                : [{ id: crypto.randomUUID(), label: '', expiryDate: '' }];
        });
    }

    function setDocumentRowLabel(id: string, value: string) {
        setDocumentRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, label: value } : row
            )
        );
        const idx = documentRows.findIndex((row) => row.id === id);
        if (idx >= 0) {
            setDocumentLabelAt(idx, value);
        }
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
        if (file) {
            const defaultLabel =
                documentRows[idx]?.label.trim() ||
                file.name.replace(/\.[^/.]+$/, '') ||
                file.name;
            setDocumentLabelAt(idx, defaultLabel);
            setDocumentRows((prev) =>
                prev.map((row, rowIdx) =>
                    rowIdx === idx ? { ...row, label: defaultLabel } : row
                )
            );
        }
    }

    function deleteDocument(doc: EmployeeDocument) {
        if (confirm(`Remove "${doc.original_name}"?`)) {
            router.delete(
                documents.destroy.url({
                    employee: employee.id,
                    employee_document: doc.id,
                })
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
        return /\.(doc|docx|xls|xlsx)$/i.test(fileName);
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

            if (/\.xlsx?$/i.test(file.name)) {
                const XLSX = await import('xlsx');
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const sheet = firstSheetName
                    ? workbook.Sheets[firstSheetName]
                    : null;
                const rows = sheet
                    ? XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
                          header: 1,
                          raw: false,
                      })
                    : [];
                setPreviewLocalDocument({
                    ...basePreview,
                    excelRows: rows.map((r) =>
                        r.map((cell) => (cell ?? '').toString())
                    ),
                    note: firstSheetName
                        ? `Rendered from sheet: ${firstSheetName}`
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
                    Back to Employees
                </Link>

                <Heading
                    title={readOnlyView ? 'View Employee' : 'Edit Employee'}
                    description={readOnlyView ? 'View employee details' : 'Update employee details'}
                />

                {readOnlyView ? (
                    <div className="flex justify-end">
                        <Link
                            href={`${edit({ employee: employee.id }).url}?tab=${tab}`}
                        >
                            <Button type="button">Edit</Button>
                        </Link>
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
                </div>

                {tab !== 'private_information' ? (
                    <Form
                        {...EmployeeController.update.form(employee.id)}
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
                        {({ processing, errors }) => (
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
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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

                                    {!readOnlyView ? (
                                        <div className="flex gap-4 pt-4 border-t">
                                            <Button
                                                disabled={processing}
                                                type="submit"
                                            >
                                                Save
                                            </Button>
                                            <Link href={index()}>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                >
                                                    Cancel
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : null}
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

                                    <div className="grid gap-2 md:max-w-sm">
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
                                            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                                    {!readOnlyView ? (
                                        <div className="flex gap-4 pt-4 border-t">
                                            <Button
                                                disabled={processing}
                                                type="submit"
                                            >
                                                Save
                                            </Button>
                                            <Link href={index()}>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                >
                                                    Cancel
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : null}
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
                                    <div className="space-y-2">
                                        {employee.documents?.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background px-2 py-1.5"
                                            >
                                                <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-3">
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Document type
                                                        </p>
                                                        <p className="truncate text-xs font-medium text-foreground">
                                                            {doc.name}
                                                        </p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] text-muted-foreground">
                                                            File
                                                        </p>
                                                        <p className="truncate text-xs font-medium text-foreground">
                                                            {doc.original_name}
                                                        </p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Expiry Date
                                                        </p>
                                                        <p className="truncate text-xs font-medium text-foreground">
                                                            -
                                                        </p>
                                                    </div>
                                                </div>
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
                                        ))}
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
                                                                <Input
                                                                    name="document_labels[]"
                                                                    value={row.label}
                                                                    onChange={(e) =>
                                                                        setDocumentRowLabel(
                                                                            row.id,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    placeholder="e.g. Employment Contract"
                                                                    maxLength={255}
                                                                    className="h-8 text-sm"
                                                                />
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
                                        errors['document_labels.0']
                                    }
                                />
                                {!readOnlyView ? (
                                    <div className="mt-4 flex gap-4 border-t pt-4">
                                        <Button
                                            disabled={processing}
                                            type="submit"
                                        >
                                            Save
                                        </Button>
                                        <Link href={index()}>
                                            <Button
                                                type="button"
                                                variant="outline"
                                            >
                                                Cancel
                                            </Button>
                                        </Link>
                                    </div>
                                ) : null}
                            </div>
                            </div>
                        )}
                    </Form>
                ) : null}

                {tab === 'private_information' ? (
                    <Form
                        action={`/employees/${employee.id}/private-information`}
                        method="patch"
                        className="grid flex-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start"
                    >
                        {({ processing, errors }) => (
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
                                        <select id="gender" name="gender" defaultValue={employee.gender ?? ''} className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <InputError message={errors.gender} />
                                    </div>
                                </div>

                                <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="marital_status">Marital Status</Label>
                                        <select id="marital_status" name="marital_status" defaultValue={employee.marital_status ?? ''} className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50">
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

                                <div className="grid gap-2">
                                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                                    <Input id="emergency_contact_phone" name="emergency_contact_phone" maxLength={50} defaultValue={employee.emergency_contact_phone ?? ''} />
                                    <InputError message={errors.emergency_contact_phone} />
                                </div>

                                {!readOnlyView ? (
                                    <div className="flex gap-4 pt-4 border-t">
                                        <Button disabled={processing} type="submit">Update</Button>
                                        <Link href={index()}>
                                            <Button type="button" variant="outline">Cancel</Button>
                                        </Link>
                                    </div>
                                ) : null}
                            </fieldset>
                            </div>
                            </>
                        )}
                    </Form>
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
                <DialogContent className="w-[95vw] sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Document Preview</DialogTitle>
                    </DialogHeader>
                    {previewDocument || previewLocalDocument ? (
                        <div className="space-y-3">
                            <p className="text-sm font-medium">
                                {previewDocument?.original_name ??
                                    previewLocalDocument?.name}
                            </p>
                            <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted/20 p-2">
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
                                    <div className="overflow-auto rounded bg-white p-2">
                                        <table className="min-w-full border-collapse text-sm">
                                            <tbody>
                                                {(previewCsvRows ?? []).length > 0 ? (
                                                    (previewCsvRows ?? []).map(
                                                        (row, rowIndex) => (
                                                            <tr key={`csv-r-${rowIndex}`}>
                                                                {row.length > 0 ? (
                                                                    row.map((cell, colIndex) => (
                                                                        <td
                                                                            key={`csv-c-${rowIndex}-${colIndex}`}
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
                                                            No CSV data to preview.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : previewLocalDocument?.html ? (
                                    <div className="prose prose-sm max-w-none rounded bg-white p-4 dark:prose-invert">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: previewLocalDocument.html,
                                            }}
                                        />
                                    </div>
                                ) : previewLocalDocument?.excelRows ? (
                                    <div className="overflow-auto rounded bg-white p-2">
                                        <table className="min-w-full border-collapse text-sm">
                                            <tbody>
                                                {previewLocalDocument.excelRows.length > 0 ? (
                                                    previewLocalDocument.excelRows.map(
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
                                ) : previewLocalDocument?.csvRows ? (
                                    <div className="overflow-auto rounded bg-white p-2">
                                        <table className="min-w-full border-collapse text-sm">
                                            <tbody>
                                                {previewLocalDocument.csvRows.length > 0 ? (
                                                    previewLocalDocument.csvRows.map(
                                                        (row, rowIndex) => (
                                                            <tr key={`local-csv-r-${rowIndex}`}>
                                                                {row.length > 0 ? (
                                                                    row.map((cell, colIndex) => (
                                                                        <td
                                                                            key={`local-csv-c-${rowIndex}-${colIndex}`}
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
                                                            No CSV data to preview.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
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
