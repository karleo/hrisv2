<?php

namespace App\Http\Controllers;

use App\Enums\ItAssetCategory;
use App\Enums\ItAssetStatus;
use App\Http\Requests\ItAsset\AssignItAssetRequest;
use App\Http\Requests\ItAsset\ChangeItAssetStatusRequest;
use App\Http\Requests\ItAsset\ReturnItAssetRequest;
use App\Http\Requests\ItAsset\StoreItAssetRequest;
use App\Http\Requests\ItAsset\UpdateItAssetRequest;
use App\Models\Accessory;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use App\Models\ItAsset;
use App\Models\ItAssetAssignment;
use App\Models\ItAssetAssignmentDocument;
use App\Models\Software;
use App\Services\ItAssetLifecycleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ItAssetController extends Controller
{
    public function __construct(
        private readonly ItAssetLifecycleService $lifecycle,
    ) {}

    public function index(Request $request): Response
    {
        $assets = ItAsset::query()
            ->with([
                'hardware:id,code,name',
                'software:id,code,name',
                'accessory:id,code,name',
                'currentEmployee:id,first_name,last_name',
            ])
            ->when(
                $request->filled('search'),
                function ($query) use ($request): void {
                    $term = '%'.$request->string('search').'%';
                    $query->where(function ($q) use ($term): void {
                        $q->where('code', 'like', $term)
                            ->orWhere('name', 'like', $term)
                            ->orWhere('serial_number', 'like', $term)
                            ->orWhere('license_key', 'like', $term)
                            ->orWhere('asset_tag', 'like', $term)
                            ->orWhereHas('hardware', fn ($hardware) => $hardware
                                ->where('name', 'like', $term)
                                ->orWhere('code', 'like', $term))
                            ->orWhereHas('software', fn ($software) => $software
                                ->where('name', 'like', $term)
                                ->orWhere('code', 'like', $term))
                            ->orWhereHas('accessory', fn ($accessory) => $accessory
                                ->where('name', 'like', $term)
                                ->orWhere('code', 'like', $term));
                    });
                }
            )
            ->when(
                $request->filled('category'),
                fn ($query) => $query->where('category', $request->string('category'))
            )
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status'))
            )
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('it-assets/index', [
            'assets' => $assets,
            'filters' => $request->only('search', 'category', 'status'),
            'categories' => collect(ItAssetCategory::cases())->map(fn (ItAssetCategory $c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ])->values(),
            'statuses' => collect(ItAssetStatus::cases())->map(fn (ItAssetStatus $s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ])->values(),
        ]);
    }

    public function returns(Request $request): Response
    {
        $assignments = ItAssetAssignment::query()
            ->whereNotNull('returned_at')
            ->with([
                'itAsset.hardware:id,code,name',
                'itAsset.software:id,code,name',
                'itAsset.accessory:id,code,name',
                'employee:id,first_name,last_name',
            ])
            ->when(
                $request->filled('search'),
                fn ($query) => $query->whereHas('itAsset', function ($q) use ($request): void {
                    $q->where('code', 'like', '%'.$request->search.'%')
                        ->orWhere('name', 'like', '%'.$request->search.'%');
                })
            )
            ->orderByDesc('returned_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('it-assets/returns', [
            'assignments' => $assignments,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('it-assets/create', $this->formOptions());
    }

    public function store(StoreItAssetRequest $request): RedirectResponse
    {
        $category = ItAssetCategory::from($request->validated('category'));
        $data = $this->categoryPayload($category, $request->validated());

        $asset = $this->lifecycle->createAsset($category, $data, $request->user());

        return to_route('it-assets.show', $asset);
    }

    public function show(ItAsset $itAsset): Response
    {
        $itAsset->load([
            'hardware:id,code,name',
            'hardwareAssetValue:id,asset_model,asset_value,asset_currency',
            'software:id,code,name',
            'accessory:id,code,name',
            'currentEmployee:id,first_name,last_name',
            'assignments.employee:id,first_name,last_name',
            'assignments.assignedBy:id,name',
            'assignments.returnedBy:id,name',
            'assignments.documents',
            'events',
        ]);

        return Inertia::render('it-assets/show', [
            'asset' => $itAsset,
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
            'statuses' => collect(ItAssetStatus::cases())
                ->reject(fn (ItAssetStatus $s) => $s === ItAssetStatus::Assigned)
                ->map(fn (ItAssetStatus $s) => [
                    'value' => $s->value,
                    'label' => $s->label(),
                ])->values(),
        ]);
    }

    public function edit(ItAsset $itAsset): Response
    {
        $itAsset->load([
            'hardware:id,code,name',
            'hardwareAssetValue:id,asset_model',
            'software:id,code,name',
            'accessory:id,code,name',
            'currentEmployee:id,first_name,last_name',
            'activeAssignment.documents',
        ]);

        return Inertia::render('it-assets/edit', [
            'asset' => $itAsset,
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateItAssetRequest $request, ItAsset $itAsset): RedirectResponse
    {
        $this->lifecycle->updateAsset(
            $itAsset,
            $request->safe()->except(['documents']),
            $request->user(),
        );

        if ($itAsset->status === ItAssetStatus::Assigned && $request->hasFile('documents')) {
            $assignment = $itAsset->activeAssignment;

            if ($assignment !== null) {
                foreach ($request->file('documents', []) as $file) {
                    $path = $file->store(
                        "it-assets/{$itAsset->id}/assignments/{$assignment->id}",
                        'public',
                    );

                    $assignment->documents()->create([
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'uploaded_by_user_id' => $request->user()?->id,
                    ]);
                }
            }
        }

        return to_route('it-assets.show', $itAsset);
    }

    public function destroy(ItAsset $itAsset): RedirectResponse
    {
        if ($itAsset->status === ItAssetStatus::Assigned) {
            throw ValidationException::withMessages([
                'asset' => 'Return the asset before deleting it.',
            ]);
        }

        $itAsset->delete();
        $this->lifecycle->recordEvent($itAsset, \App\Enums\ItAssetEventType::Deleted, request()->user());

        return to_route('it-assets.index');
    }

    public function assign(AssignItAssetRequest $request, ItAsset $itAsset): RedirectResponse
    {
        $employee = Employee::query()->findOrFail($request->validated('employee_id'));
        $assignment = $this->lifecycle->assign(
            $itAsset,
            $employee,
            $request->user(),
            $request->validated('assignment_notes'),
        );

        foreach ($request->file('documents', []) as $file) {
            $path = $file->store(
                "it-assets/{$itAsset->id}/assignments/{$assignment->id}",
                'public',
            );

            $assignment->documents()->create([
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'uploaded_by_user_id' => $request->user()?->id,
            ]);
        }

        return to_route('it-assets.show', $itAsset)->with('success', 'Asset assigned successfully.');
    }

    public function returnAsset(ReturnItAssetRequest $request, ItAsset $itAsset): RedirectResponse
    {
        $this->lifecycle->returnAsset(
            $itAsset,
            $request->user(),
            $request->validated('condition_on_return'),
            $request->validated('return_notes'),
        );

        return to_route('it-assets.show', $itAsset)->with('success', 'Asset returned to inventory.');
    }

    public function changeStatus(ChangeItAssetStatusRequest $request, ItAsset $itAsset): RedirectResponse
    {
        $this->lifecycle->changeStatus(
            $itAsset,
            ItAssetStatus::from($request->validated('status')),
            $request->user(),
            $request->validated('notes'),
        );

        return to_route('it-assets.show', $itAsset)->with('success', 'Asset status updated.');
    }

    public function print(ItAsset $itAsset): Response
    {
        $itAsset->load([
            'hardware:id,code,name',
            'hardwareAssetValue:id,asset_model,asset_value,asset_currency',
        ]);

        return Inertia::render('it-assets/print', [
            'asset' => $itAsset,
        ]);
    }

    public function showAssignmentDocument(ItAssetAssignmentDocument $it_asset_assignment_document): BinaryFileResponse
    {
        $relativePath = str_replace('\\', '/', ltrim($it_asset_assignment_document->path, '/'));

        if (! Storage::disk('public')->exists($relativePath)) {
            abort(404, 'Document file not found.');
        }

        return response()->file(
            Storage::disk('public')->path($relativePath),
            [
                'Content-Disposition' => 'inline; filename="'.$it_asset_assignment_document->original_name.'"',
            ],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        $hardware = Hardware::query()->orderBy('code')->get(['id', 'code', 'name']);
        $assetValues = HardwareAssetValue::query()
            ->where('is_active', true)
            ->with('hardware:id,code,name')
            ->orderBy('asset_model')
            ->get(['id', 'hardware_id', 'asset_model', 'serial_number', 'asset_value', 'asset_currency']);

        return [
            'categories' => collect(ItAssetCategory::cases())->map(fn (ItAssetCategory $c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ])->values(),
            'hardware' => $hardware,
            'hardwareAssetValues' => $assetValues,
            'software' => Software::query()->orderBy('code')->get(['id', 'code', 'name']),
            'accessories' => Accessory::query()->orderBy('code')->get(['id', 'code', 'name']),
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function categoryPayload(ItAssetCategory $category, array $validated): array
    {
        $base = [
            'name' => $validated['name'],
            'condition_notes' => $validated['condition_notes'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
        ];

        return match ($category) {
            ItAssetCategory::Hardware => [
                ...$base,
                'hardware_id' => $validated['hardware_id'],
                'hardware_asset_value_id' => $validated['hardware_asset_value_id'] ?? null,
                'serial_number' => $validated['serial_number'] ?? null,
                'asset_tag' => $validated['asset_tag'] ?? null,
                'purchase_date' => $validated['purchase_date'] ?? null,
                'warranty_expires_at' => $validated['warranty_expires_at'] ?? null,
                'asset_value' => $validated['asset_value'] ?? null,
                'asset_currency' => $validated['asset_currency'] ?? null,
            ],
            ItAssetCategory::Software => [
                ...$base,
                'software_id' => $validated['software_id'],
                'license_key' => $validated['license_key'] ?? null,
                'license_seats' => $validated['license_seats'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
            ],
            ItAssetCategory::Accessory => [
                ...$base,
                'accessory_id' => $validated['accessory_id'],
                'serial_number' => $validated['serial_number'] ?? null,
                'asset_tag' => $validated['asset_tag'] ?? null,
            ],
        };
    }
}
