<?php

namespace App\Http\Middleware;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Controllers\EmployeeTimeEntryController;
use App\Models\User;
use App\Support\ModulePermissionRegistry;
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
            $requirement = [PermissionModule::Dashboard, ModuleAbility::View];
        } else {
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

            abort(403);
        }

        if ($user->hasModuleAbility($requirement[0], $requirement[1])) {
            return $next($request);
        }

        abort(403);
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
}
