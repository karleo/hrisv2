import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    const prevLink = links.find((l) => l.label === '&laquo; Previous');
    const nextLink = links.find((l) => l.label === 'Next &raquo;');

    if (total <= 0) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-between gap-4 px-4 py-3 sm:flex-row">
            <p className="text-muted-foreground text-sm">
                Showing{' '}
                <span className="font-medium">
                    {from ?? 0}
                </span>{' '}
                to{' '}
                <span className="font-medium">{to ?? 0}</span> of{' '}
                <span className="font-medium">{total}</span> results
            </p>
            <div className="flex items-center gap-2">
                {prevLink?.url ? (
                    <Link href={prevLink.url}>
                        <Button variant="outline" size="sm">
                            <ChevronLeft className="size-4" />
                            Previous
                        </Button>
                    </Link>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="size-4" />
                        Previous
                    </Button>
                )}
                {nextLink?.url ? (
                    <Link href={nextLink.url}>
                        <Button variant="outline" size="sm">
                            Next
                            <ChevronRight className="size-4" />
                        </Button>
                    </Link>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        Next
                        <ChevronRight className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
