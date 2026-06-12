import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { getJsonRequestIntegrityHeaders } from '@/lib/request-integrity-headers';

export type EmployeeMessagesHeaderData = {
    unread_count: number;
    conversations: Array<{
        id: number;
        employee: {
            id: number;
            full_name: string;
            photo_url: string | null;
        };
        last_message: { body: string } | null;
        last_message_at: string | null;
        unread_count: number;
    }>;
};

const POLL_INTERVAL_MS = 5000;

/**
 * Polls chat header data via JSON instead of Inertia partial reloads so form pages
 * (e.g. departments/create) keep their page props.
 */
export function useEmployeeMessagesHeaderSync(
    initial: EmployeeMessagesHeaderData | undefined,
): EmployeeMessagesHeaderData | undefined {
    const csrfToken =
        typeof usePage().props.csrf_token === 'string'
            ? usePage().props.csrf_token
            : null;

    const [data, setData] = useState(initial);

    useEffect(() => {
        setData(initial);
    }, [initial]);

    const fetchLatest = useCallback(async (): Promise<void> => {
        if (initial === undefined) {
            return;
        }

        try {
            const response = await fetch('/employee-messages/header', {
                headers: getJsonRequestIntegrityHeaders(csrfToken),
                credentials: 'same-origin',
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as EmployeeMessagesHeaderData;
            setData(payload);
        } catch {
            // Ignore transient network errors; keep last known header data.
        }
    }, [csrfToken, initial]);

    useEffect(() => {
        if (initial === undefined) {
            return;
        }

        const intervalId = window.setInterval(() => {
            void fetchLatest();
        }, POLL_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [fetchLatest, initial]);

    return data;
}
