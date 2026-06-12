import { Link, router } from '@inertiajs/react';
import { Download, Fingerprint, Wifi } from 'lucide-react';
import { useState } from 'react';
import { BiometricAttendanceNav } from '@/components/biometric-attendance-nav';
import { useBiometricSync } from '@/contexts/biometric-sync-context';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BiometricAttendanceLayout from '@/layouts/biometric-attendance-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Biometric attendance', href: '/biometric-attendance' },
    { title: 'Connectivity', href: '/biometric-attendance/connectivity' },
];

type DeviceRow = {
    id: number;
    name: string;
    host: string | null;
    port: number;
    connection_type: string;
    is_active: boolean;
    last_sync_at: string | null;
    last_sync_status: string | null;
    last_error: string | null;
    protocol: string;
    last_adms_push_at: string | null;
    last_connectivity_test_at: string | null;
};

export default function BiometricConnectivity(props: {
    devices: DeviceRow[];
    canImport: boolean;
    canManageDevices: boolean;
    defaultImportRange: { from: string; to: string };
    iclockPushUrl: string;
    pushUsesLocalhost: boolean;
    hasAdmsDevices: boolean;
    hasWebReportDevices: boolean;
}) {
    return (
        <BiometricAttendanceLayout breadcrumbs={breadcrumbs} title="Device connectivity">
            <BiometricConnectivityContent {...props} />
        </BiometricAttendanceLayout>
    );
}

