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
