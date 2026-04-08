import { Head, Link, router, usePage } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft, Eye, FileStack, ImagePlus, Trash2, X } from 'lucide-react';
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
    viewMode = false,
}: {
    employee: Employee;
    departments: Department[];
    jobPositions: JobPosition[];
    companyProfiles: CompanyProfile[];
    workTimetables: WorkTimetable[];
    viewMode?: boolean;
}) {
    const photoInputRef = useRef<HTMLInputElement>(null);
    const documentsInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        employee.photo_url ?? null
    );
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);
    const [documentLabels, setDocumentLabels] = useState<string[]>([]);
    const [previewDocument, setPreviewDocument] = useState<EmployeeDocument | null>(null);
    const page = usePage();
    const query = (page.props as { ziggy?: { query?: { tab?: string } } }).ziggy?.query;
    const tabFromQuery = query?.tab;
    const readOnlyView = viewMode;
    const initialTab: 'employee_information' | 'private_information' | 'documents' =
        tabFromQuery === 'documents' || tabFromQuery === 'private_information' || tabFromQuery === 'employee_information'
            ? tabFromQuery
            : 'employee_information';
    const [tab, setTab] = useState<'employee_information' | 'private_information' | 'documents'>(initialTab);

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
            setPhotoPreview(URL.createObjectURL(file));
        } else {
            setPhotoPreview(employee.photo_url ?? null);
        }
    }

    function handleDocumentsChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        setDocumentFiles(files);
        setDocumentLabels(
            files.map((f) => f.name.replace(/\.[^/.]+$/, '') || f.name)
        );
    }

    function clearNewDocuments() {
        setDocumentFiles([]);
        setDocumentLabels([]);
        if (documentsInputRef.current) {
            documentsInputRef.current.value = '';
        }
    }

    function setDocumentLabelAt(index: number, value: string) {
        setDocumentLabels((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`Edit ${employee.first_name} ${employee.last_name}`}
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
                    title="Edit Employee"
                    description={readOnlyView ? 'View employee details' : 'Update employee details'}
                />

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
                    >
                        {({ processing, errors }) => (
                            <div className="grid flex-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
                            {/* Left column: Photo + Documents */}
                            <div className="flex flex-col gap-6">
                                {/* Employee photo */}
                                <div className={`rounded-xl border border-border bg-card p-6 shadow-sm ${tab === 'employee_information' ? '' : 'hidden'}`}>
                                    <Label className="mb-3 block text-base font-medium">
                                        Employee Photo
                                    </Label>
                                    <div className="flex flex-col items-start gap-4">
                                        <div className="relative flex size-40 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
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
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
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
                                </div>

                                {/* Documents */}
                                <div className={`rounded-xl border border-border bg-card p-6 shadow-sm ${tab === 'documents' ? '' : 'hidden'}`}>
                                    <Label className="mb-3 block text-base font-medium">
                                        Documents
                                    </Label>
                                    <p className="mb-3 text-sm text-muted-foreground">
                                        Add more documents with a label, or
                                        remove existing. Max 10 MB each.
                                    </p>
                                    <input
                                        ref={documentsInputRef}
                                        type="file"
                                        name="documents[]"
                                        multiple
                                        className="sr-only"
                                        onChange={handleDocumentsChange}
                                    />
                                    <input type="hidden" name="tab" value="documents" />
                                    {!readOnlyView ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mb-3"
                                            onClick={() =>
                                                documentsInputRef.current?.click()
                                            }
                                        >
                                            <FileStack className="mr-2 size-4" />
                                            Add files
                                        </Button>
                                    ) : null}
                                    {(employee.documents?.length > 0 ||
                                        documentFiles.length > 0) && (
                                        <div className="space-y-2">
                                            {employee.documents?.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            {doc.name}
                                                        </p>
                                                        <a
                                                            href={getDocumentViewUrl(doc.id)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="truncate text-primary underline underline-offset-2 hover:no-underline"
                                                        >
                                                            {doc.original_name}
                                                        </a>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 shrink-0"
                                                        onClick={() => setPreviewDocument(doc)}
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
                                            {documentFiles.map((file, i) => (
                                                <div
                                                    key={`new-${i}`}
                                                    className="space-y-2 rounded-md border border-dashed border-border bg-muted/20 p-3"
                                                >
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {file.name} (new)
                                                    </p>
                                                    <div className="grid gap-1.5">
                                                        <Label
                                                            htmlFor={`new_document_label_${i}`}
                                                            className="text-xs"
                                                        >
                                                            Label
                                                        </Label>
                                                        <Input
                                                            id={`new_document_label_${i}`}
                                                            name={`document_labels[${i}]`}
                                                            value={
                                                                documentLabels[i] ?? ''
                                                            }
                                                            onChange={(e) =>
                                                                setDocumentLabelAt(
                                                                    i,
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="e.g. Employment Contract"
                                                            maxLength={255}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {!readOnlyView && documentFiles.length > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={clearNewDocuments}
                                                >
                                                    <X className="mr-1 size-4" />
                                                    Clear new files
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    <InputError
                                        message={
                                            errors.documents ??
                                            errors['documents.0'] ??
                                            errors['document_labels.0']
                                        }
                                    />
                                    {!readOnlyView ? (
                                        <div className="flex gap-4 pt-4 border-t mt-4">
                                            <Button
                                                disabled={processing}
                                                type="submit"
                                            >
                                                Upload Documents
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

                            {/* Right column: Form fields */}
                            <div className={`rounded-xl border border-border bg-card p-6 shadow-sm ${tab === 'employee_information' ? '' : 'hidden'}`}>
                                <div className="space-y-6">
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

                                    <div className="grid grid-cols-2 gap-4">
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
                                                    {dept.code} — {dept.name}
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
                                                    {job.code} — {job.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.job_position_id}
                                        />
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

                                    {!readOnlyView ? (
                                        <div className="flex gap-4 pt-4 border-t">
                                            <Button
                                                disabled={processing}
                                                type="submit"
                                            >
                                                Update Employee
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
                            </div>
                        )}
                    </Form>
                ) : null}

                {tab === 'private_information' ? (
                    <Form
                        action={`/employees/${employee.id}/private-information`}
                        method="patch"
                        className="rounded-xl border border-border bg-card p-6 shadow-sm"
                    >
                        {({ processing, errors }) => (
                            <div className="space-y-6">
                                <input type="hidden" name="tab" value="private_information" />
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
                            </div>
                        )}
                    </Form>
                ) : null}
            </div>

            <Dialog open={previewDocument !== null} onOpenChange={(open) => !open && setPreviewDocument(null)}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Document Preview</DialogTitle>
                    </DialogHeader>
                    {previewDocument ? (
                        <div className="space-y-3">
                            <p className="text-sm font-medium">{previewDocument.original_name}</p>
                            <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted/20 p-2">
                                {isImageDocument(previewDocument.original_name) ? (
                                    <img
                                        src={getDocumentViewUrl(previewDocument.id)}
                                        alt={previewDocument.original_name}
                                        className="mx-auto h-auto max-w-full rounded"
                                    />
                                ) : isPdfDocument(previewDocument.original_name) ? (
                                    <iframe
                                        src={getDocumentViewUrl(previewDocument.id)}
                                        title={previewDocument.original_name}
                                        className="h-[70vh] w-full rounded border-0"
                                    />
                                ) : (
                                    <div className="space-y-2 p-4 text-sm text-muted-foreground">
                                        <p>Preview is not available for this file type.</p>
                                        <a
                                            href={getDocumentViewUrl(previewDocument.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary underline underline-offset-2"
                                        >
                                            Open in new tab
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
