import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Document Types', href: '/document-types' },
    { title: 'Create', href: '/document-types/create' },
];

export default function Create() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Document Type" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link href="/document-types" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    Back to Document Types
                </Link>

                <Heading title="Create Document Type" description="Add a new document type to the master list" />

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Document Type Information</CardTitle>
                        </CardHeader>
                        <Form action="/document-types" method="post" className="w-full">
                            {({ processing, errors }) => (
                                <>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
                                            <Input id="code" name="code" required maxLength={50} placeholder="e.g. PASSPORT" autoComplete="off" />
                                            <InputError message={errors.code} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                                            <Input id="name" name="name" required maxLength={255} placeholder="e.g. Passport" />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea id="description" name="description" rows={4} maxLength={1000} placeholder="Optional description" />
                                            <InputError message={errors.description} />
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    name="requires_expiry_date"
                                                    value="1"
                                                    className="size-4 rounded border border-input"
                                                />
                                                Requires expiry date
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    name="is_active"
                                                    value="1"
                                                    defaultChecked
                                                    className="size-4 rounded border border-input"
                                                />
                                                Active
                                            </label>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-3">
                                        <Button disabled={processing} type="submit">Create Document Type</Button>
                                        <Link href="/document-types">
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

