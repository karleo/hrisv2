import { X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

export function BiometricSyncBusyOverlay({
    open,
    message,
    onDismiss,
}: {
    open: boolean;
    message: string;
    onDismiss?: () => void;
}) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
            aria-label={message}
        >
            <div className="pointer-events-auto relative flex max-w-sm flex-col items-center gap-4 rounded-xl border bg-card px-8 py-6 shadow-lg">
                {onDismiss !== undefined && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 size-8"
                        onClick={onDismiss}
                        aria-label="Continue browsing"
                    >
                        <X className="size-4" />
                    </Button>
                )}
                <Spinner className="size-10 text-primary" />
                <p className="text-center text-sm font-medium">{message}</p>
                {onDismiss !== undefined && (
                    <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
                        Continue browsing
                    </Button>
                )}
            </div>
        </div>
    );
}
