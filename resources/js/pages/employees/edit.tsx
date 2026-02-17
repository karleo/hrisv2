import { Head, Link, router } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft, Building2, FileStack, ImagePlus, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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

type EmployeeDocument = {
    id: number;
    name: string;
    original_name: string;
    path: string;
    url: string;
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
    company_name: string | null;
    company_address_1: string | null;
    company_address_2: string | null;
    company_website: string | null;
    company_logo: string | null;
    company_logo_url: string | null;
    department_id: number;
    job_position_id: number;
    photo: string | null;
    photo_url: string | null;
    documents: EmployeeDocument[];
};

export default function Edit({
    employee,
    departments,
    jobPositions,
}: {
    employee: Employee;
    departments: Department[];
    jobPositions: JobPosition[];
}) {
    const photoInputRef = useRef<HTMLInputElement>(null);
    const companyLogoInputRef = useRef<HTMLInputElement>(null);
    const documentsInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        employee.photo_url ?? null
    );
    const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(
        employee.company_logo_url ?? null
    );
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);
    const [documentLabels, setDocumentLabels] = useState<string[]>([]);

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

    function handleCompanyLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setCompanyLogoPreview(URL.createObjectURL(file));
        } else {
            setCompanyLogoPreview(employee.company_logo_url ?? null);
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
                    description="Update employee details"
                />

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
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
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
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
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
                                                            href={doc.url}
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
                                                        className="size-7 shrink-0 text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            deleteDocument(doc)
                                                        }
                                                        aria-label="Remove document"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
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
                                            {documentFiles.length > 0 && (
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
                                </div>
                            </div>

                            {/* Right column: Form fields */}
                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="space-y-6">
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
                                        <Label className="text-base font-medium">
                                            Company Logo
                                        </Label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted/30">
                                                {companyLogoPreview ? (
                                                    <img
                                                        src={companyLogoPreview}
                                                        alt=""
                                                        className="size-full object-contain"
                                                    />
                                                ) : (
                                                    <Building2 className="size-8 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    ref={companyLogoInputRef}
                                                    type="file"
                                                    name="company_logo"
                                                    accept="image/*"
                                                    className="sr-only"
                                                    onChange={handleCompanyLogoChange}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        companyLogoInputRef.current?.click()
                                                    }
                                                >
                                                    {companyLogoPreview
                                                        ? 'Change logo'
                                                        : 'Upload logo'}
                                                </Button>
                                                <p className="text-xs text-muted-foreground">
                                                    Max 2 MB. Shown on business card.
                                                </p>
                                            </div>
                                        </div>
                                        <InputError
                                            message={errors.company_logo}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="company_name">
                                            Company Name
                                        </Label>
                                        <Input
                                            id="company_name"
                                            name="company_name"
                                            maxLength={255}
                                            defaultValue={
                                                employee.company_name ?? ''
                                            }
                                            placeholder="Acme Inc."
                                        />
                                        <InputError
                                            message={errors.company_name}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="company_address_1">
                                            Company Address 1
                                        </Label>
                                        <Input
                                            id="company_address_1"
                                            name="company_address_1"
                                            maxLength={255}
                                            defaultValue={
                                                employee.company_address_1 ?? ''
                                            }
                                            placeholder="Street address"
                                        />
                                        <InputError
                                            message={errors.company_address_1}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="company_address_2">
                                            Company Address 2
                                        </Label>
                                        <Input
                                            id="company_address_2"
                                            name="company_address_2"
                                            maxLength={255}
                                            defaultValue={
                                                employee.company_address_2 ?? ''
                                            }
                                            placeholder="Suite, floor, etc. (optional)"
                                        />
                                        <InputError
                                            message={errors.company_address_2}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="company_website">
                                            Company Website
                                        </Label>
                                        <Input
                                            id="company_website"
                                            name="company_website"
                                            type="url"
                                            maxLength={255}
                                            defaultValue={
                                                employee.company_website ?? ''
                                            }
                                            placeholder="https://www.example.com"
                                        />
                                        <InputError
                                            message={errors.company_website}
                                        />
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

                                    <div className="flex gap-4 pt-4">
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
                                </div>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
