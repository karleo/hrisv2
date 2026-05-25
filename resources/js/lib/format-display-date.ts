/**
 * Format an ISO date (YYYY-MM-DD) for display as DD/MM/YYYY.
 */
export function formatDisplayDate(value: string | null | undefined): string {
    if (value === null || value === undefined || value.trim() === '') {
        return '—';
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

    if (!match) {
        return value;
    }

    return `${match[3]}/${match[2]}/${match[1]}`;
}
