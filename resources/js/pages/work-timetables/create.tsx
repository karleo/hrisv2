import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import WorkTimetableController, { index as workTimetablesIndex } from '@/actions/App/Http/Controllers/WorkTimetableController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import {
    WorkTimetableDayFields,
    defaultWorkTimetableDays,
} from '@/components/work-timetable-day-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Work timetables', href: workTimetablesIndex().url },
    { title: 'Create', href: '/work-timetables/create' },
];

export default function Create() {
    const initialDays = defaultWorkTimetableDays();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create work timetable" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href={workTimetablesIndex()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to work timetables
                </Link>

                <Heading
                    title="Create work timetable"
                    description="Define one row per weekday; assign this template on employee records"
                />

                <Form
                    {...WorkTimetableController.store.form()}
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
                                    placeholder="e.g. Office standard / Shift A"
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
                                    Create timetable
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
