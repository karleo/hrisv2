import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type DataTablePaginationProps = {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

export function DataTablePagination({
    links,
    from,
    to,
    total,
}: DataTablePaginationProps) {
    const { t } = useI18n();
    const prevLink = links.find((l) => l.label === '&laquo; Previous');
    const nextLink = links.find((l) => l.label === 'Next &raquo;');

    if (total <= 0) {
        return null;
    }

    const summary = t('pagination.summary', 'Showing {from} to {to} of {total} results', {
        from: from ?? 0,
        to: to ?? 0,
        total,
    });

    return (
        <div className="flex flex-col items-center justify-between gap-4 px-4 py-3 sm:flex-row">
            <p className="text-muted-foreground text-sm">{summary}</p>
            <div className="flex items-center gap-2">
                {prevLink?.url ? (
                    <Link href={prevLink.url}>
                        <Button variant="outline" size="sm">
                            <ChevronLeft className="size-4" />
                            {t('pagination.previous', 'Previous')}
                        </Button>
                    </Link>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="size-4" />
                        {t('pagination.previous', 'Previous')}
                    </Button>
                )}
                {nextLink?.url ? (
                    <Link href={nextLink.url}>
                        <Button variant="outline" size="sm">
                            {t('pagination.next', 'Next')}
                            <ChevronRight className="size-4" />
                        </Button>
                    </Link>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        {t('pagination.next', 'Next')}
                        <ChevronRight className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