function BiometricConnectivityContent({
    devices,
    canImport,
    canManageDevices,
    defaultImportRange,
    iclockPushUrl,
    pushUsesLocalhost,
    hasAdmsDevices,
    hasWebReportDevices,
}: {
    devices: DeviceRow[];
    canImport: boolean;
    canManageDevices: boolean;
    defaultImportRange: { from: string; to: string };
    iclockPushUrl: string;
    pushUsesLocalhost: boolean;
    hasAdmsDevices: boolean;
    hasWebReportDevices: boolean;
}) {
    const { testConnection, startDeviceSync, isBusy } = useBiometricSync();
    const [pullFrom, setPullFrom] = useState(defaultImportRange.from);
    const [pullTo, setPullTo] = useState(defaultImportRange.to);
    const webReportDeviceHost =
        devices.find((d) => d.connection_type === 'device_web_report' && d.host)?.host ?? 'DEVICE_IP';

    return (
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Connectivity"
                    description="Test login to the device, then pull attendance for a date range (same dates as on the device Report page)."
                />
                <BiometricAttendanceNav currentPath="/biometric-attendance/connectivity" />

                {pushUsesLocalhost && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        Set <code className="text-xs">BIOMETRIC_PUSH_BASE_URL</code> in .env to your PC LAN IP (not
                        localhost) so the iClock can push punches.
                    </div>
                )}

                {hasWebReportDevices && (
                    <Card className="border-amber-200 bg-amber-50/80">
                        <CardHeader>
                            <CardTitle className="text-base text-amber-950">
                                SessionID required (device web report)
                            </CardTitle>
                            <p className="text-sm text-amber-950">
                                HRIS must read a cookie from the <strong>iClock</strong>, not from this page. If Test
                                connectivity fails with “Could not obtain SessionID”:
                            </p>
                            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-amber-950">
                                <li>
                                    Open a <strong>new tab</strong> →{' '}
                                    <code className="text-xs">http://{webReportDeviceHost}</code> (your device IP).
                                </li>
                                <li>
                                    Press F12 → <strong>Network</strong> → reload (Ctrl+R).
                                </li>
                                <li>
                                    Click the <strong>first</strong> row for <code className="text-xs">192.168.1.44</code>{' '}
                                    (not “connectivity” or “test” — those are HRIS).
                                </li>
                                <li>
                                    <strong>Headers</strong> → Response →{' '}
                                    <code className="text-xs">Set-Cookie: SessionID=1234567890</code> — copy the
                                    number.
                                </li>
                                <li>
                                    <Link href="/biometric-attendance" className="font-medium underline">
                                        Devices → Edit iClock
                                    </Link>
                                    , paste into <strong>Web SessionID</strong>, Save.
                                </li>
                                <li>Close the device tab, wait 30 seconds, then <strong>Test connectivity</strong>.</li>
                            </ol>
                            <p className="text-muted-foreground mt-3 text-xs">
                                Or run: <code className="text-xs">php artisan biometric:show-device-web-session 12</code>
                            </p>
                        </CardHeader>
                    </Card>
                )}

                {hasAdmsDevices && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">ADMS push URL (optional live sync)</CardTitle>
                            <p className="text-muted-foreground text-sm">
                                For automatic punches, configure the terminal cloud server to:{' '}
                                <code className="text-xs break-all">{iclockPushUrl}</code>
                            </p>
                        </CardHeader>
                    </Card>
                )}

                {devices.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No devices yet.{' '}
                        <Link href="/biometric-attendance" className="text-primary underline">
                            Add a device
                        </Link>
                        .
                    </p>
                ) : (
                    devices.map((device) => (
                        <Card key={device.id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Fingerprint className="size-5 text-muted-foreground" />
                                    <CardTitle>{device.name}</CardTitle>
                                </div>
                                <span
                                    className={
                                        device.is_active
                                            ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800'
                                            : 'rounded-full bg-muted px-2 py-0.5 text-xs'
                                    }
                                >
                                    {device.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <p>
                                    <span className="text-muted-foreground">Connection:</span>{' '}
                                    {device.connection_type === 'adms_push'
                                        ? 'ADMS push'
                                        : device.connection_type === 'device_web_report'
                                          ? 'Device web report'
                                          : 'TCP pull'}
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Host:</span> {device.host ?? '—'}
                                    {device.connection_type === 'device_web_report'
                                        ? ` (web port ${device.port || 80})`
                                        : `:${device.port} (${(device.protocol ?? 'tcp').toUpperCase()})`}
                                </p>
                                {device.connection_type === 'adms_push' && (
                                    <p>
                                        <span className="text-muted-foreground">Last push:</span>{' '}
                                        {device.last_adms_push_at
                                            ? new Date(device.last_adms_push_at).toLocaleString()
                                            : 'Never — configure cloud server on terminal'}
                                    </p>
                                )}
                                <p>
                                    <span className="text-muted-foreground">Last import:</span>{' '}
                                    {device.last_sync_at
                                        ? new Date(device.last_sync_at).toLocaleString()
                                        : 'Never'}
                                    {device.last_sync_status ? ` (${device.last_sync_status})` : ''}
                                </p>
                                {device.connection_type === 'device_web_report' && (
                                    <p>
                                        <span className="text-muted-foreground">Last connectivity test:</span>{' '}
                                        {device.last_connectivity_test_at
                                            ? new Date(device.last_connectivity_test_at).toLocaleString()
                                            : 'Not tested yet'}
                                    </p>
                                )}
                                {device.last_error && (
                                    <p className="text-destructive">{device.last_error}</p>
                                )}
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => testConnection(device.id)}
                                    >
                                        <Wifi className="mr-1 size-4" />
                                        Test connectivity
                                    </Button>
                                    {device.connection_type !== 'device_web_report' && canManageDevices && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        'Switch to device web report pull? HRIS will log in to http://DEVICE_IP and read attendance from the Report page (same as in the device browser).',
                                                    )
                                                ) {
                                                    router.post(
                                                        `/biometric-attendance/devices/${device.id}/use-device-web-report`,
                                                    );
                                                }
                                            }}
                                        >
                                            Switch to web report pull
                                        </Button>
                                    )}
                                    {device.connection_type !== 'adms_push' && canManageDevices && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        'Switch this device to ADMS push? Terminal must push to HRIS.',
                                                    )
                                                ) {
                                                    router.post(
                                                        `/biometric-attendance/devices/${device.id}/use-adms-push`,
                                                    );
                                                }
                                            }}
                                        >
                                            Switch to ADMS push
                                        </Button>
                                    )}
                                    {device.connection_type !== 'device_web_report' && (
                                        <Button type="button" size="sm" variant="secondary" asChild>
                                            <Link href="/biometric-attendance/import">Import attendance →</Link>
                                        </Button>
                                    )}
                                </div>
                                {device.connection_type === 'device_web_report' && (
                                    <form
                                        className="mt-4 grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-4"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (!canImport || !pullFrom || !pullTo) {
                                                return;
                                            }

                                            startDeviceSync(device.id, { from: pullFrom, to: pullTo });
                                        }}
                                    >
                                        <div className="md:col-span-4">
                                            <p className="text-sm font-medium">Pull attendance from device</p>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Match <strong>From / To</strong> to the device Report page (including
                                                year). Large ranges can take a few minutes — keep this tab open.
                                            </p>
                                        </div>
                                        <div>
                                            <Label htmlFor={`pull-from-${device.id}`}>From date</Label>
                                            <Input
                                                id={`pull-from-${device.id}`}
                                                type="date"
                                                value={pullFrom}
                                                onChange={(e) => setPullFrom(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`pull-to-${device.id}`}>To date</Label>
                                            <Input
                                                id={`pull-to-${device.id}`}
                                                type="date"
                                                value={pullTo}
                                                onChange={(e) => setPullTo(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="flex items-end md:col-span-2">
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={isBusy || !canImport || !device.is_active}
                                                className="w-full sm:w-auto"
                                            >
                                                <Download className="mr-1 size-4" />
                                                Pull report & import
                                            </Button>
                                        </div>
                                        {!canImport && (
                                            <p className="text-muted-foreground md:col-span-4 text-xs">
                                                Your role needs Biometric attendance → Update to import.
                                            </p>
                                        )}
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
    );
}
