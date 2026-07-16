import { useEffect, useState } from 'react';

// Returns a live Date object updated every second
export function useLiveClock(): Date {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    return now;
}

export function formatLiveClockTime(date: Date): string {
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export function formatLiveClockDate(date: Date, locale = 'en'): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString(locale, { month: 'long' });
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}
