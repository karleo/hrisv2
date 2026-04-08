import { SignaturePad } from '@/components/signature-pad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/** Partial reload after signature save on leave request show. */
export const leaveRequestShowSignatureVisitOnly = [
    'leaveRequest',
    'submitUrl',
    'signaturesUrl',
    'flash',
    'errors',
    'employees',
] as const;

/** Partial reload after signature save on IT request show. */
export const itRequestShowSignatureVisitOnly = [
    'itRequest',
    'submitUrl',
    'signaturesUrl',
    'flash',
    'errors',
    'employees',
] as const;

/** Partial reload after signature save on employee request show. */
export const employeeRequestShowSignatureVisitOnly = [
    'employeeRequest',
    'submitUrl',
    'signaturesUrl',
    'flash',
    'errors',
    'employees',
] as const;

/** Partial Inertia reload after saving employee signature on leave request edit. */
export const leaveRequestEditSignatureVisitOnly = [
    'leaveRequest',
    'employees',
    'departments',
    'signaturesUrl',
    'flash',
    'errors',
] as const;

/** Partial Inertia reload after saving employee signature on IT request edit. */
export const itRequestEditSignatureVisitOnly = [
    'itRequest',
    'employees',
    'departments',
    'software',
    'hardware',
    'signaturesUrl',
    'flash',
    'errors',
] as const;

/** Partial Inertia reload after saving employee signature on employee request edit. */
export const employeeRequestEditSignatureVisitOnly = [
    'employeeRequest',
    'employees',
    'departments',
    'jobPositions',
    'signaturesUrl',
    'flash',
    'errors',
] as const;

/**
 * Single “employee signature” pad used on leave / IT / employee request show and edit pages.
 */
export function RequestEmployeeSignatureCard({
    signatureUrl,
    signaturesUrl,
    visitOnly,
    employeeName,
    className,
    additionalSignatures = [],
    managerDecisionSlot,
    allowEmployeeSignatureEdit = true,
}: {
    signatureUrl: string | null;
    signaturesUrl: string;
    visitOnly: readonly string[] | string[];
    /** Shown under the pad when provided (e.g. current request employee). */
    employeeName?: string | null;
    className?: string;
    additionalSignatures?: Array<{
        label: string;
        signatureUrl: string | null;
        fieldName: 'approved_by_signature' | 'dept_head_signature' | 'ceo_signature';
        editable?: boolean;
    }>;
    managerDecisionSlot?: ReactNode;
    allowEmployeeSignatureEdit?: boolean;
}) {
    const only = [...visitOnly];
    const managerSignature = additionalSignatures.find((signature) => signature.fieldName === 'approved_by_signature');
    const otherSignatures = additionalSignatures.filter((signature) => signature.fieldName !== 'approved_by_signature');

    return (
        <Card className={cn('print:hidden', className)}>
            <CardHeader>
                <CardTitle>Signatures (sign in web portal)</CardTitle>
                <p className="text-muted-foreground text-sm">
                    Draw your signature below or replace an existing one. Click Save signature to store it.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
                    {allowEmployeeSignatureEdit ? (
                        <SignaturePad
                            label="Employee signature"
                            signatureUrl={signatureUrl}
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
                            {signatureUrl ? (
                                <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-muted">
                                    <img
                                        src={signatureUrl}
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
                    {managerSignature ? (
                        <div className="space-y-3">
                            {managerSignature.editable === false ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">{managerSignature.label}</p>
                                    {managerSignature.signatureUrl ? (
                                        <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-muted">
                                            <img
                                                src={managerSignature.signatureUrl}
                                                alt={managerSignature.label}
                                                className="absolute inset-0 h-full w-full object-contain object-left-top"
                                                loading="eager"
                                                decoding="async"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No signature on file.</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Locked after decision.</p>
                                </div>
                            ) : (
                                <SignaturePad
                                    label={managerSignature.label}
                                    signatureUrl={managerSignature.signatureUrl}
                                    submitUrl={signaturesUrl}
                                    fieldName={managerSignature.fieldName}
                                    visitOptions={{
                                        preserveScroll: true,
                                        preserveState: true,
                                        only,
                                    }}
                                />
                            )}
                            {managerDecisionSlot}
                        </div>
                    ) : (
                        <div />
                    )}
                </div>
                {otherSignatures.map((signature) => (
                    signature.editable === false ? (
                        <div key={signature.fieldName} className="space-y-2">
                            <p className="text-sm font-medium">{signature.label}</p>
                            {signature.signatureUrl ? (
                                <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-muted">
                                    <img
                                        src={signature.signatureUrl}
                                        alt={signature.label}
                                        className="absolute inset-0 h-full w-full object-contain object-left-top"
                                        loading="eager"
                                        decoding="async"
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No signature on file.</p>
                            )}
                            <p className="text-xs text-muted-foreground">Locked after decision.</p>
                        </div>
                    ) : (
                        <SignaturePad
                            key={signature.fieldName}
                            label={signature.label}
                            signatureUrl={signature.signatureUrl}
                            submitUrl={signaturesUrl}
                            fieldName={signature.fieldName}
                            visitOptions={{
                                preserveScroll: true,
                                preserveState: true,
                                only,
                            }}
                        />
                    )
                ))}
                {employeeName ? <p className="text-xs text-muted-foreground">{employeeName}</p> : null}
            </CardContent>
        </Card>
    );
}
