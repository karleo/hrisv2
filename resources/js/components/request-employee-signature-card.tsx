import { SignaturePad } from '@/components/signature-pad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
}: {
    signatureUrl: string | null;
    signaturesUrl: string;
    visitOnly: readonly string[] | string[];
    /** Shown under the pad when provided (e.g. current request employee). */
    employeeName?: string | null;
    className?: string;
}) {
    const only = [...visitOnly];

    return (
        <Card className={cn('print:hidden', className)}>
            <CardHeader>
                <CardTitle>Signatures (sign in web portal)</CardTitle>
                <p className="text-muted-foreground text-sm">
                    Draw your signature below or replace an existing one. Click Save signature to store it.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
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
                {employeeName ? <p className="text-xs text-muted-foreground">{employeeName}</p> : null}
            </CardContent>
        </Card>
    );
}
