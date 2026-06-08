import { Spinner } from '@/components/ui/spinner';
import { useSidebarNavigation } from '@/contexts/sidebar-navigation-context';

export function NavigationLoadingOverlay() {
    const { isNavigating } = useSidebarNavigation();

    if (!isNavigating) {
        return null;
    }

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/55 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="Loading page"
        >
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-card/95 px-8 py-6 shadow-lg">
                <Spinner className="size-9 text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                    Loading…
                </p>
            </div>
        </div>
    );
}
