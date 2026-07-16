import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AccessoryController from '@/actions/App/Http/Controllers/AccessoryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/accessories';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Accessories', href: '/accessories' },
    { title: 'Create', href: '/accessories/create' },
];

export default function Create() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Accessory" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href={index().url}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    Back to Accessories
                </Link>

                <Heading title="Create Accessory" description="Add a new accessory to the master list" />

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Accessory Information</CardTitle>
                        </CardHeader>
                        <Form {...AccessoryController.store.form()} className="w-full">
                            {({ processing, errors }) => (
                                <>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
                                            <Input id="code" name="code" required maxLength={50} placeholder="e.g. MOU" />
                                            <InputError message={errors.code} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                                            <Input id="name" name="name" required maxLength={255} placeholder="e.g. Mouse" />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea id="description" name="description" rows={4} maxLength={1000} />
                                            <InputError message={errors.description} />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-3">
                                        <Button disabled={processing} type="submit">Create Accessory</Button>
                                        <Link href={index().url}>
                                            <Button type="button" variant="outline">Cancel</Button>
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
