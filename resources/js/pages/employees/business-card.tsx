import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/employees';
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

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    email_address: string;
    contact_number: string | null;
    department?: Department | null;
    job_position?: JobPosition | null;
    photo_url: string | null;
};

export default function BusinessCard({
    employee,
    appName,
}: {
    employee: Employee;
    appName: string;
}) {
    const fullName = `${employee.first_name} ${employee.last_name}`;
    const jobTitle = employee.job_position?.name ?? '';
    const department = employee.department?.name ?? '';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employees', href: index().url },
        { title: fullName, href: '#' },
        { title: 'Business card', href: '#' },
    ];

    function handlePrint() {
        window.print();
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Business card – ${fullName}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <Link
                        href={index().url}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Employees
                    </Link>
                    <Button onClick={handlePrint} size="sm">
                        <Printer className="mr-2 size-4" />
                        Print / Save as PDF
                    </Button>
                </div>

                <div className="flex min-h-[50vh] items-start justify-center print:min-h-0 print:items-center print:justify-center">
                    {/* Business card: 3.5" x 2" at 96dpi ≈ 336x192, we use aspect-[3.5/2] and fixed width for print */}
                    <div
                        id="business-card"
                        className="w-[336px] overflow-hidden rounded-lg border border-border bg-card shadow-lg print:w-[3.5in] print:rounded-none print:border-2 print:border-foreground print:shadow-none"
                        style={{ aspectRatio: '3.5 / 2' }}
                    >
                        <div className="flex h-full w-full flex-row gap-0">
                            {/* Left: photo or placeholder */}
                            <div className="flex w-[33%] shrink-0 items-center justify-center bg-muted/50 p-2 print:p-1">
                                {employee.photo_url ? (
                                    <img
                                        src={employee.photo_url}
                                        alt=""
                                        className="size-20 rounded object-cover print:size-16"
                                    />
                                ) : (
                                    <div className="flex size-20 items-center justify-center rounded-full bg-muted print:size-16">
                                        <User className="size-10 text-muted-foreground print:size-8" />
                                    </div>
                                )}
                            </div>
                            {/* Right: details */}
                            <div className="flex flex-1 flex-col justify-center gap-0.5 px-4 py-3 print:gap-0 print:px-3 print:py-2">
                                <p className="text-lg font-semibold leading-tight text-foreground print:text-base">
                                    {fullName}
                                </p>
                                {jobTitle && (
                                    <p className="text-sm font-medium text-foreground/90 print:text-xs">
                                        {jobTitle}
                                    </p>
                                )}
                                {department && (
                                    <p className="text-xs text-muted-foreground print:text-[10px]">
                                        {department}
                                    </p>
                                )}
                                <div className="mt-1.5 space-y-0.5 border-t border-border/50 pt-1.5 print:mt-1 print:space-y-0 print:border-t print:pt-1">
                                    <p className="truncate text-xs text-muted-foreground print:text-[10px]">
                                        {employee.email_address}
                                    </p>
                                    {employee.contact_number && (
                                        <p className="text-xs text-muted-foreground print:text-[10px]">
                                            {employee.contact_number}
                                        </p>
                                    )}
                                </div>
                                {appName && (
                                    <p className="mt-auto pt-1 text-[10px] font-medium text-muted-foreground print:pt-0.5 print:text-[8px]">
                                        {appName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`@media print {
                body * { visibility: hidden; }
                #business-card, #business-card * { visibility: visible; }
                #business-card {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 3.5in;
                    height: 2in;
                    margin: 0;
                    box-shadow: none;
                }
            }`}</style>
        </AppLayout>
    );
}
