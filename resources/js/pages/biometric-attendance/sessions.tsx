import { Link, router, usePage } from '@inertiajs/react';
import { BiometricAttendanceNav } from '@/components/biometric-attendance-nav';
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
    { title: 'Sessions', href: '/biometric-attendance/sessions' },
];

function formatMinutes(m: number | null): string {
    if (m == null) {
        return '—';
    }
    const h = Math.floor(m / 60);
    const min = m % 60;

    return `${h}h ${min}m`;
}

type BiometricSessionsProps = {
    sessions: {
        data: Array<{
            id: number;
            employee_name: string;
            employee_code: string | null;
            device_name: string | null;
            clock_in_at: string;
            clock_out_at: string | null;
            working_minutes: number | null;
            is_open: boolean;
        }>;
        current_page: number;
        last_page: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: Record<string, string | undefined>;
    devices: Array<{ id: number; name: string }>;
    employees: Array<{ id: number; name: string }>;
};

export default function BiometricSessions(props: BiometricSessionsProps) {
    return (
        <BiometricAttendanceLayout breadcrumbs={breadcrumbs} title="Biometric sessions">
            <BiometricSessionsContent {...props} />
        </BiometricAttendanceLayout>
    );
}

function BiometricSessionsContent({ sessions, filters, devices, employees }: BiometricSessionsProps) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    const applyFilters = () => {
        const form = document.getElementById('session-filters') as HTMLFormElement;
        const data = new FormData(form);
        const params: Record<string, string> = {};
        data.forEach((v, k) => {
            if (v) {
                params[k] = String(v);
            }
        });
        router.get('/biometric-attendance/sessions', params, { preserveState: true });
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <Heading
                title="Attendance sessions"
                description="Browse clock-in/out stored in the database. Import new data from the Import attendance tab."
            />
            <BiometricAttendanceNav currentPath="/biometric-attendance/sessions" />

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

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Browse sessions</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        Defaults to the last 7 days. To load new clock-in/out from the device, use{' '}
                        <Link href="/biometric-attendance/import" className="text-primary underline">
                            Import attendance
                        </Link>{' '}
                        first, then filter here with the same dates.
                    </p>
                </CardHeader>
                <CardContent>
                    <form
                        id="session-filters"
                        className="mb-4 grid gap-4 md:grid-cols-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters();
                        }}
                    >
                        <div>
                            <Label>From</Label>
                            <Input name="from" type="date" defaultValue={filters.from} />
                        </div>
                        <div>
                            <Label>To</Label>
                            <Input name="to" type="date" defaultValue={filters.to} />
                        </div>
                        <div>
                            <Label>Employee</Label>
                            <NativeSelect name="employee_id" defaultValue={filters.employee_id}>
                                <option value="">All</option>
                                {employees.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                        <div>
                            <Label>Device</Label>
                            <NativeSelect name="biometric_device_id" defaultValue={filters.biometric_device_id}>
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
                            <NativeSelect name="status" defaultValue={filters.status}>
                                <option value="">All</option>
                                <option value="open">Open</option>
                                <option value="closed">Closed</option>
                            </NativeSelect>
                        </div>
                        <div className="md:col-span-5">
                            <Button type="submit" variant="secondary">
                                Filter
                            </Button>
                        </div>
                    </form>

                    {sessions.data.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                            No sessions for this range.{' '}
                            <Link href="/biometric-attendance/import" className="text-primary underline">
                                Import attendance
                            </Link>{' '}
                            or widen your filters.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-2 pr-4 font-medium">Employee</th>
                                        <th className="pb-2 pr-4 font-medium">Device</th>
                                        <th className="pb-2 pr-4 font-medium">Clock in</th>
                                        <th className="pb-2 pr-4 font-medium">Clock out</th>
                                        <th className="pb-2 font-medium">Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.data.map((row) => (
                                        <tr key={row.id} className="border-b">
                                            <td className="py-2 pr-4">
                                                {row.employee_name}
                                                {row.employee_code ? (
                                                    <span className="text-muted-foreground ml-1 text-xs">
                                                        ({row.employee_code})
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="py-2 pr-4">{row.device_name ?? '—'}</td>
                                            <td className="py-2 pr-4">
                                                {new Date(row.clock_in_at).toLocaleString()}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {row.clock_out_at
                                                    ? new Date(row.clock_out_at).toLocaleString()
                                                    : row.is_open
                                                      ? 'Open'
                                                      : '—'}
                                            </td>
                                            <td className="py-2">{formatMinutes(row.working_minutes)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {sessions.last_page > 1 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {sessions.links.map((link, i) =>
                                        link.url ? (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                className={
                                                    link.active
                                                        ? 'rounded bg-primary px-2 py-1 text-xs text-primary-foreground'
                                                        : 'rounded bg-muted px-2 py-1 text-xs'
                                                }
                                                preserveState
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </Link>
                                        ) : null,
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
