import { useState } from 'react';
import InputError from '@/components/input-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ScheduleDayForm = {
    weekday: number;
    is_rest_day: boolean;
    work_starts_at: string;
    work_ends_at: string;
};

export const WEEKDAY_LABELS: Record<number, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
};

export function defaultWorkTimetableDays(): ScheduleDayForm[] {
    return [1, 2, 3, 4, 5, 6, 7].map((weekday) => {
        const isRest = weekday >= 6;

        return {
            weekday,
            is_rest_day: isRest,
            work_starts_at: isRest ? '' : '09:00',
            work_ends_at: isRest ? '' : '17:00',
        };
    });
}

export function scheduleDaysFromTimetable(
    rows: Array<{
        weekday: number;
        is_rest_day: boolean;
        work_starts_at: string | null;
        work_ends_at: string | null;
    }>
): ScheduleDayForm[] {
    const sorted = [...rows].sort((a, b) => a.weekday - b.weekday);

    return sorted.map((r) => ({
        weekday: r.weekday,
        is_rest_day: r.is_rest_day,
        work_starts_at: r.work_starts_at
            ? r.work_starts_at.toString().slice(0, 5)
            : '',
        work_ends_at: r.work_ends_at
            ? r.work_ends_at.toString().slice(0, 5)
            : '',
    }));
}

function formatTimeInput(t: string | null | undefined): string {
    if (!t) {
        return '';
    }
    const s = t.toString();

    return s.length >= 5 ? s.slice(0, 5) : s;
}

function ScheduleRow({
    index,
    day,
    errors,
}: {
    index: number;
    day: ScheduleDayForm;
    errors: Partial<Record<string, string | undefined>>;
}) {
    const [isRest, setIsRest] = useState(day.is_rest_day);

    return (
        <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 md:grid-cols-[1fr_1fr_1fr_1fr] md:items-end">
            <input
                type="hidden"
                name={`schedule_days[${index}][weekday]`}
                value={day.weekday}
            />
            <div className="grid gap-1">
                <Label className="text-muted-foreground text-xs">Day</Label>
                <p className="text-sm font-medium">
                    {WEEKDAY_LABELS[day.weekday] ?? day.weekday}
                </p>
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor={`tt_schedule_rest_${index}`} className="text-xs">
                    Rest day
                </Label>
                <select
                    id={`tt_schedule_rest_${index}`}
                    name={`schedule_days[${index}][is_rest_day]`}
                    value={isRest ? '1' : '0'}
                    onChange={(e) => setIsRest(e.target.value === '1')}
                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                >
                    <option value="0">Working</option>
                    <option value="1">Rest</option>
                </select>
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor={`tt_schedule_start_${index}`} className="text-xs">
                    Start
                </Label>
                <Input
                    id={`tt_schedule_start_${index}`}
                    name={`schedule_days[${index}][work_starts_at]`}
                    type="time"
                    step={60}
                    defaultValue={formatTimeInput(day.work_starts_at)}
                    disabled={isRest}
                    className="h-9"
                />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor={`tt_schedule_end_${index}`} className="text-xs">
                    End
                </Label>
                <Input
                    id={`tt_schedule_end_${index}`}
                    name={`schedule_days[${index}][work_ends_at]`}
                    type="time"
                    step={60}
                    defaultValue={formatTimeInput(day.work_ends_at)}
                    disabled={isRest}
                    className="h-9"
                />
            </div>
            <div className="md:col-span-4">
                <InputError
                    message={
                        errors[`schedule_days.${index}.work_starts_at`] ??
                        errors[`schedule_days.${index}.work_ends_at`]
                    }
                />
            </div>
        </div>
    );
}

export function WorkTimetableDayFields({
    errors,
    initialDays,
}: {
    errors: Partial<Record<string, string | undefined>>;
    initialDays: ScheduleDayForm[];
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Weekly day master (seven rows)</CardTitle>
                <p className="text-muted-foreground text-sm">
                    Each weekday once (Monday = 1 … Sunday = 7). Rest days
                    skip start/end times.
                </p>
            </CardHeader>
            <CardContent className="space-y-3">
                <InputError message={errors.schedule_days} />
                {initialDays.map((day, index) => (
                    <ScheduleRow
                        key={day.weekday}
                        index={index}
                        day={day}
                        errors={errors}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
