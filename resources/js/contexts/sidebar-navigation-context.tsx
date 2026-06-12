import { router } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

type SidebarNavigationContextValue = {
    isNavigating: boolean;
    beginNavigation: () => void;
};

const SidebarNavigationContext =
    createContext<SidebarNavigationContextValue | null>(null);

export function SidebarNavigationProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const clear = (): void => {
            setIsNavigating(false);
        };

        const removeFinish = router.on('finish', clear);
        const removeCancel = router.on('cancel', clear);
        const removeError = router.on('error', clear);

        return () => {
            removeFinish();
            removeCancel();
            removeError();
        };
    }, []);

    const beginNavigation = useCallback((): void => {
        setIsNavigating(true);
    }, []);

    return (
        <SidebarNavigationContext.Provider
            value={{ isNavigating, beginNavigation }}
        >
            {children}
        </SidebarNavigationContext.Provider>
    );
}

export function useSidebarNavigation(): SidebarNavigationContextValue {
    const context = useContext(SidebarNavigationContext);

    if (context === null) {
        throw new Error(
            'useSidebarNavigation must be used within SidebarNavigationProvider',
        );
    }

    return context;
}
