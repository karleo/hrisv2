<?php

namespace App\Http\Controllers;

use App\Models\EmployeeRequest;
use App\Models\ItAssetRequest;
use App\Models\ItRequest;
use App\Models\LeaveRequest;
use App\Support\RequestApprovalScope;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly RequestApprovalScope $approvalScope)
    {
    }

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $leavePending = LeaveRequest::query()->where('status', 'submitted');
        $this->approvalScope->scopeVisible($leavePending, $user);

        $employeePending = EmployeeRequest::query()->where('status', 'submitted');
        $this->approvalScope->scopeVisible($employeePending, $user);

        $itPending = ItRequest::query()->where('status', 'submitted');
        $this->approvalScope->scopeVisible($itPending, $user);

        $itAssetPending = ItAssetRequest::query()->where('status', 'submitted');
        $this->approvalScope->scopeVisible($itAssetPending, $user);

        return Inertia::render('dashboard', [
            'pending' => [
                'leave_requests' => $leavePending->count(),
                'employee_requests' => $employeePending->count(),
                'it_requests' => $itPending->count(),
                'it_asset_requests' => $itAssetPending->count(),
            ],
            'recentPending' => [
                'leave_requests' => tap(
                    LeaveRequest::query()
                        ->where('status', 'submitted')
                        ->with('employee:id,first_name,last_name'),
                    fn ($query) => $this->approvalScope->scopeVisible($query, $user)
                )->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (LeaveRequest $item) => [
                        'id' => $item->id,
                        'code' => $item->code,
                        'employee' => trim(($item->employee?->first_name ?? '').' '.($item->employee?->last_name ?? '')),
                    ]),
                'employee_requests' => tap(
                    EmployeeRequest::query()
                        ->where('status', 'submitted')
                        ->with('employee:id,first_name,last_name'),
                    fn ($query) => $this->approvalScope->scopeVisible($query, $user)
                )->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (EmployeeRequest $item) => [
                        'id' => $item->id,
                        'code' => $item->code,
                        'employee' => trim(($item->employee?->first_name ?? '').' '.($item->employee?->last_name ?? '')),
                    ]),
                'it_requests' => tap(
                    ItRequest::query()
                        ->where('status', 'submitted')
                        ->with('employee:id,first_name,last_name'),
                    fn ($query) => $this->approvalScope->scopeVisible($query, $user)
                )->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (ItRequest $item) => [
                        'id' => $item->id,
                        'code' => (string) $item->id,
                        'employee' => trim(($item->employee?->first_name ?? '').' '.($item->employee?->last_name ?? '')),
                    ]),
                'it_asset_requests' => tap(
                    ItAssetRequest::query()
                        ->where('status', 'submitted')
                        ->with('employee:id,first_name,last_name'),
                    fn ($query) => $this->approvalScope->scopeVisible($query, $user)
                )->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (ItAssetRequest $item) => [
                        'id' => $item->id,
                        'code' => $item->code,
                        'employee' => trim(($item->employee?->first_name ?? '').' '.($item->employee?->last_name ?? '')),
                    ]),
            ],
        ]);
    }
}

