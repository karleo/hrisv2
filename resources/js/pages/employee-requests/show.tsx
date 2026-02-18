import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
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

type JobPosition = {
    id: number;
    name: string;
};

type EmployeeRequest = {
    id: number;
    code: string;
    employee_id: number;
    job_position_id: number;
    department_id: number;
    date: string;
    date_of_joining: string;
    status: string;
    departure_date: string | null;
    arrival_date: string | null;
    preferred_airlines: string | null;
    last_encashment_date: string | null;
    bag_allowance: string | null;
    employee?: Employee;
    department?: Department;
    job_position?: JobPosition;
};

function formatDateDdMmYyyy(value: string | null | undefined): string {
    if (value == null || value === '') return '—';
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [, yyyy, mm, dd] = match;
        return `${dd}/${mm}/${yyyy}`;
    }
    return value;
}

export default function Show({
    employeeRequest,
}: {
    employeeRequest: EmployeeRequest;
}) {
    const requestLabel = employeeRequest.code || `Request #${employeeRequest.id}`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employee Requests', href: '/employee-requests' },
        { title: requestLabel, href: '#' },
    ];

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('print') === '1') {
            window.print();
        }
    }, []);

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Employee Request #${employeeRequest.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 print:bg-white">
                <div className="flex items-center justify-between gap-2 print:hidden">
                    <Link
                        href="/employee-requests"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Employee Requests
                    </Link>
                    <Button onClick={handlePrint}>
                        <Printer className="size-4" />
                        Print
                    </Button>
                </div>

                <div className="mt-2 rounded-xl border bg-background p-6 shadow-sm print:border-0 print:shadow-none">
                    <Heading
                        title="Employee Request Form"
                        description={requestLabel}
                    />

                    <div className="mt-6 grid gap-6 text-sm print:text-black">
                        <div>
                            <div className="font-semibold">Request Code</div>
                            <div>{employeeRequest.code || '—'}</div>
                        </div>
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            <div>
                                <div className="font-semibold">Employee</div>
                                <div>
                                    {employeeRequest.employee
                                        ? `${employeeRequest.employee.first_name} ${employeeRequest.employee.last_name}`
                                        : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold">
                                    Department
                                </div>
                                <div>
                                    {employeeRequest.department?.name ?? '—'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold">Job Position</div>
                            <div>
                                {employeeRequest.job_position?.name ?? '—'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            <div>
                                <div className="font-semibold">Date</div>
                                <div>{formatDateDdMmYyyy(employeeRequest.date)}</div>
                            </div>
                            <div>
                                <div className="font-semibold">
                                    Date of Joining
                                </div>
                                <div>{formatDateDdMmYyyy(employeeRequest.date_of_joining)}</div>
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold">Request details</div>
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Departure date
                                    </div>
                                    <div>
                                        {formatDateDdMmYyyy(employeeRequest.departure_date)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Arrival date
                                    </div>
                                    <div>
                                        {formatDateDdMmYyyy(employeeRequest.arrival_date)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Preferred airlines
                                    </div>
                                    <div>
                                        {employeeRequest.preferred_airlines ??
                                            '—'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Last Encashment Date
                                    </div>
                                    <div>
                                        {formatDateDdMmYyyy(employeeRequest.last_encashment_date)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Bag Allowance
                                    </div>
                                    <div>
                                        {employeeRequest.bag_allowance ?? '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold">Status</div>
                            <div>
                                {employeeRequest.status === 'draft'
                                    ? 'Draft'
                                    : 'Submitted'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

