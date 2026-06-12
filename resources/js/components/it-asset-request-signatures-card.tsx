import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
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
        <div className="space-y-4 border-t border-border pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            <div className="grid min-w-0 gap-2">
                <Label htmlFor="issued_by_employee_id">
                    Issued by employee
                </Label>
                <select
                    id="issued_by_employee_id"
                    name="issued_by_employee_id"
                    value={
                        issuedByEmployeeId === ''
                            ? ''
                            : String(issuedByEmployeeId)
                    }
                    onChange={(e) =>
                        setIssuedByEmployeeId(
                            e.target.value ? Number(e.target.value) : '',
                        )
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
                    signatureUrl={
                        itAssetRequest.issued_by_signature_url ?? null
                    }
                    submitUrl={signaturesUrl}
                    fieldName="issued_by_signature"
                    extraFormData={
                        issuedByEmployeeId !== ''
                            ? {
                                  issued_by_employee_id:
                                      String(issuedByEmployeeId),
                              }
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
                            {issuedByReadonlyEmptyMessage ??
                                'No signature on file.'}
                        </p>
                    )}
                    {itAssetRequest.issued_by_signature_url ? (
                        <p className="text-xs text-muted-foreground">
                            This signature is saved with the request and is
                            locked after a decision.
                        </p>
                    ) : issuedByReadonlyEmptyMessage ? null : (
                        <p className="text-xs text-muted-foreground">
                            The issued-by signature can be added when the
                            request is ready for approval.
                        </p>
                    )}
                </div>
            )}
            <p className="text-xs text-muted-foreground">
                {itAssetRequest.issued_by_employee
                    ? `${itAssetRequest.issued_by_employee.first_name} ${itAssetRequest.issued_by_employee.last_name}`
                    : issuedByEmployeeId !== ''
                      ? (() => {
                            const emp = employees.find(
                                (e) => e.id === issuedByEmployeeId,
                            );
                            return emp
                                ? `${emp.first_name} ${emp.last_name}`
                                : 'Issued by';
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
    approvalDecision,
}: {
    itAssetRequest: ItAssetRequestSignatureProps;
    employees: SignatureEmployee[];
    signaturesUrl: string;
    visitOnly: readonly string[] | string[];
    className?: string;
    allowEmployeeSignatureEdit?: boolean;
    allowIssuedBySignatureEdit?: boolean;
    issuedByReadonlyEmptyMessage?: string;
    approvalDecision?: ReactNode;
}) {
    const only = [...visitOnly];

    return (
        <Card className={cn('print:hidden', className)}>
            <CardHeader>
                <CardTitle>Request Signatures</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Employee signatures are captured while the request is still
                    a draft. After submission, approval needs an issued-by
                    employee and their saved signature before approving.
                </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start md:gap-10">
                <div className="space-y-2">
                    {allowEmployeeSignatureEdit ? (
                        <SignaturePad
                            label="Employee signature"
                            signatureUrl={
                                itAssetRequest.employee_signature_url ?? null
                            }
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
                            <p className="text-sm font-medium">
                                Employee signature
                            </p>
                            {itAssetRequest.employee_signature_url ? (
                                <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-white">
                                    <img
                                        src={
                                            itAssetRequest.employee_signature_url
                                        }
                                        alt="Employee signature"
                                        className="absolute inset-0 h-full w-full object-contain object-left-top"
                                        loading="eager"
                                        decoding="async"
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No employee signature on file.
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Employee signature is locked after submission.
                                Move the request back to draft if it must be
                                changed.
                            </p>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {itAssetRequest.employee
                            ? `${itAssetRequest.employee.first_name} ${itAssetRequest.employee.last_name}`
                            : 'Employee'}
                    </p>
                </div>
                <div className="space-y-6">
                    <IssuedBySignatureBlock
                        key={`ib-${itAssetRequest.id}-${itAssetRequest.issued_by_employee_id ?? 'none'}`}
                        itAssetRequest={itAssetRequest}
                        employees={employees}
                        signaturesUrl={signaturesUrl}
                        visitOnly={only}
                        allowIssuedBySignatureEdit={allowIssuedBySignatureEdit}
                        issuedByReadonlyEmptyMessage={
                            issuedByReadonlyEmptyMessage
                        }
                    />
                    {approvalDecision}
                </div>
            </CardContent>
        </Card>
    );
}
