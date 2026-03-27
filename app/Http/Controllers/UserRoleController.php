<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRole\UpdateUserRoleRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserRoleController extends Controller
{
    /**
     * List users with their assigned roles.
     */
    public function index(Request $request): Response
    {
        $users = User::query()
            ->with(['role:id,name,slug'])
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

        $roles = Role::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'is_system']);

        return Inertia::render('user-roles/index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Update a user's assigned role.
     */
    public function update(UpdateUserRoleRequest $request, User $user): RedirectResponse
    {
        $user->update($request->validated());

        return back()->with('success', 'User role updated.');
    }
}
