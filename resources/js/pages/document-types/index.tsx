import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Document Types', href: '/document-types' },
];

type DocumentType = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    requires_expiry_date: boolean;
    is_active: boolean;
};

type PaginatedDocumentTypes = {
    data: DocumentType[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Index({
    documentTypes,
    filters = {},
}: {
    documentTypes: PaginatedDocumentTypes;
    filters?: { search?: string };
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Document Types" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Document Type Master List</CardTitle>
                            <CardDescription>
                                Manage document types and expiry requirements
                            </CardDescription>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <DataTableToolbar
                                searchUrl="/document-types"
                                searchPlaceholder="Search code, name, description..."
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href="/document-types/create">
                                <Button>
                                    <Plus />
                                    Add Document Type
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">Code</th>
                                        <th className="px-4 py-3 text-left font-medium">Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Expiry Required</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="px-4 py-3 text-left font-medium">Description</th>
                                        <th className="w-24 px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documentTypes.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                {filters.search
                                                    ? 'No document types match your search.'
                                                    : 'No document types found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        documentTypes.data.map((item) => (
                                            <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="px-4 py-3 font-mono">{item.code}</td>
                                                <td className="px-4 py-3">{item.name}</td>
                                                <td className="px-4 py-3">{item.requires_expiry_date ? 'Yes' : 'No'}</td>
                                                <td className="px-4 py-3">{item.is_active ? 'Active' : 'Inactive'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.description ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/document-types/${item.id}/edit`}>
                                                            <Button variant="ghost" size="icon" aria-label="Edit">
                                                                <Pencil />
                                                            </Button>
                                                        </Link>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" aria-label="Delete">
                                                                    <Trash2 className="text-destructive" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogTitle>Delete document type?</DialogTitle>
                                                                <DialogDescription>
                                                                    Are you sure you want to delete <strong>{item.name}</strong> ({item.code})?
                                                                </DialogDescription>
                                                                <DialogFooter>
                                                                    <DialogClose asChild>
                                                                        <Button variant="secondary">Cancel</Button>
                                                                    </DialogClose>
                                                                    <Button
                                                                        variant="destructive"
                                                                        onClick={() => router.delete(`/document-types/${item.id}`)}
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <DataTablePagination
                            links={documentTypes.links}
                            from={documentTypes.from}
                            to={documentTypes.to}
                            total={documentTypes.total}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

