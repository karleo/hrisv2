import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/it-requests';
import type { BreadcrumbItem } from '@/types';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
};

type Department = {
    id: number;
    name: string;
};

type Software = {
    id: number;
    code: string;
    name: string;
};

type Hardware = {
    id: number;
    code: string;
    name: string;
};

type ItRequest = {
    id: number;
    employee_id: number;
    department_id: number;
    status: string;
    date: string | null;
    employee?: Employee;
    department?: Department;
    software?: Software | null;
    hardware?: Hardware | null;
};

export default function Show({
    itRequest,
}: {
    itRequest: ItRequest;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'IT Requests', href: index().url },
        { title: `Request #${itRequest.id}`, href: '#' },
    ];

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('print') === '1') {
            window.print();
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`IT Request #${itRequest.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 print:bg-white">
                <div className="flex items-center justify-between gap-2 print:hidden">
                    <Link
                        href={index()}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to IT Requests
                    </Link>
                    <Button onClick={handlePrint}>
                        <Printer className="size-4" />
                        Print
                    </Button>
                </div>

                <div className="mt-2 rounded-xl border bg-background p-6 shadow-sm print:border-0 print:shadow-none">
                    <Heading
                        title="IT Request Form"
                        description={`Request #${itRequest.id}`}
                    />

                    <div className="mt-6 grid gap-4 text-sm print:text-black">
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            <div>
                                <div className="font-semibold">Name</div>
                                <div>
                                    {itRequest.employee
                                        ? `${itRequest.employee.first_name} ${itRequest.employee.last_name}`
                                        : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold">
                                    Department
                                </div>
                                <div>
                                    {itRequest.department?.name ?? '—'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold">Date</div>
                            <div>{itRequest.date ?? '—'}</div>
                        </div>

                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            <div>
                                <div className="font-semibold">
                                    Software Required
                                </div>
                                <div>
                                    {itRequest.software
                                        ? `${itRequest.software.code} - ${itRequest.software.name}`
                                        : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold">
                                    Hardware Request
                                </div>
                                <div>
                                    {itRequest.hardware
                                        ? `${itRequest.hardware.code} - ${itRequest.hardware.name}`
                                        : '—'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold">Status</div>
                            <div>
                                {itRequest.status === 'draft'
                                    ? 'Draft'
                                    : 'Submitted'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-xs text-muted-foreground print:text-black">
                        <p>
                            This document was generated by the HRIS IT Request
                            module.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

