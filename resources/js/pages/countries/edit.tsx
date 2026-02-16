import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import CountryController from '@/actions/App/Http/Controllers/CountryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { edit, index } from '@/routes/countries';
import type { BreadcrumbItem } from '@/types';

type Country = {
    id: number;
    code: string;
    name: string;
};

export default function Edit({ country }: { country: Country }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Countries', href: index().url },
        { title: country.name, href: edit({ country: country.id }).url },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${country.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Countries
                </Link>

                <Heading
                    title="Edit Country"
                    description="Update country details"
                />

                <Form
                    {...CountryController.update.form(country.id)}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="max-w-md space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Code</Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        required
                                        minLength={2}
                                        maxLength={2}
                                        defaultValue={country.code}
                                        placeholder="e.g. US"
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.code} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        required
                                        maxLength={255}
                                        defaultValue={country.name}
                                        placeholder="e.g. United States"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="flex gap-4">
                                    <Button disabled={processing} type="submit">
                                        Update Country
                                    </Button>
                                    <Link href={index()}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
