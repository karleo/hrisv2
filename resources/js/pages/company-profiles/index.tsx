import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import CompanyProfileController from '@/actions/App/Http/Controllers/CompanyProfileController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { create, edit, index } from '@/routes/company-profiles';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Company Profiles',
        href: index().url,
    },
];

type Country = {
    id: number;
    code: string;
    name: string;
} | null;

type CompanyProfile = {
    id: number;
    logo: string | null;
    logo_url: string | null;
    company_name: string;
    company_address_1: string | null;
    company_address_2: string | null;
    country_id: number | null;
    website: string | null;
    country: Country;
};

type PaginatedCompanyProfiles = {
    data: CompanyProfile[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Index({
    companyProfiles,
    filters = {},
}: {
    companyProfiles: PaginatedCompanyProfiles;
    filters?: { search?: string };
}) {
    const { data: list } = companyProfiles;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Profiles" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Company Profile Master List</CardTitle>
                            <CardDescription>
                                Manage company profiles with logo, address and
                                website
                            </CardDescription>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <DataTableToolbar
                                searchUrl={index().url}
                                searchPlaceholder="Search name, address, website..."
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href={create().url}>
                                <Button>
                                    <Plus />
                                    Add Company Profile
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="w-16 px-4 py-3 text-left font-medium">
                                            Logo
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Company Name
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Address
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Country
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Website
                                        </th>
                                        <th className="w-24 px-4 py-3 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                {filters.search
                                                    ? 'No company profiles match your search.'
                                                    : 'No company profiles found. Create one to get started.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((profile) => (
                                            <tr
                                                key={profile.id}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <td className="px-4 py-3">
                                                    {profile.logo_url ? (
                                                        <img
                                                            src={profile.logo_url}
                                                            alt=""
                                                            className="size-10 rounded object-contain"
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-medium">
                                                    {profile.company_name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {[
                                                        profile.company_address_1,
                                                        profile.company_address_2,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ') || '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {profile.country?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {profile.website ? (
                                                        <a
                                                            href={profile.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary underline underline-offset-2"
                                                        >
                                                            {profile.website}
                                                        </a>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={edit({
                                                                company_profile:
                                                                    profile.id,
                                                            }).url}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label="Edit"
                                                            >
                                                                <Pencil />
                                                            </Button>
                                                        </Link>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label="Delete"
                                                                >
                                                                    <Trash2 className="text-destructive" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogTitle>
                                                                    Delete company
                                                                    profile?
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Are you sure
                                                                    you want to
                                                                    delete{' '}
                                                                    <strong>
                                                                        {
                                                                            profile.company_name
                                                                        }
                                                                    </strong>
                                                                    ? This
                                                                    action cannot
                                                                    be undone.
                                                                </DialogDescription>
                                                                <DialogFooter>
                                                                    <DialogClose asChild>
                                                                        <Button
                                                                            variant="secondary"
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </DialogClose>
                                                                    <Button
                                                                        variant="destructive"
                                                                        onClick={() =>
                                                                            router.delete(
                                                                                CompanyProfileController.destroy.url(
                                                                                    profile.id
                                                                                )
                                                                            )
                                                                        }
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
                            links={companyProfiles.links}
                            from={companyProfiles.from}
                            to={companyProfiles.to}
                            total={companyProfiles.total}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
