/**
 * Partial Inertia reload keys per biometric page — avoids full page reload after sync.
 */
export function biometricReloadOnlyKeys(pathname: string): string[] | undefined {
    if (pathname === '/biometric-attendance/import') {
        return ['runningSyncCount', 'activeDevices'];
    }

    if (pathname === '/biometric-attendance/connectivity') {
        return ['devices'];
    }

    if (pathname === '/biometric-attendance/punches') {
        return ['punches', 'filters'];
    }

    if (pathname === '/biometric-attendance/sync-logs') {
        return ['syncLogs', 'filters'];
    }

    if (pathname === '/biometric-attendance') {
        return ['devices', 'recentSyncLogs', 'unmappedPunchesCount'];
    }

    return undefined;
}
