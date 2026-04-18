import { ChevronDown, History } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useI18n } from '@/lib/i18n';

export type ActivityLogTimelineEntry = {
    id: number | string;
    action: string;
    field: string;
    old_value: string | null;
    new_value: string | null;
    performed_by: string;
    performed_at: string | null;
};

function formatDateLabel(value: string | null, locale: string, unknownDateLabel: string): string {
    if (!value) {
        return unknownDateLabel;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
    }).format(parsed);
}

function formatTimeLabel(value: string | null, locale: string): string {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
        .format(parsed)
        .toLowerCase();
}

function dayKey(value: string | null): string {
    if (!value) {
        return 'unknown';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'unknown';
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatFieldName(value: string): string {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: string | null): string {
    return value === null || value.trim() === '' ? '—' : value;
}

function isImageLikeValue(value: string | null): boolean {
    if (value === null) {
        return false;
    }

    const trimmed = value.trim();
    if (trimmed === '') {
        return false;
    }

    if (trimmed.startsWith('data:image/')) {
        return true;
    }

    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(trimmed);
}

function resolveImageUrl(value: string): string {
    const trimmed = value.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
        return trimmed;
    }

    if (trimmed.startsWith('/storage/')) {
        return trimmed;
    }

    if (trimmed.startsWith('storage/')) {
        return `/${trimmed}`;
    }

    return `/storage/${trimmed.replace(/^\/+/, '')}`;
}

function renderValueChip(label: string, field: string, value: string | null, viewLabel: string) {
    if (isImageLikeValue(value) && /signature|photo/i.test(field)) {
        const imageUrl = resolveImageUrl(value ?? '');

        return (
            <span className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1">
                <span>{label}:</span>
                <img
                    src={imageUrl}
                    alt={`${label} ${field}`}
                    className="size-8 rounded object-cover"
                />
                <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                >
                    {viewLabel}
                </a>
            </span>
        );
    }

    return (
        <span className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5">
            {label}: {formatValue(value)}
        </span>
    );
}

function actionTextClass(action: string): string {
    switch (action) {
        case 'created':
            return 'text-emerald-600 dark:text-emerald-300';
        case 'deleted':
            return 'text-rose-600 dark:text-rose-300';
        default:
            return 'text-blue-600 dark:text-blue-300';
    }
}

function actorInitials(actor: string): string {
    const normalized = actor.trim();
    if (normalized === '') {
        return 'SY';
    }

    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function ActivityLogTimeline({
    entries,
    title,
    description,
    emptyTitle,
    emptyDescription,
}: {
    entries: ActivityLogTimelineEntry[];
    title?: string;
    description?: string;
    emptyTitle?: string;
    emptyDescription?: string;
}) {
    const { t, locale } = useI18n();
    const resolvedTitle = title ?? t('activity.title', 'Activity Log');
    const resolvedDescription =
        description ?? t('activity.description.default', 'View record changes by authorized users.');
    const resolvedEmptyTitle = emptyTitle ?? t('activity.emptyTitle', 'No activity captured yet');
    const resolvedEmptyDescription =
        emptyDescription
        ?? t('activity.emptyDescription.default', 'Changes will appear here automatically once this record is updated.');
    const entriesLabel = t('activity.entries', 'entries');
    const unknownDateLabel = t('activity.unknownDate', 'Unknown date');
    const fieldLabel = t('activity.field', 'field');
    const fromLabel = t('activity.from', 'from');
    const toLabel = t('activity.to', 'to');
    const viewLabel = t('activity.view', 'View');
    const systemLabel = t('activity.system', 'System');

    const timelineGroups = Object.entries(
        entries.reduce<Record<string, ActivityLogTimelineEntry[]>>((groups, entry) => {
            const key = dayKey(entry.performed_at);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(entry);

            return groups;
        }, {}),
    ).sort(([a], [b]) => (a < b ? 1 : -1));

    return (
        <Collapsible
            defaultOpen={false}
            className="overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-sm"
        >
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="group flex w-full items-center justify-between gap-3 bg-gradient-to-r from-muted/20 via-card to-card px-5 py-4 text-left transition-colors hover:bg-muted/40"
                >
                    <div className="inline-flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                            <History className="size-4" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold tracking-tight">{resolvedTitle}</p>
                                <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    {entries.length} {entriesLabel}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{resolvedDescription}</p>
                        </div>
                    </div>
                    <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="space-y-4 border-t border-border/70 px-5 pb-5 pt-4">
                    {entries.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center">
                            <p className="text-sm font-medium">{resolvedEmptyTitle}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{resolvedEmptyDescription}</p>
                        </div>
                    ) : (
                        <div className="max-h-[30rem] space-y-6 overflow-auto pr-1">
                            {timelineGroups.map(([groupKey, groupEntries]) => (
                                <div key={groupKey} className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        {formatDateLabel(groupEntries[0]?.performed_at ?? null, locale, unknownDateLabel)}
                                    </p>
                                    <div className="space-y-3">
                                        {groupEntries.map((entry, index) => (
                                            <div key={entry.id} className="relative pl-8">
                                                {index < groupEntries.length - 1 ? (
                                                    <span className="absolute bottom-[-18px] left-2.5 top-5 border-l border-dashed border-border/80" />
                                                ) : null}
                                                <span className="absolute left-0 top-2.5 inline-flex size-5 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[10px] font-semibold text-primary">
                                                    •
                                                </span>
                                                <div className="rounded-xl border border-border/70 bg-background px-4 py-3 shadow-sm transition-colors hover:bg-muted/20">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <div className="flex min-w-0 items-center gap-2">
                                                                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
                                                                    {actorInitials(entry.performed_by || systemLabel)}
                                                                </span>
                                                                <p className="min-w-0 truncate text-sm">
                                                                    <span className="font-semibold">
                                                                        {entry.performed_by || systemLabel}
                                                                    </span>{' '}
                                                                    <span className={`${actionTextClass(entry.action)} font-semibold capitalize`}>
                                                                        {entry.action}
                                                                    </span>{' '}
                                                                    <span className="text-muted-foreground">{fieldLabel}</span>{' '}
                                                                    <span className="font-medium">
                                                                        {formatFieldName(entry.field)}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 ml-10 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                                {renderValueChip(fromLabel, entry.field, entry.old_value, viewLabel)}
                                                                {renderValueChip(toLabel, entry.field, entry.new_value, viewLabel)}
                                                            </div>
                                                        </div>
                                                        <span className="shrink-0 text-xs text-muted-foreground">
                                                            {formatTimeLabel(entry.performed_at, locale)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
