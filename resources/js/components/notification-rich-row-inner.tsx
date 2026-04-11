import { type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import {
    NOTIFICATION_VARIANT_STYLES,
    type NotificationVisualVariant,
} from '@/lib/notification-visual';
import { cn } from '@/lib/utils';

/**
 * Shared “rich” notification body: circular avatar (photo or icon) and title + subline.
 * Used by the arrival toast and the bell dropdown list.
 */
export function NotificationRichRowInner({
    variant,
    Icon,
    employeePhotoUrl,
    title,
    body,
    dateLine,
    hrefForSrOnly,
    compact = false,
    className,
}: {
    variant: NotificationVisualVariant;
    Icon: LucideIcon;
    employeePhotoUrl: string | null;
    title: string;
    body: string;
    dateLine: string;
    /** When non-empty, screen-reader hint for the clickable row. */
    hrefForSrOnly: string;
    compact?: boolean;
    className?: string;
}) {
    const [photoFailed, setPhotoFailed] = useState(false);
    const ui = NOTIFICATION_VARIANT_STYLES[variant];

    const subline =
        dateLine !== '' ? (
            <>
                {body}
                <span className="text-muted-foreground/75"> · {dateLine}</span>
            </>
        ) : (
            body
        );

    const showPhoto = employeePhotoUrl !== null && employeePhotoUrl !== '' && !photoFailed;

    const avatarClass = compact ? 'size-9' : 'size-11';
    const iconClass = compact ? 'size-4' : 'size-[18px]';
    const titleClass = compact
        ? 'text-sm leading-snug font-semibold tracking-tight text-foreground'
        : 'text-[15px] leading-snug font-semibold tracking-tight text-foreground';

    return (
        <div className={cn('flex min-w-0 flex-1 items-center gap-3', compact ? 'gap-2.5' : 'gap-3.5', className)}>
            {hrefForSrOnly !== '' ? <span className="sr-only">{hrefForSrOnly}</span> : null}
            <div
                className={cn(
                    'shrink-0 overflow-hidden rounded-full ring-2 ring-offset-0 ring-offset-white dark:ring-offset-card',
                    avatarClass,
                    ui.avatarRing,
                )}
            >
                {showPhoto ? (
                    <img
                        src={employeePhotoUrl}
                        alt=""
                        className="size-full object-cover"
                        onError={() => {
                            setPhotoFailed(true);
                        }}
                    />
                ) : (
                    <div
                        className={cn('flex size-full items-center justify-center', ui.iconFallback)}
                    >
                        <Icon className={iconClass} strokeWidth={2} />
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className={titleClass}>{title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{subline}</p>
            </div>
        </div>
    );
}
