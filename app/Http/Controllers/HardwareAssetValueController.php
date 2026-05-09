<?php

namespace App\Http\Controllers;

use App\Http\Requests\HardwareAssetValue\StoreHardwareAssetValueRequest;
use App\Http\Requests\HardwareAssetValue\UpdateHardwareAssetValueRequest;
use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HardwareAssetValueController extends Controller
{
    public function index(Request $request): Response
    {
        $assetValues = HardwareAssetValue::query()
            ->with('hardware:id,code,name')
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(function ($searchQuery) use ($request): void {
                    $search = (string) $request->search;
                    $searchQuery->where('asset_currency', 'like', '%'.$search.'%')
                        ->orWhereHas('hardware', function ($hardwareQuery) use ($search): void {
                            $hardwareQuery->where('code', 'like', '%'.$search.'%')
                                ->orWhere('name', 'like', '%'.$search.'%');
                        });
                })
            )
            ->latest('effective_from')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('hardware-asset-values/index', [
            'assetValues' => $assetValues,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('hardware-asset-values/create', [
            'hardware' => $this->hardwareOptions(),
        ]);
    }

    public function store(StoreHardwareAssetValueRequest $request): RedirectResponse
    {
        HardwareAssetValue::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active'),
        ]);

        return to_route('hardware-asset-values.index');
    }

    public function edit(HardwareAssetValue $hardware_asset_value): Response
    {
        $hardware_asset_value->load('hardware:id,code,name');

        return Inertia::render('hardware-asset-values/edit', [
            'assetValue' => $hardware_asset_value,
            'hardware' => $this->hardwareOptions(),
        ]);
    }

    public function update(UpdateHardwareAssetValueRequest $request, HardwareAssetValue $hardware_asset_value): RedirectResponse
    {
        $hardware_asset_value->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active'),
        ]);

        return to_route('hardware-asset-values.index');
    }

    public function destroy(HardwareAssetValue $hardware_asset_value): RedirectResponse
    {
        $hardware_asset_value->delete();

        return to_route('hardware-asset-values.index');
    }

    /**
     * @return array<int, array{id: int, code: string, name: string}>
     */
    private function hardwareOptions(): array
    {
        return Hardware::query()
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn (Hardware $hardware): array => [
                'id' => (int) $hardware->id,
                'code' => (string) $hardware->code,
                'name' => (string) $hardware->name,
            ])
            ->all();
    }
}
