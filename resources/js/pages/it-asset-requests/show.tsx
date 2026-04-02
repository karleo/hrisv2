import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Printer, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { SignaturePad } from '@/components/signature-pad';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
};

type Department = {
    id: number;
    name: string;
};

type Hardware = {
    id: number;
    code: string;
    name: string;
};

type ItAssetRequest = {
    id: number;
    code: string;
    date: string;
    date_issued: string | null;
    status: string;
    hardware_ids: number[] | null;
    hardware?: Hardware[];
    asset_type: string | null;
    serial_number: string | null;
    remarks: string | null;
    employee_signature_url?: string | null;
    issued_by_signature_url?: string | null;
    issued_by_employee_id?: number | null;
    employee?: Employee;
    department?: Department;
    issued_by_employee?: Employee;
};

function formatDateDdMmYyyy(value: string | null | undefined): string {
    if (value == null || value === '') return '—';
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [, yyyy, mm, dd] = match;
        return `${dd}/${mm}/${yyyy}`;
    }
    return value;
}

const inputClassName =
    'border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

export default function Show({
    itAssetRequest,
    hardware = [],
    employees = [],
}: {
    itAssetRequest: ItAssetRequest;
    hardware?: Hardware[];
    employees?: Employee[];
}) {
    const requestLabel = itAssetRequest.code || `Request #${itAssetRequest.id}`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'IT Asset Requests', href: '/it-asset-requests' },
        { title: requestLabel, href: '#' },
    ];

    const employeeSignatureInputRef = useRef<HTMLInputElement>(null);
    const issuedBySignatureInputRef = useRef<HTMLInputElement>(null);
    const [employeeSignaturePreview, setEmployeeSignaturePreview] = useState<string | null>(
        itAssetRequest.employee_signature_url ?? null
    );
    const [issuedBySignaturePreview, setIssuedBySignaturePreview] = useState<string | null>(
        itAssetRequest.issued_by_signature_url ?? null
    );

    const { data, setData, post, processing, errors, reset } = useForm<{
        employee_signature: File | null;
        issued_by_signature: File | null;
        issued_by_employee_id: number | '';
    }>({
        employee_signature: null,
        issued_by_signature: null,
        issued_by_employee_id: itAssetRequest.issued_by_employee_id ?? '',
    });

    useEffect(() => {
        setEmployeeSignaturePreview(itAssetRequest.employee_signature_url ?? null);
    }, [itAssetRequest.employee_signature_url]);

    useEffect(() => {
        setIssuedBySignaturePreview(itAssetRequest.issued_by_signature_url ?? null);
    }, [itAssetRequest.issued_by_signature_url]);

    const handleEmployeeSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('employee_signature', file);
            setEmployeeSignaturePreview(URL.createObjectURL(file));
        }
    };

    const handleIssuedBySignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('issued_by_signature', file);
            setIssuedBySignaturePreview(URL.createObjectURL(file));
        }
    };

    const dataUrlToFile = (dataUrl: string, filename: string): File => {
        const [header, data] = dataUrl.split(',');
        const mimeMatch = header.match(/data:(.*);base64/);
        const mime = mimeMatch?.[1] ?? 'image/png';
        const binary = atob(data);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new File([bytes], filename, { type: mime });
    };

    const saveSignaturesDirectly = (payload: {
        employeeSignature?: File | null;
        issuedBySignature?: File | null;
    }) => {
        const hasEmployee = payload.employeeSignature instanceof File;
        const hasIssuedBy = payload.issuedBySignature instanceof File;
        if (!hasEmployee && !hasIssuedBy) {
            return;
        }

        const formData = new FormData();
        if (hasEmployee && payload.employeeSignature) {
            formData.append('employee_signature', payload.employeeSignature);
        }
        if (hasIssuedBy && payload.issuedBySignature) {
            formData.append('issued_by_signature', payload.issuedBySignature);
            if (data.issued_by_employee_id !== '') {
                formData.append('issued_by_employee_id', String(data.issued_by_employee_id));
            }
        }

        router.post(`/it-asset-requests/${itAssetRequest.id}/signatures`, formData, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            only: ['itAssetRequest', 'flash', 'errors'],
            onSuccess: () => {
                reset('employee_signature', 'issued_by_signature');
            },
        });
    };

    const handleEmployeeSignatureDrawn = (dataUrl: string | null) => {
        if (!dataUrl) {
            setData('employee_signature', null);
            setEmployeeSignaturePreview(null);
            return;
        }

        const file = dataUrlToFile(dataUrl, `employee-signature-${itAssetRequest.id}.png`);
        setData('employee_signature', file);
        setEmployeeSignaturePreview(dataUrl);
    };

    const handleIssuedBySignatureDrawn = (dataUrl: string | null) => {
        if (!dataUrl) {
            setData('issued_by_signature', null);
            setIssuedBySignaturePreview(null);
            return;
        }

        const file = dataUrlToFile(dataUrl, `issued-by-signature-${itAssetRequest.id}.png`);
        setData('issued_by_signature', file);
        setIssuedBySignaturePreview(dataUrl);
    };

    const handleEmployeeSignatureSave = (dataUrl: string | null) => {
        if (!dataUrl) {
            return;
        }
        const file = dataUrlToFile(dataUrl, `employee-signature-${itAssetRequest.id}.png`);
        saveSignaturesDirectly({ employeeSignature: file });
    };

    const handleIssuedBySignatureSave = (dataUrl: string | null) => {
        if (!dataUrl) {
            return;
        }
        const file = dataUrlToFile(dataUrl, `issued-by-signature-${itAssetRequest.id}.png`);
        saveSignaturesDirectly({ issuedBySignature: file });
    };

    const handleSubmitSignatures = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/it-asset-requests/${itAssetRequest.id}/signatures`, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            only: ['itAssetRequest', 'flash', 'errors'],
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`IT Asset Request #${itAssetRequest.id}`} />

            <div className="flex min-h-screen flex-1 flex-col bg-muted/30">
                <div className="border-b bg-card px-4 py-6 md:px-8 print:hidden">
                    <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-4">
                        <div className="space-y-2">
                            <Link
                                href="/it-asset-requests"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="size-4" />
                                Back to IT Asset Requests
                            </Link>
                            <h1 className="text-2xl font-bold tracking-tight">{requestLabel}</h1>
                            <p className="text-sm text-muted-foreground">IT Asset Request Form</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    itAssetRequest.status === 'submitted'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                }`}
                            >
                                {itAssetRequest.status === 'submitted' ? 'Submitted' : 'Draft'}
                            </span>
                            <Link href={`/it-asset-requests/${itAssetRequest.id}/print`}>
                                <Button type="button">
                                    <Printer className="size-4" />
                                    Print
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-8 md:px-8 print:p-4">
                    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                        <div className="rounded-xl border bg-background p-6 shadow-sm print:border-0 print:shadow-none">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">Request Code</div>
                            <div className="font-semibold">{itAssetRequest.code || '—'}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">Date</div>
                            <div className="font-semibold">{formatDateDdMmYyyy(itAssetRequest.date)}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">Date Issued</div>
                            <div className="font-semibold">{formatDateDdMmYyyy(itAssetRequest.date_issued)}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">Status</div>
                            <div className="font-semibold">
                                {itAssetRequest.status === 'draft' ? 'Draft' : 'Submitted'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground">Employee</div>
                            <div className="font-semibold">
                                {itAssetRequest.employee
                                    ? `${itAssetRequest.employee.first_name} ${itAssetRequest.employee.last_name}`
                                    : '—'}
                            </div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground">Department</div>
                            <div className="font-semibold">{itAssetRequest.department?.name ?? '—'}</div>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground">Hardware</div>
                            <div className="mt-1">
                                {hardware.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {hardware.map((hw) => (
                                            <li key={hw.id}>
                                                {hw.code} - {hw.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                )}
                            </div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground">Serial number</div>
                            <div className="font-semibold">{itAssetRequest.serial_number ?? '—'}</div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-lg border p-4">
                        <div className="text-xs text-muted-foreground">Remarks</div>
                        <div className="mt-1 min-h-[80px] whitespace-pre-wrap text-sm">
                            {itAssetRequest.remarks ?? '—'}
                        </div>
                        <div className="mt-4 hidden text-sm leading-relaxed print:block print:text-black">
                                <p>
                                    I hereby acknowledge that I have received the above-mentioned
                                    assets. I understand that these assets are the property of
                                    PRIME LOGISTICS FZCO and are entrusted to me solely for the
                                    purpose of carrying out my official duties.
                                </p>
                                <p className="mt-3">
                                    I undertake to take proper care of the company’s assets and to
                                    use them strictly for business purposes. I further agree not to
                                    share these assets, related information, or any security
                                    codes/passwords with any unauthorized person.
                                </p>
                                <p className="mt-3">
                                    In the event of loss, theft, or damage due to negligence during
                                    my employment, I understand and agree that I will be
                                    responsible for the applicable replacement or repair costs. I
                                    also agree to return all assets issued to me in good condition
                                    upon my last working day with PRIME LOGISTICS FZCO.
                                </p>
                        </div>
                            </div>
                        </div>

                        <Card className="print:hidden">
                            <CardHeader>
                                <CardTitle>Signatures</CardTitle>
                                <CardDescription>Capture employee and issued-by signatures.</CardDescription>
                            </CardHeader>
                            <CardContent>
                            <form onSubmit={handleSubmitSignatures}>
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <SignaturePad
                                            label="Employee Signature"
                                            initialImageUrl={employeeSignaturePreview}
                                            onChange={handleEmployeeSignatureDrawn}
                                            onSave={handleEmployeeSignatureSave}
                                        />
                                        <div>
                                            <Label htmlFor="employee_signature">
                                                Or upload Employee Signature
                                            </Label>
                                            <input
                                                ref={employeeSignatureInputRef}
                                                id="employee_signature"
                                                name="employee_signature"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleEmployeeSignatureChange}
                                                className="mt-1.5 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                                            />
                                            <InputError message={errors.employee_signature} />
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground print:text-black">
                                            {itAssetRequest.employee
                                                ? `${itAssetRequest.employee.first_name} ${itAssetRequest.employee.last_name}`
                                                : 'Employee Name'}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="issued_by_employee_id">
                                                Issued By Employee
                                            </Label>
                                            <select
                                                id="issued_by_employee_id"
                                                name="issued_by_employee_id"
                                                value={data.issued_by_employee_id}
                                                onChange={(e) =>
                                                    setData(
                                                        'issued_by_employee_id',
                                                        e.target.value ? Number(e.target.value) : '',
                                                    )
                                                }
                                                className={inputClassName}
                                            >
                                                <option value="">Select employee</option>
                                                {employees.map((emp) => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.first_name} {emp.last_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.issued_by_employee_id} />
                                        </div>

                                        <SignaturePad
                                            label="Issued By Signature"
                                            initialImageUrl={issuedBySignaturePreview}
                                            onChange={handleIssuedBySignatureDrawn}
                                            onSave={handleIssuedBySignatureSave}
                                        />
                                        <div>
                                            <Label htmlFor="issued_by_signature">
                                                Or upload Issued By Signature
                                            </Label>
                                            <input
                                                ref={issuedBySignatureInputRef}
                                                id="issued_by_signature"
                                                name="issued_by_signature"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleIssuedBySignatureChange}
                                                className="mt-1.5 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                                            />
                                            <InputError message={errors.issued_by_signature} />
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground print:text-black">
                                            {(() => {
                                                if (itAssetRequest.issued_by_employee) {
                                                    return `${itAssetRequest.issued_by_employee.first_name} ${itAssetRequest.issued_by_employee.last_name}`;
                                                }
                                                if (data.issued_by_employee_id) {
                                                    const emp = employees.find(
                                                        (e) => e.id === data.issued_by_employee_id,
                                                    );
                                                    return emp
                                                        ? `${emp.first_name} ${emp.last_name}`
                                                        : 'Issued By';
                                                }
                                                return 'Issued By';
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                {(data.employee_signature || data.issued_by_signature || data.issued_by_employee_id !== (itAssetRequest.issued_by_employee_id ?? '')) && (
                                    <div className="mt-6 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            <Upload className="mr-2 size-4" />
                                            Save Signatures & Issued By
                                        </Button>
                                    </div>
                                )}
                            </form>
                            </CardContent>
                        </Card>
                        <div className="hidden rounded-xl border bg-background p-6 shadow-sm print:block print:border-0 print:p-0 print:shadow-none">
                            <div className="print:grid print:grid-cols-2 print:gap-12">
                                <div>
                                    <div className="mb-2 font-semibold">
                                        Employee Signature
                                    </div>
                                    {employeeSignaturePreview ? (
                                        <div className="mb-4">
                                            <img
                                                src={employeeSignaturePreview}
                                                alt="Employee signature"
                                                className="max-h-20 w-full border border-gray-300 bg-white object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="mb-4 min-h-[80px] border-2 border-dashed border-gray-300" />
                                    )}
                                    <div className="text-xs">
                                        {itAssetRequest.employee
                                            ? `${itAssetRequest.employee.first_name} ${itAssetRequest.employee.last_name}`
                                            : 'Employee Name'}
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 font-semibold">
                                        Issued By Signature
                                    </div>
                                    {issuedBySignaturePreview ? (
                                        <div className="mb-4">
                                            <img
                                                src={issuedBySignaturePreview}
                                                alt="Issued by signature"
                                                className="max-h-20 w-full border border-gray-300 bg-white object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="mb-4 min-h-[80px] border-2 border-dashed border-gray-300" />
                                    )}
                                    <div className="text-xs">
                                        {itAssetRequest.issued_by_employee
                                            ? `${itAssetRequest.issued_by_employee.first_name} ${itAssetRequest.issued_by_employee.last_name}`
                                            : 'Issued By'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

