<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Support\EmployeePresence\EmployeePresenceOnlineData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmployeePresenceStatusController extends Controller
{
    /**
     * @deprecated Use {@see EmployeePresenceOnlineData::cacheKey()}
     */
    public static function cacheKey(int $employeeId): string
    {
        return EmployeePresenceOnlineData::cacheKey($employeeId);
    }

    public function heartbeat(Request $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $employee = $user?->employee;

        if (! $employee instanceof Employee || $user?->is_active !== true) {
            abort(403);
        }

        EmployeePresenceOnlineData::recordHeartbeat($employee);

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json(['ok' => true]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $viewer = $user?->employee;

        if (! $viewer instanceof Employee || $user?->is_active !== true) {
            abort(403);
        }

        $payload = app(EmployeePresenceOnlineData::class)->onlinePeersForViewer($viewer);

        return response()->json($payload);
    }
}
