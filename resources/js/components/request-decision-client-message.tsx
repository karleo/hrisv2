import { cn } from '@/lib/utils';

export const approveRequiresManagerSignatureMessage =
    'Please save your manager or HR signature before approving this request.';

export const approveRequiresIssuedBySignatureMessage =
    'Please save your issued-by signature before approving this request.';

export const rejectRequiresRemarksMessage = 'Please fill reason before rejecting.';

/**
 * Hides stale “save signature before approve” copy after the signature URL is present (e.g. after Inertia reload).
 */
export function visibleRequestDecisionMessage(
    message: string | null,
    context: {
        hasManagerSignature?: boolean;
        hasIssuedBySignature?: boolean;
    },
): string | null {
    if (message == null || message === '') {
        return null;
    }
    if (message === approveRequiresManagerSignatureMessage && context.hasManagerSignature) {
        return null;
    }
    if (message === approveRequiresIssuedBySignatureMessage && context.hasIssuedBySignature) {
        return null;
    }

    return message;
}

export function RequestDecisionClientMessage({ message }: { message: string | null }) {
    if (message == null || message === '') {
        return null;
    }

    return (
        <div
            role="alert"
            className={cn(
                'rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive',
            )}
        >
            {message}
        </div>
    );
}
