<?php

namespace App\Http\Middleware;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Controllers\EmployeeMessageController;
use App\Http\Controllers\EmployeeMessageTypingController;
use App\Http\Controllers\EmployeeRequestController;
use App\Http\Controllers\EmployeeTimeEntryController;
use App\Http\Controllers\ItAssetRequestController;
use App\Http\Controllers\ItRequestController;
use App\Http\Controllers\LeaveCalendarController;
use App\Http\Controllers\LeaveRequestController;
use App\Models\User;
use App\Support\ModulePermissionRegistry;
use App\Support\RequestApprovalScope;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceModulePermissions
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route();

        if ($route === null) {
            return $next($request);
        }

        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        if ($route->getName() === 'dashboard') {
            if ($user->hasModuleAbility(PermissionModule::Dashboard, ModuleAbility::View)) {
                return $next($request);
            }

            if ($user->employee()->exists()) {
                return redirect()->route('my-profile.show');
            }

            return redirect()->route('profile.edit');
        }

        $action = $route->getAction('controller');

        if (is_array($action) && count($action) === 2) {
            [$controller, $method] = $action;
        } elseif (is_string($action)) {
            $parts = explode('@', $action, 2);
            $controller = $parts[0];
            $method = $parts[1] ?? '__invoke';
        } else {
            return $next($request);
        }

        if (! is_string($controller) || ! is_string($method)) {
            return $next($request);
        }

        $requirement = ModulePermissionRegistry::forControllerAction($controller, $method);

        if ($requirement === null) {
            return $next($request);
        }

        if ($user->hasModuleAbility($requirement[0], $requirement[1])) {
            return $next($request);
        }

        if (self::allowsEmployeeSelfServiceTimeAttendance($user, $controller, $method)) {
            return $next($request);
        }

        if (self::allowsEmployeeMessaging($user, $controller)) {
            return $next($request);
        }

        if (self::allowsScopedRequestWorkflowAccess($user, $controller, $method)) {
            return $next($request);
        }

        if (self::allowsScopedLeaveCalendarAccess($user, $controller, $method)) {
            return $next($request);
        }

        abort(403);
    }

    private static function allowsEmployeeMessaging(User $user, string $controller): bool
    {
        if (! in_array($controller, [EmployeeMessageController::class, EmployeeMessageTypingController::class], true)) {
            return false;
        }

        return $user->isAccountActive() && $user->employee !== null;
    }

    /**
     * Linked employees can check themselves in or out when they can view Time & attendance,
     * without requiring the role’s Check in / Check out toggles (those gate admin-assisted flows).
     */
    private static function allowsEmployeeSelfServiceTimeAttendance(User $user, string $controller, string $method): bool
    {
        if ($controller !== EmployeeTimeEntryController::class) {
            return false;
        }

        if (! in_array($method, ['store', 'checkOut'], true)) {
            return false;
        }

        if ($user->isAdministrator()) {
            return false;
        }

        if ($user->employee === null) {
            return false;
        }

        return $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::View);
    }

    /**
     * Allow request-workflow routes to proceed for manager/HR/employee scoped access.
     * Record-level checks still run inside the controllers via RequestApprovalScope.
     */
    private static function allowsScopedRequestWorkflowAccess(User $user, string $controller, string $method): bool
    {
        $requestControllers = [
            LeaveRequestController::class,
            ItRequestController::class,
            EmployeeRequestController::class,
            ItAssetRequestController::class,
        ];

        if (! in_array($controller, $requestControllers, true)) {
            return false;
        }

        $allowedMethods = [
            'index',
            'create',
            'store',
            'show',
            'edit',
            'update',
            'print',
            'submit',
            'decide',
            'updateSignatures',
            'destroy',
        ];

        if (! in_array($method, $allowedMethods, true)) {
            return false;
        }

        /** @var RequestApprovalScope $scope */
        $scope = app(RequestApprovalScope::class);

        return $scope->isAdministratorOrHr($user)
            || $scope->managedDepartmentIds($user) !== []
            || $user->employee !== null;
    }

    /**
     * Allow Leave Calendar for department managers by default.
     * Record-level scoping is enforced in LeaveCalendarController.
     */
    private static function allowsScopedLeaveCalendarAccess(User $user, string $controller, string $method): bool
    {
        if ($controller !== LeaveCalendarController::class || $method !== 'index') {
            return false;
        }

        /** @var RequestApprovalScope $scope */
        $scope = app(RequestApprovalScope::class);

        return $scope->managedDepartmentIds($user) !== [];
    }
}
