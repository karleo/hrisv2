import { router, usePage } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type PropsWithChildren,
} from 'react';
import { BiometricSyncBusyOverlay } from '@/components/biometric-sync-busy-overlay';
import { biometricReloadOnlyKeys } from '@/lib/biometric-reload-only';
import { getJsonRequestIntegrityHeaders } from '@/lib/request-integrity-headers';

const STORAGE_KEY = 'biometric_pending_sync_log_id';
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90;

type SyncStatusResponse = {
    id: number;
    status: string;
    is_running: boolean;
    fetched_count: number;
    inserted_count: number;
    in_range: number | null;
    error_message: string | null;
    summary: string;
};

type BiometricSyncContextValue = {
    isBusy: boolean;
    startDeviceSync: (
        deviceId: number,
        options?: { from?: string; to?: string },
    ) => void;
    testConnection: (deviceId: number) => void;
    setRequestBusy: (message: string | null) => void;
};

const BiometricSyncContext = createContext<BiometricSyncContextValue | null>(null);

export function useBiometricSync(): BiometricSyncContextValue {
    const context = useContext(BiometricSyncContext);

    if (context === null) {
        throw new Error('useBiometricSync must be used within BiometricSyncProvider');
    }

    return context;
}

export function BiometricSyncProvider({ children }: PropsWithChildren) {
    const { props } = usePage();
    const flash = props.flash as {
        success?: string;
        error?: string;
        sync_log_id?: number | string;
    };
    const csrfToken = typeof props.csrf_token === 'string' ? props.csrf_token : null;

    const [message, setMessage] = useState<string | null>(null);
    const [overlayDismissed, setOverlayDismissed] = useState(false);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollAttemptsRef = useRef(0);

    const clearPoll = useCallback(() => {
        if (pollTimerRef.current !== null) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }

        pollAttemptsRef.current = 0;
        sessionStorage.removeItem(STORAGE_KEY);
    }, []);

    const reloadAfterSync = useCallback((explicitReload?: boolean) => {
        if (explicitReload === false) {
            return;
        }

        const pathname = window.location.pathname;

        if (!pathname.startsWith('/biometric-attendance')) {
            return;
        }

        const only = biometricReloadOnlyKeys(pathname);

        if (only !== undefined) {
            router.reload({ only });

            return;
        }

        router.reload();
    }, []);

    const finishBusy = useCallback(
        (finalMessage: string | null, options?: { reload?: boolean }) => {
            clearPoll();
            setOverlayDismissed(false);

            const shouldReload = options?.reload ?? true;

            if (finalMessage !== null) {
                setMessage(finalMessage);
                window.setTimeout(() => {
                    setMessage(null);
                    if (shouldReload) {
                        reloadAfterSync(shouldReload);
                    }
                }, 1200);

                return;
            }

            setMessage(null);
            if (shouldReload) {
                reloadAfterSync(shouldReload);
            }
        },
        [clearPoll, reloadAfterSync],
    );

    const checkSyncStatus = useCallback(
        async (syncLogId: number): Promise<boolean> => {
            try {
                const response = await fetch(
                    `/biometric-attendance/sync-status?sync_log_id=${syncLogId}`,
                    {
                        headers: getJsonRequestIntegrityHeaders(csrfToken),
                    },
                );

                if (!response.ok) {
                    return false;
                }

                const data = (await response.json()) as SyncStatusResponse;

                if (data.is_running) {
                    return false;
                }

                if (data.status === 'completed') {
                    finishBusy(data.summary);

                    return true;
                }

                finishBusy(data.summary || data.error_message || 'Sync failed.');

                return true;
            } catch {
                return false;
            }
        },
        [csrfToken, finishBusy],
    );

    const pollSyncLog = useCallback(
        (syncLogId: number, options?: { showOverlay?: boolean }) => {
            clearPoll();
            sessionStorage.setItem(STORAGE_KEY, String(syncLogId));
            setOverlayDismissed(false);

            if (options?.showOverlay !== false) {
                setMessage('Syncing… Check Sync history for progress.');
            }

            const tick = async () => {
                pollAttemptsRef.current += 1;

                if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
                    finishBusy('Sync is taking longer than expected. Check Sync history for details.');

                    return;
                }

                const finished = await checkSyncStatus(syncLogId);

                if (finished && pollTimerRef.current !== null) {
                    clearInterval(pollTimerRef.current);
                    pollTimerRef.current = null;
                }
            };

            void tick();
            pollTimerRef.current = setInterval(() => {
                void tick();
            }, POLL_INTERVAL_MS);
        },
        [checkSyncStatus, clearPoll, finishBusy],
    );

    const pollSyncLogRef = useRef(pollSyncLog);
    pollSyncLogRef.current = pollSyncLog;

    useEffect(() => {
        const resumePendingSync = async () => {
            const stored = sessionStorage.getItem(STORAGE_KEY);

            if (stored === null || stored === '') {
                return;
            }

            const logId = Number.parseInt(stored, 10);

            if (Number.isNaN(logId)) {
                sessionStorage.removeItem(STORAGE_KEY);

                return;
            }

            try {
                const response = await fetch(
                    `/biometric-attendance/sync-status?sync_log_id=${logId}`,
                    {
                        headers: getJsonRequestIntegrityHeaders(csrfToken),
                        signal: AbortSignal.timeout(5000),
                    },
                );

                if (!response.ok) {
                    sessionStorage.removeItem(STORAGE_KEY);

                    return;
                }

                const data = (await response.json()) as SyncStatusResponse;

                if (!data.is_running) {
                    sessionStorage.removeItem(STORAGE_KEY);

                    return;
                }
            } catch {
                sessionStorage.removeItem(STORAGE_KEY);

                return;
            }

            pollSyncLogRef.current(logId);
        };

        void resumePendingSync();

        return () => {
            if (pollTimerRef.current !== null) {
                clearInterval(pollTimerRef.current);
            }
        };
    }, [csrfToken]);

    useEffect(() => {
        const raw = flash?.sync_log_id;

        if (raw === undefined || raw === null || raw === '') {
            return;
        }

        const logId = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);

        if (!Number.isNaN(logId)) {
            pollSyncLogRef.current(logId);
        }
    }, [flash?.sync_log_id]);

    const dismissOverlay = useCallback(() => {
        setOverlayDismissed(true);
        setMessage(null);
    }, []);

    const startDeviceSync = useCallback(
        (deviceId: number, options?: { from?: string; to?: string }) => {
            setOverlayDismissed(false);
            setMessage('Starting sync…');

            const start = async () => {
                const body = new FormData();
                body.append('biometric_device_id', String(deviceId));

                if (options?.from) {
                    body.append('from', options.from);
                }

                if (options?.to) {
                    body.append('to', options.to);
                }

                const token =
                    csrfToken ??
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') ??
                    '';

                if (token !== '') {
                    body.append('_token', token);
                }

                try {
                    const response = await fetch('/biometric-attendance/sync', {
                        method: 'POST',
                        body,
                        headers: getJsonRequestIntegrityHeaders(csrfToken),
                        credentials: 'same-origin',
                        signal: AbortSignal.timeout(300_000),
                    });

                    if (!response.ok) {
                        const payload = (await response.json().catch(() => null)) as {
                            message?: string;
                            sync_log_id?: number;
                        } | null;
                        const logId = payload?.sync_log_id;
                        if (logId !== undefined && !Number.isNaN(logId)) {
                            sessionStorage.removeItem(STORAGE_KEY);
                        }
                        finishBusy(
                            payload?.message ?? 'Could not start sync. Check device settings and try again.',
                            { reload: false },
                        );

                        return;
                    }

                    const data = (await response.json()) as {
                        sync_log_id?: number;
                        completed?: boolean;
                        summary?: string | null;
                        message?: string;
                    };
                    const logId = data.sync_log_id;

                    if (logId === undefined || Number.isNaN(logId)) {
                        finishBusy('Sync started but status could not be tracked. Check Sync history.');

                        return;
                    }

                    if (data.completed === true) {
                        finishBusy(data.summary ?? data.message ?? 'Import finished.');

                        return;
                    }

                    pollSyncLog(logId, { showOverlay: true });
                } catch {
                    finishBusy('Could not start sync. Check your connection and try again.');
                }
            };

            void start();
        },
        [csrfToken, clearPoll, finishBusy, pollSyncLog],
    );

    const testConnection = useCallback(
        async (deviceId: number) => {
            setOverlayDismissed(false);
            setMessage('Testing device connection…');

            const body = new FormData();
            const token =
                csrfToken ??
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ??
                '';

            if (token !== '') {
                body.append('_token', token);
            }

            try {
                const response = await fetch(`/biometric-attendance/devices/${deviceId}/test`, {
                    method: 'POST',
                    body,
                    headers: getJsonRequestIntegrityHeaders(csrfToken),
                    credentials: 'same-origin',
                    signal: AbortSignal.timeout(60_000),
                });

                const payload = (await response.json().catch(() => null)) as {
                    ok?: boolean;
                    message?: string;
                } | null;

                const resultMessage =
                    payload?.message ??
                    (response.ok
                        ? 'Connection test finished.'
                        : 'Connection test failed. Check device settings.');

                setMessage(resultMessage);
                if (payload?.ok) {
                    const pathname = window.location.pathname;
                    const only =
                        pathname === '/biometric-attendance/connectivity'
                            ? ['devices']
                            : pathname === '/biometric-attendance'
                              ? ['devices', 'recentSyncLogs']
                              : undefined;

                    if (only !== undefined) {
                        router.reload({ only });
                    }
                }
                window.setTimeout(() => setMessage(null), 8000);
            } catch {
                setMessage(
                    'Connection test timed out after 60s. Check device IP and web password, or run: php artisan biometric:test-device-web 12',
                );
                window.setTimeout(() => setMessage(null), 5000);
            }
        },
        [csrfToken],
    );

    const setRequestBusy = useCallback((busyMessage: string | null) => {
        if (busyMessage === null) {
            setMessage(null);

            return;
        }

        setMessage(busyMessage);
    }, []);

    const value = useMemo(
        () => ({
            isBusy: message !== null,
            startDeviceSync,
            testConnection,
            setRequestBusy,
        }),
        [message, startDeviceSync, testConnection, setRequestBusy],
    );

    return (
        <BiometricSyncContext.Provider value={value}>
            {children}
            <BiometricSyncBusyOverlay
                open={message !== null && !overlayDismissed}
                message={message ?? ''}
                onDismiss={dismissOverlay}
            />
        </BiometricSyncContext.Provider>
    );
}