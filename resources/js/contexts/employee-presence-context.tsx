import { usePage } from '@inertiajs/react';
import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { getEcho } from '@/lib/echo';
import { getJsonRequestIntegrityHeaders } from '@/lib/request-integrity-headers';
import type {
    EmployeePresencePayload,
    PresenceEmployee,
} from '@/types/employee-presence';

export type { PresenceEmployee } from '@/types/employee-presence';

type EmployeePresenceValue = {
    onlineEmployeeIds: Set<number>;
    onlineEmployees: PresenceEmployee[];
    /**
     * synced: Inertia shared presence and/or Reverb payload is available.
     * pending: waiting for first presence payload (should be brief).
     * unavailable: no employee session or presence data missing from the page.
     */
    presenceSyncState: 'pending' | 'synced' | 'unavailable';
};

const EmployeePresenceContext = createContext<EmployeePresenceValue | null>(
    null,
);

const emptyValue: EmployeePresenceValue = {
    onlineEmployeeIds: new Set(),
    onlineEmployees: [],
    presenceSyncState: 'unavailable',
};

const PRESENCE_POLL_INTERVAL_MS = 25_000;
const HEARTBEAT_INTERVAL_MS = 45_000;

function toEmployeeId(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    const n = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(n) || n < 1) {
        return null;
    }

    return Math.trunc(n);
}

function normalizePresenceEmployee(
    employee: PresenceEmployee,
): PresenceEmployee {
    const id = toEmployeeId(employee.id);

    return id === null ? employee : { ...employee, id };
}

function payloadFromProps(
    payload: EmployeePresencePayload | undefined | null,
): { ids: Set<number>; employees: PresenceEmployee[] } {
    if (payload === undefined || payload === null) {
        return { ids: new Set(), employees: [] };
    }

    const ids = Array.isArray(payload.employee_ids)
        ? payload.employee_ids
              .map((id) => toEmployeeId(id))
              .filter((id): id is number => id !== null)
        : [];

    const employees = Array.isArray(payload.employees) ? payload.employees : [];

    return {
        ids: new Set(ids),
        employees,
    };
}

function shouldDebugEmployeePresence(): boolean {
    if (!import.meta.env.DEV) {
        return false;
    }

    if (typeof localStorage === 'undefined') {
        return false;
    }

    return localStorage.getItem('debug_employee_presence') === '1';
}

