import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

type Employee = { id: number; first_name: string; last_name: string };
type Department = { id: number; name: string };
type LeaveRequest = {
    id: number;
    code: string;
    employee_id: number;
    department_id: number;
    status: string;
    period_from: string | null;
    period_to: string | null;
    days: number | null;
    employee?: Employee & { department?: Department };
    department?: Department;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Management', href: '/leave-requests' },
];

export default function LeaveRequestsIndex({
    leaveRequests,
    filters,
}: {
    leaveRequests: { data: LeaveRequest[]; current_page: number; last_page: number; links: unknown[] };
    filters: { search?: string };
}) {
    const { data: items, current_page, last_page } = leaveRequests;
    const [search, setSearch] = useState(filters?.search ?? '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/leave-requests', { search: search || undefined }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this leave request?')) {
            router.delete(`/leave-requests/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Requests" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-semibold">Leave Requests</h1>
                    <Button asChild>
                        <Link href="/leave-requests/create" prefetch>
                            <Plus className="mr-2 size-4" />
                            New request
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        type="search"
                        placeholder="Search by employee name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs"
                    />
                    <Button type="submit" variant="secondary">
                        <Search className="size-4" />
                    </Button>
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarDays className="size-4" />
                            Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {items.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">No leave requests yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="pb-2 pr-4 font-medium">Code</th>
                                            <th className="pb-2 pr-4 font-medium">Employee</th>
                                            <th className="pb-2 pr-4 font-medium">Department</th>
                                            <th className="pb-2 pr-4 font-medium">Period</th>
                                            <th className="pb-2 pr-4 font-medium">Days</th>
                                            <th className="pb-2 pr-4 font-medium">Status</th>
                                            <th className="pb-2 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((lr) => (
                                            <tr key={lr.id} className="border-b last:border-0">
                                                <td className="py-3 pr-4">{lr.code}</td>
                                                <td className="py-3 pr-4">
                                                    {lr.employee
                                                        ? `${lr.employee.first_name} ${lr.employee.last_name}`
                                                        : '—'}
                                                </td>
                                                <td className="py-3 pr-4">{lr.department?.name ?? '—'}</td>
                                                <td className="py-3 pr-4">
                                                    {lr.period_from && lr.period_to
                                                        ? `${lr.period_from} – ${lr.period_to}`
                                                        : '—'}
                                                </td>
                                                <td className="py-3 pr-4">{lr.days ?? '—'}</td>
                                                <td className="py-3 pr-4 capitalize">{lr.status}</td>
                                                <td className="py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/leave-requests/${lr.id}`}>
                                                                <span className="sr-only">View</span>
                                                                <Eye className="size-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/leave-requests/${lr.id}/edit`}>
                                                                <span className="sr-only">Edit</span>
                                                                <Pencil className="size-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(lr.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <span className="sr-only">Delete</span>
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {last_page > 1 && (
                            <div className="mt-4 flex justify-center gap-2">
                                {current_page > 1 && (
                                    <Link
                                        href={`/leave-requests?page=${current_page - 1}${filters?.search ? `&search=${encodeURIComponent(filters.search)}` : ''}`}
                                        className="text-primary text-sm underline"
                                    >
                                        Previous
                                    </Link>
                                )}
                                <span className="text-muted-foreground text-sm">
                                    Page {current_page} of {last_page}
                                </span>
                                {current_page < last_page && (
                                    <Link
                                        href={`/leave-requests?page=${current_page + 1}${filters?.search ? `&search=${encodeURIComponent(filters.search)}` : ''}`}
                                        className="text-primary text-sm underline"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
