import { Head } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

export default function BiometricAttendanceLayout({
    breadcrumbs,
    title,
    children,
}: PropsWithChildren<{
    breadcrumbs: BreadcrumbItem[];
    title: string;
}>) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            {children}
        </AppLayout>
    );
}
