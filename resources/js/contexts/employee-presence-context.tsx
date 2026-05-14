import { router, usePage, usePoll } from '@inertiajs/react';
import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { getEcho } from '@/lib/echo';
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

    usePoll(
        25000,
        {
            only: ['employeePresence', 'viewerEmployeeId'],
        },
        { keepAlive: true },
    );

    const pageProps = page.props as {
        viewerEmployeeId?: unknown;
        auth?: { employee_id?: unknown };
        currentEmployee?: { id?: unknown };
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
            hasEmployeePresenceProp: page.props.employeePresence !== undefined,
            employeePresenceKeys:
                page.props.employeePresence &&
                typeof page.props.employeePresence === 'object'
                    ? Object.keys(page.props.employeePresence)
                    : [],
        });
    }, [
        page.url,
        page.props.employeePresence,
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

        return payloadFromProps(page.props.employeePresence);
    }, [selfEmployeeId, page.props.employeePresence]);

    useEffect(() => {
        if (selfEmployeeId === null) {
            return;
        }

        const sendHeartbeat = (): void => {
            router.post(
                '/employee-presence/heartbeat',
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['employeePresence', 'viewerEmployeeId'],
                },
            );
        };

        sendHeartbeat();
        const heartbeatIntervalId = window.setInterval(sendHeartbeat, 45_000);

        return () => {
            window.clearInterval(heartbeatIntervalId);
        };
    }, [selfEmployeeId]);

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
        const payload = page.props.employeePresence;

        if (payload === undefined || payload === null) {
            return 'unavailable';
        }

        if (selfEmployeeId === null) {
            return 'unavailable';
        }

        return 'synced';
    }, [selfEmployeeId, page.props.employeePresence]);

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
