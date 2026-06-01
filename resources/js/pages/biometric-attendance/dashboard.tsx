import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Fingerprint } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BiometricAttendanceNav } from '@/components/biometric-attendance-nav';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import BiometricAttendanceLayout from '@/layouts/biometric-attendance-layout';
import type { BreadcrumbItem } from '@/types';

type DeviceRow = {
    id: number;
    name: string;
    model: string;
    serial_number: string;
    connection_type: string;
    host: string | null;
    port: number;
    timezone: string;
    is_active: boolean;
    last_sync_at: string | null;
    last_sync_status: string | null;
    last_error: string | null;
    protocol: string;
    timezone_label: string;
    web_username: string | null;
    has_web_password: boolean;
    has_web_session_id: boolean;
};

type SyncLogRow = {
    id: number;
    device_name: string | null;
    status: string;
    started_at: string;
    inserted_count: number;
    duplicate_count: number;
    unmapped_count: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Biometric attendance', href: '/biometric-attendance' },
];

function connectionTypeLabel(type: string): string {
    if (type === 'device_web_report') {
        return 'Device web report';
    }

    if (type === 'adms_push') {
        return 'ADMS push';
    }

    return 'TCP pull';
}

function hostSummary(device: DeviceRow): string {
    if (!device.host) {
        return '—';
    }

    const port =
        device.connection_type === 'device_web_report' && device.port === 4370
            ? 80
            : device.port;

    return `${device.host}:${port} (${connectionTypeLabel(device.connection_type)})`;
}

export default function BiometricDashboard(
    props: {
        devices: DeviceRow[];
        recentSyncLogs: SyncLogRow[];
        unmappedPunchesCount: number;
        timezones: string[];
        canManageDevices: boolean;
        iclockPushUrl: string;
        pushUsesLocalhost: boolean;
    },
) {
    return (
        <BiometricAttendanceLayout breadcrumbs={breadcrumbs} title="Biometric attendance">
            <BiometricDashboardContent {...props} />
        </BiometricAttendanceLayout>
    );
}