export function EmployeePresenceProvider({
    children,
}: {
    children: ReactNode;
}): ReactNode {
    const page = usePage();
    const csrfToken =
        typeof page.props.csrf_token === 'string' ? page.props.csrf_token : null;

    const pageProps = page.props as {
        viewerEmployeeId?: unknown;
        auth?: { employee_id?: unknown };
        currentEmployee?: { id?: unknown };
        employeePresence?: EmployeePresencePayload;
    };

    const resolvedSelfIdFromProps = useMemo(
        () =>
            toEmployeeId(pageProps.viewerEmployeeId) ??
            toEmployeeId(pageProps.auth?.employee_id) ??
            toEmployeeId(pageProps.currentEmployee?.id),
        [
            pageProps.viewerEmployeeId,
            pageProps.auth?.employee_id,
            pageProps.currentEmployee?.id,
        ],
    );

    const lastKnownSelfEmployeeIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (resolvedSelfIdFromProps !== null) {
            lastKnownSelfEmployeeIdRef.current = resolvedSelfIdFromProps;
        }
    }, [resolvedSelfIdFromProps]);

    const selfEmployeeId =
        resolvedSelfIdFromProps ?? lastKnownSelfEmployeeIdRef.current;

    const [presencePayload, setPresencePayload] = useState<
        EmployeePresencePayload | null
    >(() => pageProps.employeePresence ?? null);

    useEffect(() => {
        if (pageProps.employeePresence !== undefined) {
            setPresencePayload(pageProps.employeePresence);
        }
    }, [pageProps.employeePresence]);

    const fetchPresence = useCallback(async (): Promise<void> => {
        if (selfEmployeeId === null) {
            return;
        }

        try {
            const response = await fetch('/employee-presence', {
                headers: getJsonRequestIntegrityHeaders(csrfToken),
                credentials: 'same-origin',
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as EmployeePresencePayload;
            setPresencePayload(payload);
        } catch {
            // Keep last known presence on transient failures.
        }
    }, [csrfToken, selfEmployeeId]);

    useEffect(() => {
        if (selfEmployeeId === null) {
            return;
        }

        void fetchPresence();

        const pollIntervalId = window.setInterval(() => {
            void fetchPresence();
        }, PRESENCE_POLL_INTERVAL_MS);

        const sendHeartbeat = async (): Promise<void> => {
            try {
                const response = await fetch('/employee-presence/heartbeat', {
                    method: 'POST',
                    headers: {
                        ...getJsonRequestIntegrityHeaders(csrfToken),
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({}),
                });

                if (response.ok) {
                    await fetchPresence();
                }
            } catch {
                // Ignore transient heartbeat failures.
            }
        };

        void sendHeartbeat();
        const heartbeatIntervalId = window.setInterval(() => {
            void sendHeartbeat();
        }, HEARTBEAT_INTERVAL_MS);

        return () => {
            window.clearInterval(pollIntervalId);
            window.clearInterval(heartbeatIntervalId);
        };
    }, [fetchPresence, selfEmployeeId, csrfToken]);

    useEffect(() => {
        if (!shouldDebugEmployeePresence()) {
            return;
        }

        console.debug('[employee-presence]', {
            url: page.url,
            resolvedSelfIdFromProps,
            persistedSelfId: lastKnownSelfEmployeeIdRef.current,
            effectiveSelfEmployeeId: selfEmployeeId,
            viewerEmployeeId: pageProps.viewerEmployeeId,
            authEmployeeId: pageProps.auth?.employee_id,
            currentEmployeeId: pageProps.currentEmployee?.id,
            hasEmployeePresenceProp: presencePayload !== null,
            employeePresenceKeys:
                presencePayload && typeof presencePayload === 'object'
                    ? Object.keys(presencePayload)
                    : [],
        });
    }, [
        page.url,
        presencePayload,
        pageProps.auth?.employee_id,
        pageProps.currentEmployee?.id,
        pageProps.viewerEmployeeId,
        resolvedSelfIdFromProps,
        selfEmployeeId,
    ]);

    const [echoOnlineIds, setEchoOnlineIds] = useState(() => new Set<number>());
    const [echoOnlineEmployees, setEchoOnlineEmployees] = useState<
        PresenceEmployee[]
    >([]);
    const [echoSynced, setEchoSynced] = useState(false);

    const inertiaPresence = useMemo(() => {
        if (selfEmployeeId === null) {
            return {
                ids: new Set<number>(),
                employees: [] as PresenceEmployee[],
            };
        }

        return payloadFromProps(presencePayload);
    }, [selfEmployeeId, presencePayload]);

    useEffect(() => {
        if (selfEmployeeId === null) {
            queueMicrotask(() => {
                setEchoOnlineIds(new Set());
                setEchoOnlineEmployees([]);
                setEchoSynced(false);
            });

            return;
        }

        const echo = getEcho();
        if (!echo) {
            return;
        }

        let cancelled = false;

        queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            const presenceChannel = echo.join('employees.online');

            presenceChannel
                .here((employees: PresenceEmployee[]) => {
                    setEchoSynced(true);
                    const normalized = employees
                        .map((employee) =>
                            normalizePresenceEmployee(employee),
                        )
                        .filter(
                            (employee) => toEmployeeId(employee.id) !== null,
                        );
                    setEchoOnlineIds(
                        new Set(normalized.map((employee) => employee.id)),
                    );
                    setEchoOnlineEmployees(
                        normalized.filter(
                            (employee) =>
                                toEmployeeId(employee.id) !== selfEmployeeId,
                        ),
                    );
                })
                .joining((employee: PresenceEmployee) => {
                    const member = normalizePresenceEmployee(employee);
                    const id = toEmployeeId(member.id);
                    if (id === null) {
                        return;
                    }

                    setEchoOnlineIds(
                        (current) => new Set([...current, id]),
                    );
                    if (id !== selfEmployeeId) {
                        setEchoOnlineEmployees((current) => [
                            member,
                            ...current.filter((item) => item.id !== id),
                        ]);
                    }
                })
                .leaving((employee: PresenceEmployee) => {
                    const id = toEmployeeId(employee.id);
                    if (id === null) {
                        return;
                    }

                    setEchoOnlineIds((current) => {
                        const next = new Set(current);
                        next.delete(id);

                        return next;
                    });
                    setEchoOnlineEmployees((current) =>
                        current.filter((item) => item.id !== id),
                    );
                });
        });

        return () => {
            cancelled = true;
            echo.leave('employees.online');
            setEchoSynced(false);
            setEchoOnlineIds(new Set());
            setEchoOnlineEmployees([]);
        };
    }, [selfEmployeeId]);

    const mergedOnlineIds = useMemo(() => {
        if (echoSynced) {
            return echoOnlineIds;
        }

        return inertiaPresence.ids;
    }, [echoSynced, echoOnlineIds, inertiaPresence.ids]);

    const mergedOnlineEmployees = useMemo(() => {
        if (echoSynced) {
            return echoOnlineEmployees;
        }

        return inertiaPresence.employees.filter(
            (employee) => employee.id !== selfEmployeeId,
        );
    }, [
        echoSynced,
        echoOnlineEmployees,
        inertiaPresence.employees,
        selfEmployeeId,
    ]);

    const presenceSyncState = useMemo((): EmployeePresenceValue['presenceSyncState'] => {
        if (presencePayload === undefined || presencePayload === null) {
            return 'unavailable';
        }

        if (selfEmployeeId === null) {
            return 'unavailable';
        }

        return 'synced';
    }, [selfEmployeeId, presencePayload]);

    const value = useMemo(
        () => ({
            onlineEmployeeIds: mergedOnlineIds,
            onlineEmployees: mergedOnlineEmployees,
            presenceSyncState,
        }),
        [mergedOnlineIds, mergedOnlineEmployees, presenceSyncState],
    );

    return (
        <EmployeePresenceContext.Provider value={value}>
            {children}
        </EmployeePresenceContext.Provider>
    );
}

export function useEmployeePresence(): EmployeePresenceValue {
    const context = useContext(EmployeePresenceContext);

    return context ?? emptyValue;
}
