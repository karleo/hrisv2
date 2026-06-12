import { Mail } from 'lucide-react';

export type RequestEmailLogEntry = {
    id: number | string;
    status: string;
    channel: string;
    notification_type: string;
    recipient_email: string;
    reason: string | null;
    error_message: string | null;
    performed_at: string | null;
};

function statusClass(status: string): string {
    if (status === 'sent') {
        return 'text-emerald-600 dark:text-emerald-300';
    }

    if (status === 'failed') {
        return 'text-rose-600 dark:text-rose-300';
    }

    return 'text-amber-600 dark:text-amber-300';
}

export default function RequestEmailLogList({ entries }: { entries: RequestEmailLogEntry[] }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/70 bg-gradient-to-r from-muted/20 via-card to-card px-5 py-4">
                <span className="inline-flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <Mail className="size-4" />
                </span>
                <div>
                    <p className="text-sm font-semibold tracking-tight">Email Log</p>
                    <p className="text-xs text-muted-foreground">Delivery results for this request.</p>
                </div>
            </div>
            <div className="max-h-72 overflow-auto px-5 py-4">
                {entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No email attempts recorded yet.</p>
                ) : (
                    <div className="space-y-3">
                        {entries.map((entry) => (
                            <div key={entry.id} className="rounded-xl border border-border/70 bg-background px-4 py-3 text-sm">
                                <p className="font-medium">
                                    <span className={`${statusClass(entry.status)} capitalize`}>{entry.status}</span> to{' '}
                                    <span className="font-semibold">{entry.recipient_email}</span>
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {entry.notification_type.replace(/_/g, ' ')} via {entry.channel}
                                    {entry.reason ? ` (${entry.reason.replace(/_/g, ' ')})` : ''}
                                </p>
                                {entry.error_message ? (
                                    <p className="mt-1 text-xs text-rose-500">{entry.error_message}</p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
