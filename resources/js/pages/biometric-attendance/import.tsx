import { Link } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BiometricAttendanceNav } from '@/components/biometric-attendance-nav';
import { useBiometricSync } from '@/contexts/biometric-sync-context';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import BiometricAttendanceLayout from '@/layouts/biometric-attendance-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Biometric attendance', href: '/biometric-attendance' },
    { title: 'Import attendance', href: '/biometric-attendance/import' },
];

export default function BiometricImport(props: {
    activeDevices: Array<{ id: number; name: string; host: string | null; connection_type: string }>;
    canImport: boolean;
    iclockPushUrl: string;
    runningSyncCount: number;
    defaultImportRange: { from: string; to: string };
}) {
    return (
        <BiometricAttendanceLayout breadcrumbs={breadcrumbs} title="Import attendance">
            <BiometricImportContent {...props} />
        </BiometricAttendanceLayout>
    );
}

function BiometricImportContent({
    activeDevices,
    canImport,
    iclockPushUrl,
    runningSyncCount,
    defaultImportRange,
}: {
    activeDevices: Array<{ id: number; name: string; host: string | null; connection_type: string }>;
    canImport: boolean;
    iclockPushUrl: string;
    runningSyncCount: number;
    defaultImportRange: { from: string; to: string };
}) {
    const { startDeviceSync, isBusy } = useBiometricSync();
    const [selectedDeviceId, setSelectedDeviceId] = useState(
        activeDevices[0]?.id ? String(activeDevices[0].id) : '',
    );

    const selectedDevice = useMemo(
        () => activeDevices.find((d) => String(d.id) === selectedDeviceId),
        [activeDevices, selectedDeviceId],
    );

    const usesAdmsPush = selectedDevice?.connection_type === 'adms_push';
    const usesDeviceWebReport = selectedDevice?.connection_type === 'device_web_report';
    const canPullOrProcess =
        usesDeviceWebReport || usesAdmsPush || selectedDevice?.connection_type === 'tcp_pull';
    const defaultFrom = defaultImportRange.from;
    const defaultTo = defaultImportRange.to;

    return (
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Import attendance"
                    description="Pull or process clock-in/out from the device into the database."
                />
                <BiometricAttendanceNav currentPath="/biometric-attendance/import" />

                {selectedDevice?.connection_type === 'tcp_pull' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
                        <strong>TCP pull does not work on this iClock990.</strong> On{' '}
                        <Link href="/biometric-attendance/connectivity" className="font-medium underline">
                            Connectivity
                        </Link>
                        , switch to <strong>Device web report</strong> (reads from{' '}
                        <code className="text-xs">http://{selectedDevice.host}</code>) or ADMS push (
                        <code className="text-xs break-all">{iclockPushUrl}</code>).
                    </div>
                )}

                {usesDeviceWebReport && selectedDevice?.host && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        <strong>Use the same dates as on the device (including year).</strong> Open{' '}
                        <code className="text-xs">http://{selectedDevice.host}</code>, go to <strong>Report</strong>,
                        click <strong>Search</strong>, then match <strong>From / To</strong> below (defaults: last 7
                        days). HRIS imports
                        by device <strong>ID Number</strong> (PIN) and in/out times only — names on the device are not
                        matched to HR employees unless you map PINs later.
                    </div>
                )}

                {runningSyncCount > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        {runningSyncCount} import job(s) running.{' '}
                        <Link href="/biometric-attendance/sync-logs" className="font-medium underline">
                            Sync history
                        </Link>{' '}
                        updates when finished. You can keep browsing other tabs.
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {usesAdmsPush
                                ? 'Process stored punches'
                                : usesDeviceWebReport
                                  ? 'Pull from device web report'
                                  : 'Pull from device'}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                            {usesAdmsPush ? (
                                <>
                                    Tries to pull from the device at{' '}
                                    <code className="text-xs">http://{selectedDevice?.host}</code> (Report page) when
                                    configured, processes any punches already pushed to{' '}
                                    <code className="text-xs break-all">{iclockPushUrl}</code>, and queues ADMS commands
                                    for live sync. Use the same dates as the device report.
                                </>
                            ) : usesDeviceWebReport ? (
                                <>
                                    Logs in to the iClock at{' '}
                                    <code className="text-xs">http://{selectedDevice?.host}</code>, runs Report for the
                                    date range, and imports IN/OUT rows.
                                </>
                            ) : (
                                <>
                                    Fetches logs from the device IP and stores punches. If pull fails, use{' '}
                                    <Link href="/biometric-attendance/connectivity" className="text-primary underline">
                                        Connectivity
                                    </Link>{' '}
                                    → Switch to device web report or ADMS push.
                                </>
                            )}
                        </p>
                    </CardHeader>
                    <CardContent>
                        {!canImport && (
                            <p className="text-muted-foreground mb-4 text-sm">
                                Your role needs Biometric attendance → Update to import data.
                            </p>
                        )}
                        {activeDevices.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No active devices.{' '}
                                <Link href="/biometric-attendance" className="text-primary underline">
                                    Add and activate a device
                                </Link>
                                .
                            </p>
                        ) : (
                            <form
                                className="grid gap-4 md:grid-cols-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!canImport) {
                                        return;
                                    }

                                    const data = new FormData(e.currentTarget);
                                    const deviceId = Number(data.get('biometric_device_id'));
                                    const from = String(data.get('from') ?? '');
                                    const to = String(data.get('to') ?? '');

                                    if (!deviceId || !from || !to) {
                                        return;
                                    }

                                    startDeviceSync(deviceId, { from, to });
                                }}
                            >
                                <div>
                                    <Label>Device</Label>
                                    <NativeSelect
                                        name="biometric_device_id"
                                        value={selectedDeviceId}
                                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                                        required
                                    >
                                        {activeDevices.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                                {d.host ? ` (${d.host})` : ''}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <div>
                                    <Label>From date</Label>
                                    <Input name="from" type="date" defaultValue={defaultFrom} required />
                                </div>
                                <div>
                                    <Label>To date</Label>
                                    <Input name="to" type="date" defaultValue={defaultTo} required />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        type="submit"
                                        disabled={isBusy || !canImport || !canPullOrProcess}
                                        className="w-full md:w-auto"
                                    >
                                        <Download className="mr-2 size-4" />
                                        {usesDeviceWebReport
                                            ? 'Pull report & import'
                                            : usesAdmsPush
                                              ? 'Import attendance'
                                              : 'Pull & import (unavailable)'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">After import</CardTitle>
                        <p className="text-muted-foreground text-sm">
                            Each row stores <strong>device PIN</strong>, <strong>in/out</strong>, and{' '}
                            <strong>time</strong> only (no names from the terminal). View them under{' '}
                            <strong>Raw punches</strong>. Linking PINs to HR employees is optional and can be done later.
                        </p>
                    </CardHeader>
                    <CardContent className="text-muted-foreground space-y-2 text-sm">
                        <p>
                            1. Check{' '}
                            <Link href="/biometric-attendance/punches" className="text-primary underline">
                                Raw punches
                            </Link>{' '}
                            for new rows.
                        </p>
                        <p>
                            2. Review{' '}
                            <Link href="/biometric-attendance/sync-logs" className="text-primary underline">
                                Sync history
                            </Link>{' '}
                            for errors.
                        </p>
                    </CardContent>
                </Card>
            </div>
    );
}
