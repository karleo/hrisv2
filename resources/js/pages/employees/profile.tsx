import { Head, Link } from '@inertiajs/react';
import { Building2, Briefcase, Clock, Download, Eye, Mail, MapPin, Phone, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Department = {
    id: number;
    code: string;
    name: string;
};

type JobPosition = {
    id: number;
    code: string;
    name: string;
};

type CompanyProfile = {
    id: number;
    company_name: string;
};

type WorkTimetable = {
    id: number;
    name: string;
};

type Employee = {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    email_address: string;
    contact_number: string | null;
    address_1: string | null;
    address_2: string | null;
    profile_address_1?: string | null;
    profile_address_2?: string | null;
    role: string;
    photo_url: string | null;
    department?: Department | null;
    job_position?: JobPosition | null;
    company_profile?: CompanyProfile | null;
    work_timetable?: WorkTimetable | null;
    documents?: Array<{
        id: number;
        name: string;
        original_name: string;
        url: string;
    }>;
    phone?: string | null;
    mobile?: string | null;
    date_of_birth?: string | null;
    gender?: 'Male' | 'Female' | null;
    marital_status?: 'Single' | 'Married' | 'Other' | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
};

export default function EmployeeProfile({ employee }: { employee: Employee }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Profile', href: '/my-profile' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Profile" />

            <div className="flex min-h-screen flex-col bg-muted/30 px-4 py-8 md:px-8">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                        <p className="text-muted-foreground mt-1">
                            View your information from Employee Master.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                        <Card>
                            <CardContent className="flex flex-col items-center gap-3 p-6">
                                <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                    {employee.photo_url ? (
                                        <img
                                            src={employee.photo_url}
                                            alt="Employee photo"
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <User className="size-10 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold">{employee.first_name} {employee.last_name}</p>
                                    <p className="text-muted-foreground text-sm">{employee.employee_code}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Employee Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Full Name</p>
                                    <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Employee Code</p>
                                    <p className="font-medium">{employee.employee_code}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Email</p>
                                    <p className="inline-flex items-center gap-2 font-medium">
                                        <Mail className="size-4 text-muted-foreground" />
                                        {employee.email_address}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Contact Number</p>
                                    <p className="inline-flex items-center gap-2 font-medium">
                                        <Phone className="size-4 text-muted-foreground" />
                                        {employee.contact_number ?? '—'}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Department</p>
                                    <p className="inline-flex items-center gap-2 font-medium">
                                        <Building2 className="size-4 text-muted-foreground" />
                                        {employee.department?.name ?? '—'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Job Position</p>
                                    <p className="inline-flex items-center gap-2 font-medium">
                                        <Briefcase className="size-4 text-muted-foreground" />
                                        {employee.job_position?.name ?? '—'}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Work Timetable</p>
                                    <p className="inline-flex items-center gap-2 font-medium">
                                        <Clock className="size-4 text-muted-foreground" />
                                        {employee.work_timetable?.name ?? '—'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Company</p>
                                    <p className="font-medium">{employee.company_profile?.company_name ?? '—'}</p>
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <p className="text-muted-foreground text-xs">Address</p>
                                    <p className="inline-flex items-center gap-2 font-medium">
                                        <MapPin className="size-4 text-muted-foreground" />
                                        {[employee.address_1, employee.address_2].filter(Boolean).join(', ') || '—'}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Phone</p>
                                    <p className="font-medium">{employee.phone ?? '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Mobile</p>
                                    <p className="font-medium">{employee.mobile ?? '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Date of Birth</p>
                                    <p className="font-medium">{employee.date_of_birth ?? '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Gender</p>
                                    <p className="font-medium">{employee.gender ?? '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Marital Status</p>
                                    <p className="font-medium">{employee.marital_status ?? '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Emergency Contact Name</p>
                                    <p className="font-medium">{employee.emergency_contact_name ?? '—'}</p>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <p className="text-muted-foreground text-xs">Emergency Contact Phone</p>
                                    <p className="font-medium">{employee.emergency_contact_phone ?? '—'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(employee.documents?.length ?? 0) === 0 ? (
                                <p className="text-muted-foreground text-sm">No documents available.</p>
                            ) : (
                                employee.documents?.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{doc.name}</p>
                                            <p className="text-muted-foreground truncate text-xs">{doc.original_name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button asChild type="button" variant="outline" size="icon">
                                                <Link href={doc.url} target="_blank" rel="noopener noreferrer">
                                                    <Eye className="size-4" />
                                                    <span className="sr-only">Preview</span>
                                                </Link>
                                            </Button>
                                            <Button asChild type="button" variant="outline" size="sm">
                                                <Link href={doc.url}>
                                                    <Download className="mr-1 size-4" />
                                                    Download
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

