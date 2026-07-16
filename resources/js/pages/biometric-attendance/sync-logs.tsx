import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { BiometricAttendanceNav } from '@/components/biometric-attendance-nav';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import BiometricAttendanceLayout from '@/layouts/biometric-attendance-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Biometric attendance', href: '/biometric-attendance' },
    { title: 'Sync history', href: '/biometric-attendance/sync-logs' },
];

type SyncLogRow = {
    id: number;
    device_name: string | null;
    triggered_by_name: string | null;
    sync_type: string;
    status: string;
    started_at: string;
    finished_at: string | null;
    fetched_count: number;
    inserted_count: number;
    duplicate_count: number;
    unmapped_count: number;
    failed_count: number;
    sessions_created_count: number;
    sessions_updated_count: number;
    error_message: string | null;
    error_metadata: Record<string, unknown> | null;
};

type BiometricSyncLogsProps = {
    syncLogs: {
        data: SyncLogRow[];
        current_page: number;
        last_page: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: Record<string, string | undefined>;
    devices: Array<{ id: number; name: string }>;
};

export default function BiometricSyncLogs(props: BiometricSyncLogsProps) {
    return (
        <BiometricAttendanceLayout breadcrumbs={breadcrumbs} title="Biometric sync history">
            <BiometricSyncLogsContent {...props} />
        </BiometricAttendanceLayout>
    );
}

function BiometricSyncLogsContent({ syncLogs, filters, devices }: BiometricSyncLogsProps) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };
    const [expandedId, setExpandedId] = useState<number | null>(null);

    return (
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Sync history"
                    description="Every pull or sync is logged here, including failures, with counts and error details."
                />
                <BiometricAttendanceNav currentPath="/biometric-attendance/sync-logs" />

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

                <p className="text-muted-foreground text-sm">
                    To import clock-in/out into the database, use{' '}
                    <Link href="/biometric-attendance/import" className="text-primary underline">
                        Import attendance
                    </Link>{' '}
                    or{' '}
                    <Link href="/biometric-attendance/upload" className="text-primary underline">
                        Upload file
                    </Link>
                    . This page shows the log only.
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Sync runs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="mb-4 flex flex-wrap gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = new FormData(e.currentTarget);
                                const params: Record<string, string> = {};
                                data.forEach((v, k) => {
                                    if (v) {
                                        params[k] = String(v);
                                    }
                                });
                                router.get('/biometric-attendance/sync-logs', params, { preserveState: true });
                            }}
                        >
                            <div>
                                <Label>Device</Label>
                                <NativeSelect
                                    name="biometric_device_id"
                                    className="min-w-[200px] w-auto"
                                    defaultValue={filters.biometric_device_id}
                                >
                                    <option value="">All</option>
                                    {devices.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <NativeSelect
                                    name="status"
                                    className="w-auto min-w-[140px]"
                                    defaultValue={filters.status}
                                >
                                    <option value="">All</option>
                                    <option value="running">Running</option>
                                    <option value="completed">Completed</option>
                                    <option value="failed">Failed</option>
                                </NativeSelect>
                            </div>
                            <Button type="submit" variant="secondary" className="self-end">
                                Filter
                            </Button>
                        </form>

                        {syncLogs.data.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                No sync runs yet. Use <strong>Pull from device</strong> above, or{' '}
                                <strong>Sync now</strong> on the dashboard (full device log). Failed attempts are
                                recorded here too.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {syncLogs.data.map((log) => (
                                    <div key={log.id} className="rounded-lg border p-4 text-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <span className="font-medium">{log.device_name ?? 'Device'}</span>
                                                <span className="text-muted-foreground ml-2">
                                                    {new Date(log.started_at).toLocaleString()}
                                                </span>
                                                {log.triggered_by_name && (
                                                    <span className="text-muted-foreground ml-2">
                                                        by {log.triggered_by_name}
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={
                                                    log.status === 'completed'
                                                        ? 'font-medium text-green-700'
                                                        : log.status === 'failed'
                                                          ? 'font-medium text-destructive'
                                                          : 'font-medium text-amber-700'
                                                }
                                            >
                                                {log.status}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground mt-2">
                                            Fetched {log.fetched_count}
                                            {typeof log.error_metadata?.in_range === 'number' &&
                                                log.error_metadata.in_range !== log.fetched_count &&
                                                ` · In range ${log.error_metadata.in_range}`}{' '}
                                            · Inserted {log.inserted_count} · Duplicates {log.duplicate_count} ·
                                            Unmapped {log.unmapped_count} · Import failed {log.failed_count} · Sessions
                                            +{log.sessions_created_count} / closed {log.sessions_updated_count}
                                        </p>
                                        {log.status === 'completed' &&
                                            log.fetched_count === 0 &&
                                            typeof log.error_metadata?.device_records === 'number' &&
                                            log.error_metadata.device_records === 0 && (
                                                <p className="mt-2 text-amber-800">
                                                    The device returned no stored punches. Confirm records exist on the
                                                    terminal, try the other protocol (TCP/UDP), and check the comm key.
                                                </p>
                                            )}
                                        {log.status === 'completed' &&
                                            log.fetched_count > 0 &&
                                            log.inserted_count === 0 &&
                                            typeof log.error_metadata?.in_range === 'number' &&
                                            log.error_metadata.in_range === 0 && (
                                                <p className="mt-2 text-amber-800">
                                                    The device has {log.fetched_count} punch(es), but none fall in the
                                                    selected date range.
                                                </p>
                                            )}
                                        {log.error_message && (
                                            <p className="text-destructive mt-1">{log.error_message}</p>
                                        )}
                                        {log.error_metadata && (
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="h-auto p-0"
                                                onClick={() =>
                                                    setExpandedId(expandedId === log.id ? null : log.id)
                                                }
                                            >
                                                {expandedId === log.id ? 'Hide' : 'Show'} details
                                            </Button>
                                        )}
                                        {expandedId === log.id && log.error_metadata && (
                                            <pre className="bg-muted mt-2 overflow-x-auto rounded p-2 text-xs">
                                                {JSON.stringify(log.error_metadata, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {syncLogs.last_page > 1 && (
                            <div className="mt-4 flex gap-2">
                                {syncLogs.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={link.active ? 'font-bold' : ''}
                                            preserveScroll
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Link>
                                    ) : null,
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
    );
}
