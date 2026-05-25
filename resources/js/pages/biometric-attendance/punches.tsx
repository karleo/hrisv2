import { Head, Link, router } from '@inertiajs/react';
import { BiometricAttendanceNav } from '@/components/biometric-attendance-nav';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Biometric attendance', href: '/biometric-attendance' },
    { title: 'Raw punches', href: '/biometric-attendance/punches' },
];

export default function BiometricPunches({
    punches,
    filters,
    devices,
    canRemapPunches,
    unmappedPunchCount,
}: {
    punches: {
        data: Array<{
            id: number;
            device_user_id: string;
            device_name: string | null;
            employee_name: string | null;
            direction: string;
            punched_at_display: string;
            processed_at_display: string;
            biometric_attendance_session_id: number | null;
        }>;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        last_page: number;
        current_page: number;
    };
    filters: Record<string, string | undefined>;
    devices: Array<{ id: number; name: string }>;
    canRemapPunches: boolean;
    unmappedPunchCount: number;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Biometric punches" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Raw punches"
                    description="Device PIN, direction (in/out), and punch time as stored in the database (same as the terminal report, not your PC clock)."
                />
                <BiometricAttendanceNav currentPath="/biometric-attendance/punches" />

                <Card>
                    <CardContent className="pt-6">
                        <form
                            className="mb-4 grid gap-4 md:grid-cols-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = new FormData(e.currentTarget);
                                const params: Record<string, string> = {};
                                data.forEach((v, k) => { if (v) params[k] = String(v); });
                                router.get('/biometric-attendance/punches', params, { preserveState: true });
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
                                <Label>Device</Label>
                                <select name="biometric_device_id" className="border-input flex h-9 w-full rounded-md border px-2 text-sm" defaultValue={filters.biometric_device_id}>
                                    <option value="">All</option>
                                    {devices.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Mapped</Label>
                                <select name="mapped" className="border-input flex h-9 w-full rounded-md border px-2 text-sm" defaultValue={filters.mapped}>
                                    <option value="">All</option>
                                    <option value="yes">Mapped</option>
                                    <option value="no">Unmapped</option>
                                </select>
                            </div>
                            <div className="flex flex-wrap items-end gap-2 md:col-span-4">
                                <Button type="submit">Filter</Button>
                                {canRemapPunches && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            const params: Record<string, string> = {};
                                            if (filters.from) {
                                                params.from = filters.from;
                                            }
                                            if (filters.to) {
                                                params.to = filters.to;
                                            }
                                            if (filters.biometric_device_id) {
                                                params.biometric_device_id = filters.biometric_device_id;
                                            }
                                            if (filters.mapped) {
                                                params.mapped = filters.mapped;
                                            }
                                            router.post('/biometric-attendance/remap-punches', params);
                                        }}
                                    >
                                        Link punches to employees
                                    </Button>
                                )}
                            </div>
                        </form>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="py-2 pr-4">Device PIN</th>
                                        <th className="py-2 pr-4 text-muted-foreground">HR employee (optional)</th>
                                        <th className="py-2 pr-4">Direction</th>
                                        <th className="py-2 pr-4">Punched at</th>
                                        <th className="py-2 pr-4">Processed</th>
                                        <th className="py-2">Session</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {punches.data.map((row) => (
                                        <tr key={row.id} className="border-b">
                                            <td className="py-2 pr-4 font-mono">{row.device_user_id}</td>
                                            <td className="py-2 pr-4">
                                                {row.employee_name ?? (
                                                    <span className="text-amber-600">Unmapped</span>
                                                )}
                                            </td>
                                            <td className="py-2 pr-4 uppercase">{row.direction}</td>
                                            <td className="py-2 pr-4 font-mono text-xs">{row.punched_at_display}</td>
                                            <td className="py-2 pr-4 font-mono text-xs">{row.processed_at_display}</td>
                                            <td className="py-2">
                                                {row.biometric_attendance_session_id ? `#${row.biometric_attendance_session_id}` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {punches.last_page > 1 && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                    Page {punches.current_page} of {punches.last_page}
                                </span>
                                {punches.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveScroll
                                            className={
                                                link.active
                                                    ? 'rounded-md bg-primary px-2 py-1 text-primary-foreground'
                                                    : 'text-primary underline'
                                            }
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
        </AppLayout>
    );
}
