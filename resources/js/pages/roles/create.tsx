import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useCallback } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import {
    PermissionMatrixLegend,
    RolePermissionMatrix,
    buildEmptyPermissions,
    type ModuleMeta,
    type PermissionFlags,
} from '@/components/role-permission-matrix';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function Create({ modules }: { modules: ModuleMeta[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Roles', href: '/roles' },
        { title: 'Create', href: '/roles/create' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        permissions: buildEmptyPermissions(modules),
    });

    const onPermissionChange = useCallback(
        (moduleKey: string, field: keyof PermissionFlags, value: boolean) => {
            setData('permissions', {
                ...data.permissions,
                [moduleKey]: {
                    ...data.permissions[moduleKey],
                    [field]: value,
                },
            });
        },
        [data.permissions, setData],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create role" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href="/roles"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to roles
                </Link>

                <Heading
                    title="Create role"
                    description="Name the role and set access for each module"
                />

                <form
                    className="max-w-5xl space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        post('/roles');
                    }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Role details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid max-w-2xl gap-2">
                                <Label htmlFor="name">
                                    Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setData('name', v);
                                        setData('slug', slugify(v));
                                    }}
                                    required
                                    maxLength={255}
                                    placeholder="e.g. HR manager"
                                    autoComplete="off"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid max-w-2xl gap-2">
                                <Label htmlFor="slug">
                                    Slug{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(e) =>
                                        setData('slug', e.target.value)
                                    }
                                    required
                                    maxLength={255}
                                    className="font-mono"
                                    placeholder="hr-manager"
                                    autoComplete="off"
                                />
                                <InputError message={errors.slug} />
                            </div>

                            <div className="grid max-w-2xl gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    rows={3}
                                    maxLength={2000}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Module permissions</CardTitle>
                            <PermissionMatrixLegend />
                        </CardHeader>
                        <CardContent>
                            <RolePermissionMatrix
                                modules={modules}
                                permissions={data.permissions}
                                onChange={onPermissionChange}
                                errors={errors as Record<string, string>}
                            />
                        </CardContent>
                        <CardFooter className="flex gap-3">
                            <Button disabled={processing} type="submit">
                                Create role
                            </Button>
                            <Link href="/roles">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
