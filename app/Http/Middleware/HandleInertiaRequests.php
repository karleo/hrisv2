<?php

namespace App\Http\Middleware;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\User;
use App\Support\EmployeeMessages\EmployeeMessagesHeaderData;
use App\Support\EmployeePresence\EmployeePresenceOnlineData;
use App\Support\LocaleConfig;
use App\Support\RequestApprovalScope;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => app()->getLocale(),
            'locales' => LocaleConfig::supported(),
            'csrf_token' => csrf_token(),
            'auth' => [
                'user' => $request->user(),
                'has_employee_profile' => $request->user()?->employee()->exists() ?? false,
                'employee_id' => $this->employeeIdForPresence($request->user()),
                'has_my_profile_access' => $this->hasMyProfileAccess($request->user()),
                'has_leave_calendar_access' => $this->hasLeaveCalendarAccess($request->user()),
            ],
            ...($this->shouldShareEmployeeMessages($request)
                ? ['employeeMessages' => fn () => $this->employeeMessagesPayload($request)]
                : []),
            // Always: partial reloads must still ship viewer id + presence (see employee-presence-context).
            'viewerEmployeeId' => Inertia::always(fn () => $this->employeeIdForPresence($request->user())),
            // Always: partial reloads (e.g. only: ['conversations']) must still ship presence data.
            'employeePresence' => Inertia::always(fn () => $this->employeePresenceSharedPayload($request)),
            'modulePermissions' => (object) ($request->user()?->modulePermissionsPayload() ?? []),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'notifications' => $request->user()
                ? [
                    'unread_count' => $request->user()->unreadNotifications()->count(),
                    'items' => $request->user()
                        ->notifications()
                        ->latest()
                        ->limit(10)
                        ->get()
                        ->map(fn ($notification) => [
                            'id' => $notification->id,
                            'type' => $notification->type,
                            'data' => $notification->data,
                            'read_at' => $notification->read_at?->toIso8601String(),
                            'created_at' => $notification->created_at?->toIso8601String(),
                        ]),
                ]
                : ['unread_count' => 0, 'items' => []],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'sync_log_id' => $request->session()->get('sync_log_id'),
            ],
        ];
    }

    /**
     * @return array{unread_count:int,conversations:array<int,array<string,mixed>>}
     */
    private function employeeMessagesPayload(Request $request): array
    {
        $user = $request->user();

        if (! $user instanceof User || $user->is_active !== true) {
            return ['unread_count' => 0, 'conversations' => []];
        }

        $employee = $user->employee;

        if ($employee === null) {
            return ['unread_count' => 0, 'conversations' => []];
        }

        return app(EmployeeMessagesHeaderData::class)->forEmployee($employee);
    }

    private function shouldShareEmployeeMessages(Request $request): bool
    {
        $user = $request->user();

        if (! $user instanceof User || $user->is_active !== true) {
            return false;
        }

        return $user->employee()->exists();
    }

    /**
     * @return array{employee_ids: list<int>, employees: list<array<string, mixed>>}
     */
    private function employeePresenceSharedPayload(Request $request): array
    {
        $user = $request->user();

        if (! $user instanceof User || $user->is_active !== true) {
            return ['employee_ids' => [], 'employees' => []];
        }

        $employee = $user->employee;

        if ($employee === null) {
            return ['employee_ids' => [], 'employees' => []];
        }

        return app(EmployeePresenceOnlineData::class)->onlinePeersForViewer($employee);
    }

    private function employeeIdForPresence(?User $user): ?int
    {
        if (! $user instanceof User || $user->is_active !== true) {
            return null;
        }

        $id = filter_var($user->employee?->id, FILTER_VALIDATE_INT);

        return $id !== false && $id > 0 ? $id : null;
    }

    private function hasLeaveCalendarAccess(?User $user): bool
    {
        if (! $user instanceof User) {
            return false;
        }

        /** @var RequestApprovalScope $approvalScope */
        $approvalScope = app(RequestApprovalScope::class);
        $isDepartmentManager = $approvalScope->managedDepartmentIds($user) !== [];

        // Department managers should see Leave Calendar by default.
        if ($isDepartmentManager) {
            return true;
        }

        if (! $user->hasModuleAbility(PermissionModule::LeaveCalendar, ModuleAbility::View)) {
            return false;
        }

        return $approvalScope->isAdministratorOrHr($user)
            || $user->employee()->exists();
    }

    private function hasMyProfileAccess(?User $user): bool
    {
        if (! $user instanceof User) {
            return false;
        }

        return $user->isAdministrator() || $user->employee()->exists();
    }
}
