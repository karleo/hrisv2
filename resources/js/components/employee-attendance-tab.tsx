import { router } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { downloadAttendancePdf } from '@/actions/App/Http/Controllers/EmployeeController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDisplayDate } from '@/lib/format-display-date';
import { edit } from '@/routes/employees';

type AttendanceRow = {
    date: string;
    device_pin: string;
    device_name: string | null;
    clock_in: string | null;
    clock_out: string | null;
    working_hours: string;
    overtime: string;
    punch_count: number;
};

type AttendancePayload = {
    filters: { from: string; to: string };
    summary: { total_days: number; total_punches: number };
    rows: AttendanceRow[];
};

export function EmployeeAttendanceTab({
    employeeId,
    attendance,
    viewMode,
    context = 'employee-edit',
}: {
    employeeId: number;
    attendance: AttendancePayload;
    viewMode: boolean;
    context?: 'employee-edit' | 'my-profile';
}) {
    const [localFilters, setLocalFilters] = useState(attendance.filters);

    useEffect(() => {
        setLocalFilters(attendance.filters);
    }, [attendance.filters]);

    const loadAttendance = useCallback(
        (next: { from: string; to: string }) => {
            if (!next.from || !next.to) {
                return;
            }

            if (context === 'my-profile') {
                router.get(
                    '/my-profile',
                    {
                        tab: 'attendance',
                        from: next.from,
                        to: next.to,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                        only: ['attendance'],
                    },
                );

                return;
            }

            router.get(
                edit({ employee: employeeId }).url,
                {
                    tab: 'attendance',
                    from: next.from,
                    to: next.to,
                    ...(viewMode ? { mode: 'view' } : {}),
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['attendance'],
                },
            );
        },
        [context, employeeId, viewMode],
    );

    const updateFilters = (patch: Partial<{ from: string; to: string }>) => {
        const next = { ...localFilters, ...patch };
        setLocalFilters(next);
        loadAttendance(next);
    };

    const pdfExportHref = useMemo(() => {
        if (!localFilters.from || !localFilters.to) {
            return '#';
        }

        const query = {
            from: localFilters.from,
            to: localFilters.to,
        };

        if (context === 'my-profile') {
            const params = new URLSearchParams(query);

            return `/my-profile/attendance/pdf?${params.toString()}`;
        }

        return downloadAttendancePdf.url(employeeId, {
            query,
        });
    }, [context, employeeId, localFilters.from, localFilters.to]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div>
                        <CardTitle className="text-base">Date range</CardTitle>
                    </div>
                    <Button type="button" variant="outline" className="shrink-0" asChild>
                        <a href={pdfExportHref}>
                            <FileText className="mr-2 size-4" />
                            Download PDF
                        </a>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 md:max-w-xl">
                        <div>
                            <Label htmlFor="employee-attendance-from">From</Label>
                            <Input
                                id="employee-attendance-from"
                                type="date"
                                value={localFilters.from}
                                onChange={(e) => updateFilters({ from: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="employee-attendance-to">To</Label>
                            <Input
                                id="employee-attendance-to"
                                type="date"
                                value={localFilters.to}
                                onChange={(e) => updateFilters({ to: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Attendance</CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {attendance.summary.total_days} day row(s) · {attendance.summary.total_punches}{' '}
                        punch(es) in range
                    </p>
                </CardHeader>
                <CardContent>
                    {attendance.rows.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No biometric attendance in this range. Import punches from Biometric attendance,
                            and ensure this employee&apos;s device PIN matches the terminal.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="py-2 pr-4">Date</th>
                                        <th className="py-2 pr-4">Device</th>
                                        <th className="py-2 pr-4">Clock in</th>
                                        <th className="py-2 pr-4">Clock out</th>
                                        <th className="py-2 pr-4">Working hours</th>
                                        <th className="py-2 pr-4">Overtime</th>
                                        <th className="py-2">Punches</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.rows.map((row, index) => (
                                        <tr
                                            key={`${row.date}-${row.device_pin}-${index}`}
                                            className="border-b"
                                        >
                                            <td className="py-2 pr-4">{formatDisplayDate(row.date)}</td>
                                            <td className="py-2 pr-4">{row.device_name ?? '—'}</td>
                                            <td className="py-2 pr-4 font-mono text-xs">
                                                {row.clock_in ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4 font-mono text-xs">
                                                {row.clock_out ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4">{row.working_hours}</td>
                                            <td className="py-2 pr-4">{row.overtime}</td>
                                            <td className="py-2">{row.punch_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
