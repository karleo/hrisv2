<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            ->with(['role:id,name', 'employee:id,employee_code,first_name,last_name'])
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

        $user = User::query()->create($data);

        $this->syncEmployeeLink($user, $employeeId);

        return to_route('users.index')->with('success', 'User created.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $user->load(['role:id,name', 'employee:id,employee_code,first_name,last_name']);

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
        $data = $request->validated();
        $employeeId = $data['employee_id'] ?? null;
        $employeeId = $employeeId !== null ? (int) $employeeId : null;
        unset($data['employee_id']);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        $this->syncEmployeeLink($user, $employeeId);

        return back()->with('success', 'User updated.');
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
}
