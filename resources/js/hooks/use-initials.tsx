import { useCallback } from 'react';

export type GetInitialsFn = (fullName: string) => string;

/** Single letter from the first word of the display name (for avatars when no photo). */
export function getFirstNameLetter(fullName: string): string {
    const segment = fullName.trim().split(/\s+/).filter(Boolean)[0];
    if (!segment) {
        return '?';
    }

    return segment.charAt(0).toUpperCase();
}

export function useInitials(): GetInitialsFn {
    return useCallback((fullName: string): string => {
        const names = fullName.trim().split(' ');

        if (names.length === 0) return '';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();

        const firstInitial = names[0].charAt(0);
        const lastInitial = names[names.length - 1].charAt(0);

        return `${firstInitial}${lastInitial}`.toUpperCase();
    }, []);
}
