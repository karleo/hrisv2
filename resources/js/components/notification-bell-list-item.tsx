import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { NotificationRichRowInner } from '@/components/notification-rich-row-inner';
import { Button } from '@/components/ui/button';
import {
    NOTIFICATION_VARIANT_STYLES,
    notificationVariantLucideIcon,
    notificationVisualVariant,
} from '@/lib/notification-visual';
import {
    formatNotificationSubtext,
    formatRequestDate,
    notificationHref,
    type NotificationItemData,
} from '@/lib/notifications';
import { cn } from '@/lib/utils';

export type NotificationBellListItemModel = {
    id: string;
    read_at?: string | null;
    data?: NotificationItemData;
    created_at?: string;
};

export function NotificationBellListItem({ item }: { item: NotificationBellListItemModel }) {
    const variant = notificationVisualVariant(item.data);
    const ui = NOTIFICATION_VARIANT_STYLES[variant];
    const Icon = notificationVariantLucideIcon(variant);

    const title = item.data?.request_code ?? 'Request submitted';
    const body = formatNotificationSubtext(item.data);
    const dateLine = formatRequestDate(item.data?.request_date ?? item.created_at ?? undefined);
    const rawPhoto = item.data?.employee_photo_url;
    const employeePhotoUrl =
        typeof rawPhoto === 'string' && rawPhoto.trim() !== '' ? rawPhoto.trim() : null;

    const href = notificationHref(item);

    const onActivate = (): void => {
        router.post(
            `/notifications/${item.id}/read`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (href !== '#') {
                        router.visit(href);
                    }
                },
            },
        );
    };

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border bg-white text-foreground shadow-sm ring-1 transition-colors',
                'ring-black/[0.04] dark:bg-card dark:text-card-foreground dark:ring-white/10',
                !item.read_at
                    ? 'border-primary/25 shadow-[0_2px_12px_rgba(59,130,246,0.1)] dark:border-primary/35'
                    : 'border-border/60 hover:bg-muted/20 dark:hover:bg-muted/15',
            )}
        >
            <div className="flex items-stretch">
                <div
                    className={cn('w-1.5 shrink-0 self-stretch bg-gradient-to-b', ui.accentGradient)}
                    aria-hidden
                />
                <button
                    type="button"
                    onClick={onActivate}
                    className="flex min-w-0 flex-1 items-center text-left transition-colors hover:bg-muted/30"
                >
                    <NotificationRichRowInner
                        key={`${item.id}-${employeePhotoUrl ?? ''}`}
                        variant={variant}
                        Icon={Icon}
                        employeePhotoUrl={employeePhotoUrl}
                        title={title}
                        body={body}
                        dateLine={dateLine}
                        hrefForSrOnly={href !== '#' ? 'Open request and mark as read' : 'Mark as read'}
                        compact
                        className="px-2.5 py-2.5"
                    />
                </button>
                <div className="flex w-11 shrink-0 flex-col items-center justify-center gap-1 border-l border-border/50 px-1 py-2 dark:border-border/60">
                    {!item.read_at ? (
                        <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white">
                            New
                        </span>
                    ) : (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                                router.delete(`/notifications/${item.id}`, {
                                    preserveScroll: true,
                                    preserveState: true,
                                });
                            }}
                            aria-label="Delete notification"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
