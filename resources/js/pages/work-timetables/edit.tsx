import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import WorkTimetableController, {
    edit,
    index as workTimetablesIndex,
} from '@/actions/App/Http/Controllers/WorkTimetableController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import {
    WorkTimetableDayFields,
    scheduleDaysFromTimetable,
} from '@/components/work-timetable-day-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type WorkTimetableDay = {
    weekday: number;
    is_rest_day: boolean;
    work_starts_at: string | null;
    work_ends_at: string | null;
};

type WorkTimetable = {
    id: number;
    name: string;
    days: WorkTimetableDay[];
};

export default function Edit({ workTimetable }: { workTimetable: WorkTimetable }) {
    const initialDays = scheduleDaysFromTimetable(workTimetable.days);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Work timetables', href: workTimetablesIndex().url },
        {
            title: workTimetable.name,
            href: edit({ work_timetable: workTimetable.id }).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${workTimetable.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href={workTimetablesIndex()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to work timetables
                </Link>

                <Heading
                    title="Edit work timetable"
                    description="Changes apply to all employees tagged with this template"
                />

                <Form
                    {...WorkTimetableController.update.form(workTimetable.id)}
                    className="max-w-3xl space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    maxLength={255}
                                    defaultValue={workTimetable.name}
                                    autoComplete="off"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <WorkTimetableDayFields
                                errors={errors}
                                initialDays={initialDays}
                            />

                            <div className="flex gap-4">
                                <Button disabled={processing} type="submit">
                                    Save changes
                                </Button>
                                <Link href={workTimetablesIndex()}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
