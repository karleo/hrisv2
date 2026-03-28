<?php

namespace App\Http\Controllers;

use App\Enums\PermissionModule;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Models\Role;
use App\Models\RoleModulePermission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    /**
     * Display a listing of roles.
     */
    public function index(Request $request): Response
    {
        $roles = Role::query()
            ->withCount('users')
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('name', 'like', '%'.$request->search.'%')
                        ->orWhere('slug', 'like', '%'.$request->search.'%')
                )
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        return Inertia::render('roles/create', [
            'modules' => $this->modulesForForm(),
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $role = Role::query()->create([
            'name' => $request->validated('name'),
            'slug' => Str::slug($request->validated('slug')),
            'description' => $request->validated('description'),
            'is_system' => false,
        ]);

        $this->syncModulePermissions($role, $request->input('permissions', []));

        return to_route('roles.index')->with('success', 'Role created.');
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        $role->load('modulePermissions');

        return Inertia::render('roles/edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_system' => $role->is_system,
                'permissions' => $role->modulePermissionsPayload(),
            ],
            'modules' => $this->modulesForForm(),
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $validated = $request->validated();

        if ($role->is_system) {
            $role->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);
        } else {
            $role->update([
                'name' => $validated['name'],
                'slug' => Str::slug($validated['slug']),
                'description' => $validated['description'] ?? null,
            ]);
        }

        $this->syncModulePermissions($role, $request->input('permissions', []));

        return back()->with('success', 'Role updated.');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): RedirectResponse
    {
        if ($role->is_system) {
            return back()->withErrors(['role' => 'System roles cannot be deleted.']);
        }

        if ($role->users()->exists()) {
            return back()->withErrors(['role' => 'Cannot delete a role while users are assigned to it.']);
        }

        $role->delete();

        return to_route('roles.index')->with('success', 'Role deleted.');
    }

    /**
     * @return list<array{key: string, label: string}>
     */
    private function modulesForForm(): array
    {
        return array_values(array_map(
            fn (PermissionModule $module) => [
                'key' => $module->value,
                'label' => $module->label(),
                'time_attendance_checks' => $module === PermissionModule::TimeAttendance,
            ],
            PermissionModule::cases()
        ));
    }

    /**
     * @param  array<string, array<string, mixed>>  $permissionsInput
     */
    private function syncModulePermissions(Role $role, array $permissionsInput): void
    {
        foreach (PermissionModule::cases() as $module) {
            $row = $permissionsInput[$module->value] ?? [];
            RoleModulePermission::query()->updateOrCreate(
                [
                    'role_id' => $role->id,
                    'module' => $module,
                ],
                [
                    'can_access' => $this->boolInput($row['can_access'] ?? false),
                    'can_view' => $this->boolInput($row['can_view'] ?? false),
                    'can_create' => $this->boolInput($row['can_create'] ?? false),
                    'can_update' => $this->boolInput($row['can_update'] ?? false),
                    'can_delete' => $this->boolInput($row['can_delete'] ?? false),
                    'can_check_in' => $this->boolInput($row['can_check_in'] ?? false),
                    'can_check_out' => $this->boolInput($row['can_check_out'] ?? false),
                ]
            );
        }
    }

    private function boolInput(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