function BiometricDashboardContent({
    devices,
    recentSyncLogs,
    unmappedPunchesCount,
    timezones,
    canManageDevices,
    iclockPushUrl,
    pushUsesLocalhost,
}: {
    devices: DeviceRow[];
    recentSyncLogs: SyncLogRow[];
    unmappedPunchesCount: number;
    timezones: string[];
    canManageDevices: boolean;
    iclockPushUrl: string;
    pushUsesLocalhost: boolean;
}) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };
    const [editingId, setEditingId] = useState<number | null>(null);
    const editing = devices.find((d) => d.id === editingId);

    const createForm = useForm({
        name: '',
        model: 'iClock990',
        serial_number: '',
        connection_type: 'adms_push',
        host: '',
        port: 4370,
        comm_key: '',
        protocol: 'tcp',
        timezone: 'Asia/Dubai',
        is_active: false,
        web_username: 'administrator',
        web_password: '',
        web_session_id: '',
    });

    const editForm = useForm({
        name: editing?.name ?? '',
        model: editing?.model ?? 'iClock990',
        serial_number: editing?.serial_number ?? '',
        connection_type: editing?.connection_type ?? 'tcp_pull',
        host: editing?.host ?? '',
        port: editing?.port ?? 4370,
        comm_key: '',
        protocol: editing?.protocol ?? 'udp',
        timezone: editing?.timezone ?? 'Asia/Dubai',
        is_active: editing?.is_active ?? false,
        web_username: editing?.web_username ?? 'administrator',
        web_password: '',
        web_session_id: '',
    });

    useEffect(() => {
        if (editing === undefined) {
            return;
        }

        editForm.setData({
            name: editing.name,
            model: editing.model,
            serial_number: editing.serial_number,
            connection_type: editing.connection_type,
            host: editing.host ?? '',
            port: editing.port,
            comm_key: '',
            protocol: editing.protocol,
            timezone: editing.timezone,
            is_active: editing.is_active,
            web_username: editing.web_username ?? 'administrator',
            web_password: '',
            web_session_id: '',
        });
        editForm.clearErrors();
    }, [editingId]);

    const activeForm = editingId ? editForm : createForm;
    const formErrorMessages = Object.values(activeForm.errors).filter(
        (message): message is string => typeof message === 'string' && message !== '',
    );

    return (
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Biometric attendance"
                    description="Configure devices, then use Connectivity and Import attendance tabs."
                />
                <BiometricAttendanceNav currentPath="/biometric-attendance" />

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                        {flash.error}
                    </div>
                )}

                {pushUsesLocalhost && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                        <p className="font-medium">ADMS push URL uses localhost</p>
                        <p className="text-muted-foreground mt-1">
                            The iClock cannot reach localhost. In <code className="text-xs">.env</code> set{' '}
                            <code className="text-xs">BIOMETRIC_PUSH_BASE_URL=http://YOUR_PC_LAN_IP</code> (same port as
                            this site), then run <code className="text-xs">php artisan config:clear</code>.
                        </p>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Devices</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">{devices.length}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Raw punches (7d, no HR link)</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold text-amber-600">{unmappedPunchesCount}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Active devices</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">
                            {devices.filter((d) => d.is_active).length}
                        </CardContent>
                    </Card>
                </div>

                {devices.map((device) => (
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
                                <span className="text-muted-foreground">Host:</span> {hostSummary(device)}
                            </p>
                            <p>
                                <span className="text-muted-foreground">Serial:</span> {device.serial_number}
                            </p>
                            <p>
                                <span className="text-muted-foreground">Timezone:</span> {device.timezone_label}
                            </p>
                            <p>
                                <span className="text-muted-foreground">Last sync:</span>{' '}
                                {device.last_sync_at ? new Date(device.last_sync_at).toLocaleString() : 'Never'}
                                {device.last_sync_status ? ` (${device.last_sync_status})` : ''}
                            </p>
                            {device.last_error && (
                                <p className="text-destructive">{device.last_error}</p>
                            )}
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button type="button" size="sm" variant="outline" asChild>
                                    <Link href="/biometric-attendance/connectivity">Connectivity</Link>
                                </Button>
                                <Button type="button" size="sm" variant="outline" asChild>
                                    <Link href="/biometric-attendance/import">Import attendance</Link>
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setEditingId(device.id)}
                                >
                                    Edit
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit device' : 'Add device'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!canManageDevices && (
                            <p className="text-muted-foreground mb-4 text-sm">
                                Your role needs Biometric attendance → Update permission to add or edit devices.
                            </p>
                        )}
                        <form
                            className="grid gap-4 md:grid-cols-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!canManageDevices) {
                                    return;
                                }
                                const form = editingId ? editForm : createForm;

                                if (editingId) {
                                    form.patch(`/biometric-attendance/devices/${editingId}`, {
                                        preserveScroll: true,
                                        onSuccess: () => setEditingId(null),
                                    });
                                } else {
                                    form.post('/biometric-attendance/devices', {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            createForm.reset();
                                            setEditingId(null);
                                        },
                                    });
                                }
                            }}
                        >
                            {formErrorMessages.length > 0 && (
                                <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm md:col-span-2">
                                    <ul className="list-inside list-disc space-y-1">
                                        {formErrorMessages.map((message) => (
                                            <li key={message}>{message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {(() => {
                                const form = editingId ? editForm : createForm;
                                return (
                                    <>
                                        <div>
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={form.data.name}
                                                onChange={(e) => form.setData('name', e.target.value)}
                                            />
                                            <InputError message={form.errors.name} />
                                        </div>
                                        <div>
                                            <Label htmlFor="serial_number">Serial number</Label>
                                            <Input
                                                id="serial_number"
                                                value={form.data.serial_number}
                                                onChange={(e) => form.setData('serial_number', e.target.value)}
                                            />
                                            <InputError message={form.errors.serial_number} />
                                        </div>
                                        <div>
                                            <Label htmlFor="connection_type">Connection</Label>
                                            <NativeSelect
                                                id="connection_type"
                                                value={form.data.connection_type}
                                                onChange={(e) =>
                                                    form.setData('connection_type', e.target.value)
                                                }
                                            >
                                                <option value="tcp_pull">TCP pull (direct to device IP)</option>
                                                <option value="device_web_report">
                                                    Device web report (device IP web UI)
                                                </option>
                                                <option value="adms_push">ADMS push (iClock cloud server)</option>
                                            </NativeSelect>
                                            <InputError message={form.errors.connection_type} />
                                        </div>
                                        {form.data.connection_type === 'adms_push' && (
                                            <div className="md:col-span-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
                                                <p className="font-medium">ADMS push setup (recommended if pull fails)</p>
                                                <p className="text-muted-foreground mt-1">
                                                    On the terminal: Communication → Cloud Server → Server address:{' '}
                                                    <code className="text-xs">{iclockPushUrl}</code> (use your PC/LAN
                                                    IP if the device cannot reach localhost). Serial number must match
                                                    exactly. Punches arrive automatically; Sync remaps employees.
                                                </p>
                                            </div>
                                        )}
                                        {(form.data.connection_type === 'tcp_pull' ||
                                            form.data.connection_type === 'device_web_report') && (
                                        <>
                                        <div>
                                            <Label htmlFor="host">Host (IP)</Label>
                                            <Input
                                                id="host"
                                                value={form.data.host}
                                                onChange={(e) => form.setData('host', e.target.value)}
                                            />
                                            <InputError message={form.errors.host} />
                                        </div>
                                        <div>
                                            <Label htmlFor="port">Port</Label>
                                            <Input
                                                id="port"
                                                type="number"
                                                value={form.data.port}
                                                onChange={(e) => form.setData('port', Number(e.target.value))}
                                            />
                                            <InputError message={form.errors.port} />
                                        </div>
                                        <div>
                                            <Label htmlFor="protocol">Protocol</Label>
                                            <NativeSelect
                                                id="protocol"
                                                value={form.data.protocol}
                                                onChange={(e) => form.setData('protocol', e.target.value)}
                                            >
                                                <option value="udp">UDP (most iClock / ZKTeco devices)</option>
                                                <option value="tcp">TCP</option>
                                            </NativeSelect>
                                            <InputError message={form.errors.protocol} />
                                        </div>
                                        <div>
                                            <Label htmlFor="comm_key">Comm key (optional)</Label>
                                            <Input
                                                id="comm_key"
                                                value={form.data.comm_key}
                                                onChange={(e) => form.setData('comm_key', e.target.value)}
                                                placeholder="0 or leave empty if unset on device"
                                            />
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Must match the terminal Comm Key (MENU → Comm). Use TCP if UDP fails; leave empty for 0.
                                            </p>
                                            <InputError message={form.errors.comm_key} />
                                        </div>
                                        {form.data.connection_type === 'device_web_report' && (
                                            <>
                                                <div>
                                                    <Label htmlFor="web_username">Web login ID</Label>
                                                    <Input
                                                        id="web_username"
                                                        value={form.data.web_username}
                                                        onChange={(e) =>
                                                            form.setData('web_username', e.target.value)
                                                        }
                                                        placeholder="administrator"
                                                    />
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        Same as Login ID on{' '}
                                                        <code className="text-xs">http://{form.data.host || 'DEVICE_IP'}/csl/login</code>
                                                    </p>
                                                    <InputError message={form.errors.web_username} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="web_password">Web login password</Label>
                                                    <Input
                                                        id="web_password"
                                                        type="password"
                                                        value={form.data.web_password}
                                                        onChange={(e) =>
                                                            form.setData('web_password', e.target.value)
                                                        }
                                                        placeholder={
                                                            editing?.has_web_password
                                                                ? 'Leave blank to keep current'
                                                                : 'Required — device rejected empty password'
                                                        }
                                                    />
                                                    <InputError message={form.errors.web_password} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label htmlFor="web_session_id">Web SessionID (optional)</Label>
                                                    <Input
                                                        id="web_session_id"
                                                        value={form.data.web_session_id}
                                                        onChange={(e) =>
                                                            form.setData('web_session_id', e.target.value)
                                                        }
                                                        placeholder={
                                                            editing?.has_web_session_id
                                                                ? 'Leave blank to keep saved SessionID'
                                                                : 'Paste from device DevTools if auto-login fails'
                                                        }
                                                        className="font-mono"
                                                    />
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        Open a <strong>new browser tab</strong> to{' '}
                                                        <code className="text-xs">
                                                            http://{form.data.host || '192.168.1.44'}
                                                        </code>
                                                        (not this HRIS page). F12 → Network → reload → first
                                                        request → Response headers →{' '}
                                                        <code className="text-xs">Set-Cookie: SessionID=…</code>.
                                                        Copy the number only. Close that tab before Test / Import.
                                                    </p>
                                                    <InputError message={form.errors.web_session_id} />
                                                </div>
                                            </>
                                        )}
                                        </>
                                        )}
                                        <div>
                                            <Label htmlFor="timezone">Timezone (UTC+4)</Label>
                                            <Input
                                                id="timezone"
                                                list="biometric-timezones"
                                                value={form.data.timezone}
                                                onChange={(e) => form.setData('timezone', e.target.value)}
                                                placeholder="Asia/Dubai"
                                            />
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Use Asia/Dubai for Gulf Standard Time (UTC+4).
                                            </p>
                                            <datalist id="biometric-timezones">
                                                {timezones.map((tz) => (
                                                    <option key={tz} value={tz} />
                                                ))}
                                            </datalist>
                                            <InputError message={form.errors.timezone} />
                                        </div>
                                        <div className="flex items-center gap-2 md:col-span-2">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={form.data.is_active}
                                                onChange={(e) => form.setData('is_active', e.target.checked)}
                                            />
                                            <Label htmlFor="is_active">Active (enable sync)</Label>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Button
                                                type="submit"
                                                disabled={form.processing || !canManageDevices}
                                            >
                                                {form.processing
                                                    ? editingId
                                                        ? 'Saving…'
                                                        : 'Creating…'
                                                    : editingId
                                                      ? 'Save device'
                                                      : 'Create device'}
                                            </Button>
                                            {editingId && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={form.processing}
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        editForm.clearErrors();
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent sync runs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {recentSyncLogs.length === 0 && (
                            <p className="text-muted-foreground">No sync history yet.</p>
                        )}
                        {recentSyncLogs.map((log) => (
                            <div key={log.id} className="flex justify-between border-b py-2 last:border-0">
                                <span>
                                    {log.device_name} — {new Date(log.started_at).toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">
                                    {log.status} · +{log.inserted_count} new · {log.duplicate_count} dup ·{' '}
                                    {log.unmapped_count} unmapped
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
    );
}
