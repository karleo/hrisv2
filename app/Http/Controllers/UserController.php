<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        $users = User::query()
            ->with([
                'role:id,name',
                // user_id is required when constraining columns; omitting it breaks hydration.
                'employee:id,user_id,employee_code,first_name,last_name',
            ])
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('name', 'like', '%'.$request->search.'%')
                        ->orWhere('email', 'like', '%'.$request->search.'%')
                )
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        return Inertia::render('users/create', [
            'roles' => Role::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'employees' => Employee::query()
                ->orderBy('employee_code')
                ->get(['id', 'employee_code', 'first_name', 'last_name', 'user_id']),
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $employeeId = isset($data['employee_id']) ? (int) $data['employee_id'] : null;
        unset($data['employee_id']);

        $data['role_id'] = $this->resolvedRoleId($data['role_id'] ?? null);

        $user = User::query()->create($data);

        $this->syncEmployeeLink($user, $employeeId);

        return to_route('users.index')->with('success', 'User created.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $user->load([
            'role:id,name',
            'employee:id,user_id,employee_code,first_name,last_name',
        ]);

        return Inertia::render('users/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_id' => $user->role_id,
                'employee_id' => $user->employee?->id,
            ],
            'roles' => Role::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'employees' => Employee::query()
                ->orderBy('employee_code')
                ->get(['id', 'employee_code', 'first_name', 'last_name', 'user_id']),
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $employeeId = array_key_exists('employee_id', $validated)
            ? $validated['employee_id']
            : null;
        $employeeId = $employeeId !== null && $employeeId !== ''
            ? (int) $employeeId
            : null;

        $data = $validated;
        unset($data['employee_id']);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $data['role_id'] = $this->resolvedRoleId($data['role_id'] ?? null);

        DB::transaction(function () use ($user, $data, $employeeId): void {
            $user->update($data);
            $this->syncEmployeeLink($user, $employeeId);
        });

        return to_route('users.edit', $user)->with('success', 'User updated.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            return back()->withErrors(['user' => 'You cannot delete your own account.']);
        }

        Employee::query()->where('user_id', $user->id)->update(['user_id' => null]);

        $user->delete();

        return to_route('users.index')->with('success', 'User deleted.');
    }

    private function syncEmployeeLink(User $user, ?int $employeeId): void
    {
        Employee::query()->where('user_id', $user->id)->update(['user_id' => null]);

        if ($employeeId === null) {
            return;
        }

        Employee::query()->where('id', $employeeId)->update(['user_id' => $user->id]);
    }

    /**
     * After login, Fortify sends users to the dashboard, which requires Dashboard module view.
     * Users with no role cannot pass {@see User::hasModuleAbility()}; assign the seeded "basic" role instead.
     */
    private function resolvedRoleId(int|string|null $roleId): int
    {
        if ($roleId !== null && $roleId !== '') {
            return (int) $roleId;
        }

        $id = Role::query()->where('slug', 'basic')->value('id');

        if ($id === null) {
            throw new \RuntimeException(
                'The system role "basic" is missing. Run: php artisan db:seed --class=RoleSeeder'
            );
        }

        return (int) $id;
    }
}
