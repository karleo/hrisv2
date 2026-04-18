import type { ReactNode } from 'react';
import { SignaturePad } from '@/components/signature-pad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Partial reload after signature save on leave request show. */
export const leaveRequestShowSignatureVisitOnly = [
    'leaveRequest',
    'submitUrl',
    'signaturesUrl',
    'canDecide',
    'flash',
    'errors',
    'employees',
] as const;

/** Partial reload after signature save on IT request show. */
export const itRequestShowSignatureVisitOnly = [
    'itRequest',
    'submitUrl',
    'signaturesUrl',
    'canDecide',
    'flash',
    'errors',
    'employees',
] as const;

/** Partial reload after signature save on employee request show. */
export const employeeRequestShowSignatureVisitOnly = [
    'employeeRequest',
    'submitUrl',
    'signaturesUrl',
    'canDecide',
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
    'canDecide',
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
    'canDecide',
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
    'canDecide',
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
        fieldName: 'approved_by_signature' | 'ceo_signature';
        editable?: boolean;
        /** When not editable and there is no image yet (e.g. employee view while pending manager sign). */
        emptyReadonlyMessage?: string;
        /** Shown under this pad (e.g. approver name after decision). */
        signerName?: string | null;
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
                    <div className="min-w-0 space-y-2">
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
                                    <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-white">
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
                        {employeeName ? (
                            <p className="text-xs text-muted-foreground">{employeeName}</p>
                        ) : null}
                    </div>
                    {managerSignature ? (
                        <div className="min-w-0 space-y-3">
                            {managerSignature.editable === false ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">{managerSignature.label}</p>
                                    {managerSignature.signatureUrl ? (
                                        <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-white">
                                            <img
                                                src={managerSignature.signatureUrl}
                                                alt={managerSignature.label}
                                                className="absolute inset-0 h-full w-full object-contain object-left-top"
                                                loading="eager"
                                                decoding="async"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {managerSignature.emptyReadonlyMessage ?? 'No signature on file.'}
                                        </p>
                                    )}
                                    {managerSignature.signatureUrl ? (
                                        <p className="text-xs text-muted-foreground">Locked after decision.</p>
                                    ) : managerSignature.emptyReadonlyMessage ? null : (
                                        <p className="text-xs text-muted-foreground">Locked after decision.</p>
                                    )}
                                    {managerSignature.signerName ? (
                                        <p className="text-xs text-muted-foreground">{managerSignature.signerName}</p>
                                    ) : null}
                                </div>
                            ) : (
                                <>
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
                                    {managerSignature.signerName ? (
                                        <p className="text-xs text-muted-foreground">{managerSignature.signerName}</p>
                                    ) : null}
                                </>
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
                                <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-white">
                                    <img
                                        src={signature.signatureUrl}
                                        alt={signature.label}
                                        className="absolute inset-0 h-full w-full object-contain object-left-top"
                                        loading="eager"
                                        decoding="async"
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    {signature.emptyReadonlyMessage ?? 'No signature on file.'}
                                </p>
                            )}
                            {signature.signatureUrl ? (
                                <p className="text-xs text-muted-foreground">Locked after decision.</p>
                            ) : signature.emptyReadonlyMessage ? null : (
                                <p className="text-xs text-muted-foreground">Locked after decision.</p>
                            )}
                            {signature.signerName ? (
                                <p className="text-xs text-muted-foreground">{signature.signerName}</p>
                            ) : null}
                        </div>
                    ) : (
                        <div key={signature.fieldName} className="space-y-2">
                            <SignaturePad
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
                            {signature.signerName ? (
                                <p className="text-xs text-muted-foreground">{signature.signerName}</p>
                            ) : null}
                        </div>
                    )
                ))}
            </CardContent>
        </Card>
    );
}
