import { Head, useForm, usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type BiometricSetting = {
    is_enabled: boolean;
    device_ip: string | null;
    device_port: number;
    comm_key: string | null;
    timeout_seconds: number;
    poll_interval_minutes: number;
    timezone: string;
    duplicate_window_seconds: number;
    max_pairing_hours: number;
    treat_single_punch_as_open_entry: boolean;
    employee_identifier_field: 'employee_code' | 'id';
    location_name: string | null;
    last_polled_at: string | null;
    last_log_cursor: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Biometric settings', href: '/biometric-settings' },
];

export default function BiometricSettingsIndex({
    setting,
    pushEndpoint,
    handshakeEndpoint,
}: {
    setting: BiometricSetting;
    pushEndpoint: string;
    handshakeEndpoint: string;
}) {
    const { flash, errors } = usePage().props as {
        flash?: { success?: string };
        errors?: Record<string, string>;
    };
    const form = useForm({
        is_enabled: setting.is_enabled,
        device_ip: setting.device_ip ?? '',
        device_port: setting.device_port,
        comm_key: setting.comm_key ?? '',
        timeout_seconds: setting.timeout_seconds,
        poll_interval_minutes: setting.poll_interval_minutes,
        timezone: setting.timezone,
        duplicate_window_seconds: setting.duplicate_window_seconds,
        max_pairing_hours: setting.max_pairing_hours,
        treat_single_punch_as_open_entry: setting.treat_single_punch_as_open_entry,
        employee_identifier_field: setting.employee_identifier_field,
        location_name: setting.location_name ?? '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Biometric settings" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Biometric check-in / check-out settings"
                    description="Configure ZKTeco iClock990 polling and how punches map to attendance entries."
                />

                {flash?.success && (
                    <p className="bg-muted text-foreground rounded-md border px-3 py-2 text-sm">
                        {flash.success}
                    </p>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Connection and rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid gap-4 md:grid-cols-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.put('/biometric-settings');
                            }}
                        >
                            <div className="flex items-center gap-2 md:col-span-2">
                                <input
                                    id="is_enabled"
                                    type="checkbox"
                                    checked={form.data.is_enabled}
                                    onChange={(e) => form.setData('is_enabled', e.target.checked)}
                                />
                                <Label htmlFor="is_enabled">Enable biometric polling</Label>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="device_ip">Device IP</Label>
                                <Input id="device_ip" value={form.data.device_ip} onChange={(e) => form.setData('device_ip', e.target.value)} />
                                <InputError message={form.errors.device_ip} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="device_port">Device port</Label>
                                <Input id="device_port" type="number" value={form.data.device_port} onChange={(e) => form.setData('device_port', Number(e.target.value))} />
                                <InputError message={form.errors.device_port} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comm_key">Comm key</Label>
                                <Input id="comm_key" value={form.data.comm_key} onChange={(e) => form.setData('comm_key', e.target.value)} />
                                <InputError message={form.errors.comm_key} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <Input id="timezone" value={form.data.timezone} onChange={(e) => form.setData('timezone', e.target.value)} />
                                <InputError message={form.errors.timezone} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="timeout_seconds">Timeout (seconds)</Label>
                                <Input id="timeout_seconds" type="number" value={form.data.timeout_seconds} onChange={(e) => form.setData('timeout_seconds', Number(e.target.value))} />
                                <InputError message={form.errors.timeout_seconds} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="poll_interval_minutes">Poll interval (minutes)</Label>
                                <Input id="poll_interval_minutes" type="number" value={form.data.poll_interval_minutes} onChange={(e) => form.setData('poll_interval_minutes', Number(e.target.value))} />
                                <InputError message={form.errors.poll_interval_minutes} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="duplicate_window_seconds">Duplicate window (seconds)</Label>
                                <Input id="duplicate_window_seconds" type="number" value={form.data.duplicate_window_seconds} onChange={(e) => form.setData('duplicate_window_seconds', Number(e.target.value))} />
                                <InputError message={form.errors.duplicate_window_seconds} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="max_pairing_hours">Max pairing hours</Label>
                                <Input id="max_pairing_hours" type="number" value={form.data.max_pairing_hours} onChange={(e) => form.setData('max_pairing_hours', Number(e.target.value))} />
                                <InputError message={form.errors.max_pairing_hours} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="employee_identifier_field">Employee identifier mapping</Label>
                                <select
                                    id="employee_identifier_field"
                                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                    value={form.data.employee_identifier_field}
                                    onChange={(e) =>
                                        form.setData('employee_identifier_field', e.target.value as 'employee_code' | 'id')
                                    }
                                >
                                    <option value="employee_code">employee_code</option>
                                    <option value="id">id</option>
                                </select>
                                <InputError message={form.errors.employee_identifier_field} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location_name">Location name (optional)</Label>
                                <Input id="location_name" value={form.data.location_name} onChange={(e) => form.setData('location_name', e.target.value)} />
                                <InputError message={form.errors.location_name} />
                            </div>
                            <div className="flex items-center gap-2 md:col-span-2">
                                <input
                                    id="treat_single_punch_as_open_entry"
                                    type="checkbox"
                                    checked={form.data.treat_single_punch_as_open_entry}
                                    onChange={(e) => form.setData('treat_single_punch_as_open_entry', e.target.checked)}
                                />
                                <Label htmlFor="treat_single_punch_as_open_entry">
                                    Keep unmatched punches as open check-ins
                                </Label>
                            </div>

                            <div className="flex flex-wrap gap-2 md:col-span-2">
                                <Button type="submit" disabled={form.processing}>
                                    Save settings
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => form.post('/biometric-settings/test-connection')}
                                >
                                    Test connection
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => form.post('/biometric-settings/sync-now')}
                                >
                                    Sync now
                                </Button>
                            </div>
                            <InputError message={errors?.biometric_connection} />
                            <InputError message={errors?.biometric_sync} />
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Sync cursor</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <p>Last polled at: {setting.last_polled_at ? new Date(setting.last_polled_at).toLocaleString() : 'Never'}</p>
                        <p>Last log cursor: {setting.last_log_cursor ?? '—'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">ADMS push endpoint (Option A)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            Device cdata URL: <span className="font-mono text-foreground">{pushEndpoint}</span>
                        </p>
                        <p>
                            Device handshake URL: <span className="font-mono text-foreground">{handshakeEndpoint}</span>
                        </p>
                        <p>
                            In iClock990, set communication mode to ADMS/Cloud push and point it to the URLs above.
                            If comm key is set here, pass the same key from device.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
