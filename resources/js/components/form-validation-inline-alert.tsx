import { useMemo } from 'react';
import { cn } from '@/lib/utils';

function collectErrorMessages(errors: Record<string, unknown> | undefined | null): string[] {
    if (errors == null || typeof errors !== 'object') {
        return [];
    }

    const lines: string[] = [];

    for (const value of Object.values(errors)) {
        if (value === undefined || value === null || value === '') {
            continue;
        }
        if (Array.isArray(value)) {
            for (const line of value) {
                if (line !== undefined && line !== null && String(line).trim() !== '') {
                    lines.push(String(line));
                }
            }
        } else if (typeof value === 'string') {
            lines.push(value);
        }
    }

    return [...new Set(lines)];
}

/**
 * Shown when Laravel / Inertia validation failed after save draft or submit.
 * Field-level messages stay on `InputError`; this is a summary above the form.
 */
export function FormValidationInlineAlert({
    errors,
    className,
}: {
    errors?: Record<string, unknown> | null;
    className?: string;
}) {
    const messages = useMemo(() => collectErrorMessages(errors ?? undefined), [errors]);

    if (messages.length === 0) {
        return null;
    }

    return (
        <div
            role="alert"
            className={cn(
                'rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive',
                className,
            )}
        >
            <p className="font-semibold">Mandatory fields need your attention</p>
            <p className="text-destructive/90 mt-1 text-xs">
                Correct the items below, then try saving your draft or submitting again.
            </p>
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
                {messages.map((message, index) => (
                    <li key={`${message}-${index}`}>{message}</li>
                ))}
            </ul>
        </div>
    );
}
