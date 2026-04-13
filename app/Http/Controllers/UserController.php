<?php

namespace App\Http\Controllers;

use App\Contracts\FaceVerificationContract;
use App\Enums\FaceProfileAngle;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class UserController extends Controller
{
    public function __construct(
        private readonly FaceVerificationContract $faceVerification,
    ) {}

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
            ->through(function (User $user): User {
                $user->face_enrolled = $user->face_enrolled_at !== null || (is_array($user->face_profile) && $user->face_profile !== []);

                return $user;
            })
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
        $validated = $request->validated();

        $imagesByAngle = [];
        foreach (FaceProfileAngle::ordered() as $angle) {
            $field = 'face_capture_'.$angle->value;
            $file = $request->file($field);
            if ($file === null || ! $file->isValid()) {
                throw ValidationException::withMessages([
                    $field => __('A valid face capture is required for this angle.'),
                ]);
            }
            $imagesByAngle[$angle->value] = $file;
        }

        $employeeId = isset($validated['employee_id']) ? (int) $validated['employee_id'] : null;

        $faceFields = array_map(
            static fn (FaceProfileAngle $a): string => 'face_capture_'.$a->value,
            FaceProfileAngle::ordered(),
        );

        $data = collect($validated)
            ->except(array_merge(['employee_id'], $faceFields))
            ->all();
        $data['role_id'] = $this->resolvedRoleId($data['role_id'] ?? null);

        try {
            DB::transaction(function () use ($data, $employeeId, $imagesByAngle): void {
                $user = User::query()->create($data);
                $this->syncEmployeeLink($user, $employeeId);
                $this->faceVerification->enrollProfile($user, $imagesByAngle);
            });
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'face_capture_front' => __('Face enrollment failed. Try again with new captures for each angle.'),
            ]);
        }

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
            'userFace' => [
                'enrolled' => $user->face_enrolled_at !== null || (is_array($user->face_profile) && $user->face_profile !== []),
                'enrolled_at' => $user->face_enrolled_at?->toIso8601String(),
                'provider' => $user->face_provider,
                'angles' => array_values(array_filter(
                    array_keys(is_array($user->face_profile) ? $user->face_profile : []),
                    static fn (mixed $value): bool => in_array($value, array_map(
                        static fn (FaceProfileAngle $angle): string => $angle->value,
                        FaceProfileAngle::ordered(),
                    ), true),
                )),
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_id' => $user->role_id,
                'employee_id' => $user->employee?->id,
                'face_enrolled' => $user->face_enrolled_at !== null,
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

        $imagesByAngle = [];
        $anyFaceFile = false;
        foreach (FaceProfileAngle::ordered() as $angle) {
            $field = 'face_capture_'.$angle->value;
            $file = $request->file($field);
            if ($file !== null && $file->isValid()) {
                $imagesByAngle[$angle->value] = $file;
                $anyFaceFile = true;
            }
        }

        $attemptFaceEnroll = $anyFaceFile;
        if ($attemptFaceEnroll && count($imagesByAngle) !== count(FaceProfileAngle::ordered())) {
            throw ValidationException::withMessages([
                'face_capture_front' => __('Updating face sign-in requires front, left, and right captures together.'),
            ]);
        }

        $employeeId = array_key_exists('employee_id', $validated)
            ? $validated['employee_id']
            : null;
        $employeeId = $employeeId !== null && $employeeId !== ''
            ? (int) $employeeId
            : null;

        $data = $validated;
        unset($data['employee_id']);
        foreach (FaceProfileAngle::ordered() as $angle) {
            unset($data['face_capture_'.$angle->value]);
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $data['role_id'] = $this->resolvedRoleId($data['role_id'] ?? null);

        try {
            DB::transaction(function () use ($user, $data, $employeeId, $imagesByAngle, $attemptFaceEnroll): void {
                $user->update($data);
                $this->syncEmployeeLink($user, $employeeId);
                if ($attemptFaceEnroll) {
                    $this->faceVerification->enrollProfile($user->fresh(), $imagesByAngle);
                }
            });
        } catch (Throwable $e) {
            report($e);

            if ($attemptFaceEnroll) {
                throw ValidationException::withMessages([
                    'face_capture_front' => __('Face enrollment failed. Try again with new captures for each angle.'),
                ]);
            }

            throw $e;
        }

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

        if ($user->face_enrolled_at !== null || (is_array($user->face_profile) && $user->face_profile !== [])) {
            $this->faceVerification->deleteReference($user);
        }

        $user->delete();

        return to_route('users.index')->with('success', 'User deleted.');
    }

    public function destroyFaceLogin(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();
        if ($actor === null || ! $actor->isAdministrator()) {
            abort(403);
        }

        $this->faceVerification->deleteReference($user);

        return to_route('users.edit', $user)->with('success', 'Face login disabled for this user.');
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
