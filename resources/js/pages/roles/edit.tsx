import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useCallback } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import {
    PermissionMatrixLegend,
    RolePermissionMatrix,
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

type Role = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
    permissions: Record<string, PermissionFlags>;
};

export default function Edit({
    role,
    modules,
}: {
    role: Role;
    modules: ModuleMeta[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Roles', href: '/roles' },
        { title: role.name, href: `/roles/${role.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        slug: role.slug,
        description: role.description ?? '',
        permissions: role.permissions,
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
            <Head title={`Edit ${role.name}`} />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href="/roles"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to roles
                </Link>

                <Heading
                    title={`Edit role: ${role.name}`}
                    description={
                        role.is_system
                            ? 'System role — slug is fixed; you can still adjust permissions.'
                            : 'Update name, slug, and permissions'
                    }
                />

                <form
                    className="max-w-5xl space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        put(`/roles/${role.id}`);
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
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    required
                                    maxLength={255}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid max-w-2xl gap-2">
                                <Label htmlFor="slug">
                                    Slug{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                {role.is_system ? (
                                    <Input
                                        id="slug"
                                        value={role.slug}
                                        readOnly
                                        className="font-mono bg-muted"
                                    />
                                ) : (
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) =>
                                            setData('slug', e.target.value)
                                        }
                                        required
                                        maxLength={255}
                                        className="font-mono"
                                    />
                                )}
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
                                Save changes
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
