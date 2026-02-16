import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, FileStack, X } from 'lucide-react';
import { useRef, useState } from 'react';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
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

export default function Create({
    departments,
    jobPositions,
}: {
    departments: Department[];
    jobPositions: JobPosition[];
}) {
    const photoInputRef = useRef<HTMLInputElement>(null);
    const documentsInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);
    const [documentLabels, setDocumentLabels] = useState<string[]>([]);

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
        } else {
            setPhotoPreview(null);
        }
    }

    function handleDocumentsChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        setDocumentFiles(files);
        setDocumentLabels(
            files.map((f) => f.name.replace(/\.[^/.]+$/, '') || f.name)
        );
    }

    function clearDocuments() {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Employees
                </Link>

                <Heading
                    title="Create Employee"
                    description="Add a new employee to the master list"
                />

                <Form
                    {...EmployeeController.store.form()}
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
                                        Upload multiple documents (e.g. ID,
                                        contract). Max 10 MB each.
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
                                    {documentFiles.length > 0 && (
                                        <div className="space-y-3">
                                            {documentFiles.map((file, i) => (
                                                <div
                                                    key={`${file.name}-${i}`}
                                                    className="space-y-2 rounded-md border border-border bg-muted/30 p-3"
                                                >
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {file.name}
                                                    </p>
                                                    <div className="grid gap-1.5">
                                                        <Label
                                                            htmlFor={`document_label_${i}`}
                                                            className="text-xs"
                                                        >
                                                            Label
                                                        </Label>
                                                        <Input
                                                            id={`document_label_${i}`}
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
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearDocuments}
                                            >
                                                <X className="mr-1 size-4" />
                                                Clear all
                                            </Button>
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

                                    <div className="grid gap-2">
                                        <Label htmlFor="department_id">
                                            Department
                                        </Label>
                                        <select
                                            id="department_id"
                                            name="department_id"
                                            required
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
                                        <Button disabled={processing} type="submit">
                                            Create Employee
                                        </Button>
                                        <Link href={index()}>
                                            <Button type="button" variant="outline">
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
