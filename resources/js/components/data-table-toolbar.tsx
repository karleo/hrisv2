import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DataTableToolbarProps = {
    searchUrl: string;
    searchPlaceholder?: string;
    filters?: { search?: string };
    /** Merged into every navigation (e.g. department or status filters). Empty values are omitted. */
    persistQuery?: Record<string, string | number | undefined>;
    autoSearch?: boolean;
    debounceMs?: number;
    showSearchButton?: boolean;
};

function mergePersistQuery(
    base: Record<string, string | number>,
    persistQuery?: Record<string, string | number | undefined>,
): Record<string, string | number> {
    if (!persistQuery) {
        return base;
    }
    const out = { ...base };
    for (const [key, value] of Object.entries(persistQuery)) {
        if (value !== undefined && value !== '') {
            out[key] = value;
        }
    }
    return out;
}

export function DataTableToolbar({
    searchUrl,
    searchPlaceholder = 'Search...',
    filters = {},
    persistQuery,
    autoSearch = false,
    debounceMs = 300,
    showSearchButton = true,
}: DataTableToolbarProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const trimmedSearch = useMemo(() => search.trim(), [search]);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            const params = mergePersistQuery({ page: 1 }, persistQuery);
            if (trimmedSearch) params.search = trimmedSearch;
            router.get(searchUrl, params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [searchUrl, trimmedSearch, persistQuery]
    );

    const handleClear = useCallback(() => {
        setSearch('');
        router.get(searchUrl, mergePersistQuery({ page: 1 }, persistQuery), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [searchUrl, persistQuery]);

    useEffect(() => {
        if (!autoSearch) return;

        const handle = setTimeout(() => {
            const params = mergePersistQuery({ page: 1 }, persistQuery);
            if (trimmedSearch) params.search = trimmedSearch;

            router.get(searchUrl, params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, debounceMs);

        return () => clearTimeout(handle);
    }, [autoSearch, debounceMs, searchUrl, trimmedSearch, persistQuery]);

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
            {showSearchButton && (
                <Button type="submit" variant="secondary" size="sm">
                    Search
                </Button>
            )}
            {filters.search && !autoSearch && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                >
                    Clear
                </Button>
            )}
            {(autoSearch && search.trim().length > 0) && (
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
