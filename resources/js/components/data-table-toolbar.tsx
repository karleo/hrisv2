import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type DataTableToolbarProps = {
    searchUrl: string;
    searchPlaceholder?: string;
    filters?: { search?: string };
};

export function DataTableToolbar({
    searchUrl,
    searchPlaceholder = 'Search...',
    filters = {},
}: DataTableToolbarProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            const params: Record<string, string | number> = { page: 1 };
            if (search.trim()) params.search = search.trim();
            router.get(searchUrl, params, {
                preserveState: true,
            });
        },
        [search, searchUrl]
    );

    const handleClear = useCallback(() => {
        setSearch('');
        router.get(searchUrl, {}, { preserveState: true });
    }, [searchUrl]);

    return (
        <form
            onSubmit={handleSearch}
            className="flex items-center gap-2"
        >
            <div className="relative flex-1 max-w-sm">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                    type="search"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Button type="submit" variant="secondary" size="sm">
                Search
            </Button>
            {filters.search && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                >
                    Clear
                </Button>
            )}
        </form>
    );
}
