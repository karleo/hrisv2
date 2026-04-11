import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Radix DropdownMenuTrigger opens on pointerdown. The following pointerup can land on the
 * first row inside the menu (“ghost click”), firing mark-as-read before the user reads the list.
 * Briefly disable pointer events on the list so that carry-over pointer release is ignored.
 */
export function useNotificationListPointerGuard(isOpen: boolean): RefObject<HTMLDivElement | null> {
    const listRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }

        const arm = (el: HTMLDivElement): (() => void) => {
            el.style.setProperty('pointer-events', 'none');
            const timeoutId = window.setTimeout(() => {
                el.style.removeProperty('pointer-events');
            }, 200);

            return () => {
                window.clearTimeout(timeoutId);
                el.style.removeProperty('pointer-events');
            };
        };

        const el = listRef.current;
        if (el) {
            return arm(el);
        }

        let disarm: (() => void) | undefined;
        const frameId = window.requestAnimationFrame(() => {
            const next = listRef.current;
            if (next) {
                disarm = arm(next);
            }
        });

        return () => {
            window.cancelAnimationFrame(frameId);
            disarm?.();
        };
    }, [isOpen]);

    return listRef;
}
