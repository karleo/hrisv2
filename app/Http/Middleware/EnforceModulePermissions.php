<?php

namespace App\Http\Middleware;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
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
        }

        if (! $user->hasModuleAbility($requirement[0], $requirement[1])) {
            abort(403);
        }

        return $next($request);
    }
}
