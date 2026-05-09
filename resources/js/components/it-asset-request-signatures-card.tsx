import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { SignaturePad } from '@/components/signature-pad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type ItAssetRequestSignatureProps = {
    id: number;
    employee_signature_url?: string | null;
    issued_by_signature_url?: string | null;
    issued_by_employee_id?: number | null;
    employee?: { first_name: string; last_name: string };
    issued_by_employee?: { first_name: string; last_name: string };
};

type SignatureEmployee = {
    id: number;
    first_name: string;
    last_name: string;
};

const selectClassName =
    'border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50';

function IssuedBySignatureBlock({
    itAssetRequest,
    employees,
    signaturesUrl,
    visitOnly,
    allowIssuedBySignatureEdit,
    issuedByReadonlyEmptyMessage,
}: {
    itAssetRequest: ItAssetRequestSignatureProps;
    employees: SignatureEmployee[];
    signaturesUrl: string;
    visitOnly: string[];
    allowIssuedBySignatureEdit: boolean;
    /** Shown when the pad is readonly and there is no signature image yet. */
    issuedByReadonlyEmptyMessage?: string;
}) {
    const { errors } = usePage().props as { errors?: Record<string, string> };
    const [issuedByEmployeeId, setIssuedByEmployeeId] = useState<number | ''>(
        itAssetRequest.issued_by_employee_id ?? '',
    );

    return (
        <div className="space-y-4 border-t border-border pt-8 md:border-t-0 md:border-l md:pl-8 md:pt-0">
            <div className="grid min-w-0 gap-2">
                <Label htmlFor="issued_by_employee_id">Issued by employee</Label>
                <select
                    id="issued_by_employee_id"
                    name="issued_by_employee_id"
                    value={issuedByEmployeeId === '' ? '' : String(issuedByEmployeeId)}
                    onChange={(e) =>
                        setIssuedByEmployeeId(e.target.value ? Number(e.target.value) : '')
                    }
                    disabled={!allowIssuedBySignatureEdit}
                    className={selectClassName}
                >
                    <option value="" className="bg-background text-foreground">
                        Select employee
                    </option>
                    {employees.map((emp) => (
                        <option
                            key={emp.id}
                            value={emp.id}
                            className="bg-background text-foreground"
                        >
                            {emp.first_name} {emp.last_name}
                        </option>
                    ))}
                </select>
                <InputError message={errors?.issued_by_employee_id} />
            </div>
            {allowIssuedBySignatureEdit ? (
                <SignaturePad
                    label="Issued by signature"
                    signatureUrl={itAssetRequest.issued_by_signature_url ?? null}
                    submitUrl={signaturesUrl}
                    fieldName="issued_by_signature"
                    extraFormData={
                        issuedByEmployeeId !== ''
                            ? { issued_by_employee_id: String(issuedByEmployeeId) }
                            : undefined
                    }
                    visitOptions={{
                        preserveScroll: true,
                        preserveState: true,
                        only: visitOnly,
                    }}
                />
            ) : (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Issued by signature</p>
                    {itAssetRequest.issued_by_signature_url ? (
                        <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-white">
                            <img
                                src={itAssetRequest.issued_by_signature_url}
                                alt="Issued by signature"
                                className="absolute inset-0 h-full w-full object-contain object-left-top"
                                loading="eager"
                                decoding="async"
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {issuedByReadonlyEmptyMessage ?? 'No signature on file.'}
                        </p>
                    )}
                    {itAssetRequest.issued_by_signature_url ? (
                        <p className="text-xs text-muted-foreground">Locked after decision.</p>
                    ) : issuedByReadonlyEmptyMessage ? null : (
                        <p className="text-xs text-muted-foreground">Locked after decision.</p>
                    )}
                </div>
            )}
            <p className="text-xs text-muted-foreground">
                {itAssetRequest.issued_by_employee
                    ? `${itAssetRequest.issued_by_employee.first_name} ${itAssetRequest.issued_by_employee.last_name}`
                    : issuedByEmployeeId !== ''
                      ? (() => {
                            const emp = employees.find((e) => e.id === issuedByEmployeeId);
                            return emp ? `${emp.first_name} ${emp.last_name}` : 'Issued by';
                        })()
                      : 'Issued by'}
            </p>
        </div>
    );
}

/** Default partial reload for IT asset request show page after saving a signature. */
export const itAssetRequestShowSignatureVisitOnly = [
    'itAssetRequest',
    'submitUrl',
    'signaturesUrl',
    'canDecide',
    'flash',
    'errors',
] as const;

/** Partial reload for edit page — include form dependencies so the screen stays consistent. */
export const itAssetRequestEditSignatureVisitOnly = [
    'itAssetRequest',
    'employees',
    'departments',
    'hardware',
    'signaturesUrl',
    'canDecide',
    'flash',
    'errors',
] as const;

export function ItAssetRequestSignaturesCard({
    itAssetRequest,
    employees,
    signaturesUrl,
    visitOnly,
    className,
    allowEmployeeSignatureEdit = true,
    allowIssuedBySignatureEdit = true,
    issuedByReadonlyEmptyMessage,
}: {
    itAssetRequest: ItAssetRequestSignatureProps;
    employees: SignatureEmployee[];
    signaturesUrl: string;
    visitOnly: readonly string[] | string[];
    className?: string;
    allowEmployeeSignatureEdit?: boolean;
    allowIssuedBySignatureEdit?: boolean;
    issuedByReadonlyEmptyMessage?: string;
}) {
    const only = [...visitOnly];

    return (
        <Card className={cn('print:hidden', className)}>
            <CardHeader>
                <CardTitle>Signatures (sign in web portal)</CardTitle>
                <p className="text-muted-foreground text-sm">
                    Draw a signature below or replace an existing one. Click Save signature to store it. For issued-by,
                    choose the employee first if needed, then save that signature.
                </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start md:gap-10">
                <div className="space-y-2">
                    {allowEmployeeSignatureEdit ? (
                        <SignaturePad
                            label="Employee signature"
                            signatureUrl={itAssetRequest.employee_signature_url ?? null}
                            submitUrl={signaturesUrl}
                            fieldName="employee_signature"
                            visitOptions={{
                                preserveScroll: true,
                                preserveState: true,
                                only,
                            }}
                        />
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Employee signature</p>
                            {itAssetRequest.employee_signature_url ? (
                                <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-white">
                                    <img
                                        src={itAssetRequest.employee_signature_url}
                                        alt="Employee signature"
                                        className="absolute inset-0 h-full w-full object-contain object-left-top"
                                        loading="eager"
                                        decoding="async"
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No employee signature on file.</p>
                            )}
                            <p className="text-xs text-muted-foreground">Locked after submission.</p>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {itAssetRequest.employee
                            ? `${itAssetRequest.employee.first_name} ${itAssetRequest.employee.last_name}`
                            : 'Employee'}
                    </p>
                </div>
                <IssuedBySignatureBlock
                    key={`ib-${itAssetRequest.id}-${itAssetRequest.issued_by_employee_id ?? 'none'}`}
                    itAssetRequest={itAssetRequest}
                    employees={employees}
                    signaturesUrl={signaturesUrl}
                    visitOnly={only}
                    allowIssuedBySignatureEdit={allowIssuedBySignatureEdit}
                    issuedByReadonlyEmptyMessage={issuedByReadonlyEmptyMessage}
                />
            </CardContent>
        </Card>
    );
}
