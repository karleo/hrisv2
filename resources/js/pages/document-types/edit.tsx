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

type DocumentType = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    requires_expiry_date: boolean;
    is_active: boolean;
};

export default function Edit({ documentType }: { documentType: DocumentType }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Document Types', href: '/document-types' },
        { title: documentType.name, href: `/document-types/${documentType.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${documentType.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link href="/document-types" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    Back to Document Types
                </Link>

                <Heading title="Edit Document Type" description="Update document type details" />

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Document Type Information</CardTitle>
                        </CardHeader>
                        <Form action={`/document-types/${documentType.id}`} method="put" className="w-full">
                            {({ processing, errors }) => (
                                <>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="code">Code</Label>
                                            <Input id="code" name="code" required maxLength={50} defaultValue={documentType.code} />
                                            <InputError message={errors.code} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input id="name" name="name" required maxLength={255} defaultValue={documentType.name} />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                name="description"
                                                rows={4}
                                                maxLength={1000}
                                                defaultValue={documentType.description ?? ''}
                                                placeholder="Optional description"
                                            />
                                            <InputError message={errors.description} />
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    name="requires_expiry_date"
                                                    value="1"
                                                    defaultChecked={documentType.requires_expiry_date}
                                                    className="size-4 rounded border border-input"
                                                />
                                                Requires expiry date
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    name="is_active"
                                                    value="1"
                                                    defaultChecked={documentType.is_active}
                                                    className="size-4 rounded border border-input"
                                                />
                                                Active
                                            </label>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-4">
                                        <Button disabled={processing} type="submit">Update Document Type</Button>
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

