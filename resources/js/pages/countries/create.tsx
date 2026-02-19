import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import CountryController from '@/actions/App/Http/Controllers/CountryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/countries';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Countries', href: index().url },
    { title: 'Create', href: '/countries/create' },
];

export default function Create() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Country" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    Back to Countries
                </Link>

                <Heading
                    title="Create Country"
                    description="Add a new country to the master list"
                />

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Country Information</CardTitle>
                        </CardHeader>
                        <Form {...CountryController.store.form()} className="w-full">
                            {({ processing, errors }) => (
                                <>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="code">
                                                Code <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="code"
                                                name="code"
                                                required
                                                minLength={2}
                                                maxLength={2}
                                                placeholder="e.g. US"
                                                autoComplete="off"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                2-letter country code (ISO 3166-1 alpha-2)
                                            </p>
                                            <InputError message={errors.code} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="name">
                                                Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                required
                                                maxLength={255}
                                                placeholder="e.g. United States"
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-3">
                                        <Button disabled={processing} type="submit">
                                            Create Country
                                        </Button>
                                        <Link href={index()}>
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </>
                            )}
                        </Form>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
