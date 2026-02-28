import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';

type Employee = { id: number; first_name: string; last_name: string };
type Department = { id: number; name: string };
type LeaveRequest = {
    id: number;
    code: string;
    employee_id: number;
    department_id: number;
    absence_types: string[];
    absence_other: string | null;
    details: string | null;
    date: string | null;
    period_from: string | null;
    period_to: string | null;
    days: number | null;
    remarks: string | null;
    status: string;
    created_at: string;
    employee?: Employee;
    department?: Department;
    employee_signature_url?: string | null;
    approved_by_signature_url?: string | null;
};

export default function LeaveRequestPrint({
    leaveRequest,
    companyName,
    companyLogoUrl,
}: {
    leaveRequest: LeaveRequest;
    companyName: string;
    companyLogoUrl: string | null;
}) {
    const handlePrint = () => window.print();

    return (
        <>
            <Head title={`Leave Request ${leaveRequest.code} – Print`} />
            <div className="min-h-screen bg-white p-6 text-black print:p-0">
                {/* Toolbar: hidden when printing */}
                <div className="no-print mb-6 flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <Link
                        href={`/leave-requests/${leaveRequest.id}`}
                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="size-4" />
                        Back to request
                    </Link>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        <Printer className="size-4" />
                        Print
                    </button>
                </div>

                {/* Report content */}
                <article className="mx-auto max-w-2xl">
                    {/* Company header */}
                    <header className="mb-8 flex flex-col items-center border-b border-gray-300 pb-6 text-center">
                        {companyLogoUrl ? (
                            <img
                                src={companyLogoUrl}
                                alt=""
                                className="mb-3 h-16 w-auto object-contain print:h-14"
                            />
                        ) : null}
                        <h1 className="text-xl font-semibold text-gray-900">{companyName}</h1>
                        <p className="mt-1 text-sm text-gray-600">Leave Request</p>
                    </header>

                    {/* Request code and date */}
                    <div className="mb-6 flex justify-between text-sm">
                        <span className="font-medium">Ref: {leaveRequest.code}</span>
                        <span className="text-gray-600">
                            {leaveRequest.created_at
                                ? new Date(leaveRequest.created_at).toLocaleDateString()
                                : ''}
                        </span>
                    </div>

                    {/* Details table */}
                    <table className="w-full border-collapse text-sm">
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 pr-4 font-medium text-gray-600 w-40">Employee</td>
                                <td className="py-2">
                                    {leaveRequest.employee
                                        ? `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`
                                        : '—'}
                                </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 pr-4 font-medium text-gray-600">Department</td>
                                <td className="py-2">{leaveRequest.department?.name ?? '—'}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 pr-4 font-medium text-gray-600">Absence type</td>
                                <td className="py-2">{leaveRequest.absence_types?.[0] ?? '—'}</td>
                            </tr>
                            {leaveRequest.absence_other ? (
                                <tr className="border-b border-gray-200">
                                    <td className="py-2 pr-4 font-medium text-gray-600">Other</td>
                                    <td className="py-2">{leaveRequest.absence_other}</td>
                                </tr>
                            ) : null}
                            <tr className="border-b border-gray-200">
                                <td className="py-2 pr-4 font-medium text-gray-600">Period</td>
                                <td className="py-2">
                                    {leaveRequest.period_from && leaveRequest.period_to
                                        ? `${leaveRequest.period_from} – ${leaveRequest.period_to}`
                                        : '—'}
                                </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 pr-4 font-medium text-gray-600">Days</td>
                                <td className="py-2">{leaveRequest.days ?? '—'}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2 pr-4 font-medium text-gray-600">Status</td>
                                <td className="py-2 capitalize">{leaveRequest.status}</td>
                            </tr>
                            {leaveRequest.remarks ? (
                                <tr className="border-b border-gray-200">
                                    <td className="py-2 pr-4 font-medium text-gray-600 align-top">Remarks</td>
                                    <td className="py-2">{leaveRequest.remarks}</td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="mt-8 grid gap-6 border-t border-gray-200 pt-6 print:grid-cols-2">
                        {leaveRequest.employee_signature_url ? (
                            <div>
                                <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                                    Employee signature
                                </p>
                                <img
                                    src={leaveRequest.employee_signature_url}
                                    alt="Employee signature"
                                    className="h-14 w-48 border border-gray-200 object-contain object-left-top bg-white"
                                />
                            </div>
                        ) : null}
                        {leaveRequest.approved_by_signature_url ? (
                            <div>
                                <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                                    Approved by
                                </p>
                                <img
                                    src={leaveRequest.approved_by_signature_url}
                                    alt="Approved by signature"
                                    className="h-14 w-48 border border-gray-200 object-contain object-left-top bg-white"
                                />
                            </div>
                        ) : null}
                    </div>
                </article>
            </div>

            {/* Print-only styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </>
    );
}
