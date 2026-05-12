<?php

namespace App\Support;

use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use App\Models\ItAssetRequest;
use App\Models\ItAssetRequestHardwareItem;
use Illuminate\Support\Collection;

class ItAssetValuation
{
    public function normalizeCurrency(?string $currency): ?string
    {
        $normalized = strtoupper(trim((string) $currency));

        return $normalized !== '' ? $normalized : null;
    }

    /**
     * @param  array<int, array{hardware_asset_value_id?: int|null, hardware_id: int, serial_number: string|null}>  $hardwareItems
     * @return array<int, array{hardware_asset_value_id: int|null, hardware_id: int, serial_number: string|null, hardware_code_snapshot: string|null, hardware_name_snapshot: string|null, asset_model_snapshot: string|null, serial_number_snapshot: string|null, asset_value_snapshot: string|null, asset_currency_snapshot: string|null}>
     */
    public function withSnapshots(array $hardwareItems): array
    {
        if ($hardwareItems === []) {
            return [];
        }

        $hardwareIds = array_map(fn (array $item): int => $item['hardware_id'], $hardwareItems);
        $assetValueIds = array_values(array_unique(array_filter(
            array_map(fn (array $item): ?int => isset($item['hardware_asset_value_id']) ? (int) $item['hardware_asset_value_id'] : null, $hardwareItems),
            fn (?int $id): bool => $id !== null && $id > 0,
        )));
        $hardwareById = Hardware::withTrashed()
            ->whereIn('id', $hardwareIds)
            ->get(['id', 'code', 'name'])
            ->keyBy('id');
        $assetValuesById = HardwareAssetValue::with('hardware:id,code,name')
            ->whereIn('id', $assetValueIds)
            ->get()
            ->keyBy('id');
        $assetValuesByHardwareId = $this->latestActiveValuesForHardwareIds($hardwareIds);

        return array_map(function (array $item) use ($hardwareById, $assetValuesById, $assetValuesByHardwareId): array {
            $assetValueId = isset($item['hardware_asset_value_id']) && $item['hardware_asset_value_id'] !== null
                ? (int) $item['hardware_asset_value_id']
                : null;
            $selectedAssetValue = $assetValueId !== null ? $assetValuesById->get($assetValueId) : null;
            $hardwareId = $selectedAssetValue !== null ? (int) $selectedAssetValue->hardware_id : (int) $item['hardware_id'];
            $hardware = $selectedAssetValue?->hardware ?? $hardwareById->get($hardwareId);
            $assetValue = $selectedAssetValue ?? $assetValuesByHardwareId->get($hardwareId);
            $serialNumber = $item['serial_number'] ?? null;
            if (blank($serialNumber) && filled($selectedAssetValue?->serial_number)) {
                $serialNumber = (string) $selectedAssetValue->serial_number;
            }

            return [
                ...$item,
                'hardware_asset_value_id' => $assetValueId,
                'hardware_id' => $hardwareId,
                'serial_number' => $serialNumber,
                'hardware_code_snapshot' => $hardware?->code,
                'hardware_name_snapshot' => $hardware?->name,
                'asset_model_snapshot' => $assetValue?->asset_model,
                'serial_number_snapshot' => $serialNumber,
                'asset_value_snapshot' => $assetValue?->asset_value,
                'asset_currency_snapshot' => $this->normalizeCurrency($assetValue?->asset_currency),
            ];
        }, $hardwareItems);
    }

    public function fillMissingSnapshots(ItAssetRequest $itAssetRequest): void
    {
        $itAssetRequest->loadMissing('hardwareItems.hardware', 'hardwareItems.hardwareAssetValue');
        $assetValuesByHardwareId = $this->latestActiveValuesForHardwareIds(
            $itAssetRequest->hardwareItems->pluck('hardware_id')->map(fn ($id): int => (int) $id)->all()
        );

        foreach ($itAssetRequest->hardwareItems as $item) {
            $assetValue = $item->hardwareAssetValue ?? $assetValuesByHardwareId->get((int) $item->hardware_id);
            $updates = [];

            if (blank($item->hardware_code_snapshot) && filled($item->hardware?->code)) {
                $updates['hardware_code_snapshot'] = $item->hardware->code;
            }

            if (blank($item->hardware_name_snapshot) && filled($item->hardware?->name)) {
                $updates['hardware_name_snapshot'] = $item->hardware->name;
            }

            if (blank($item->serial_number_snapshot) && filled($item->serial_number)) {
                $updates['serial_number_snapshot'] = $item->serial_number;
            }

            if (blank($item->asset_model_snapshot) && filled($assetValue?->asset_model)) {
                $updates['asset_model_snapshot'] = $assetValue->asset_model;
            }

            if ($item->asset_value_snapshot === null && $assetValue?->asset_value !== null) {
                $updates['asset_value_snapshot'] = $assetValue->asset_value;
            }

            if (blank($item->asset_currency_snapshot) && filled($assetValue?->asset_currency)) {
                $updates['asset_currency_snapshot'] = $this->normalizeCurrency($assetValue->asset_currency);
            }

            if ($updates !== []) {
                $item->forceFill($updates)->save();
            }
        }
    }

    /**
     * @return array<int, array{hardware_asset_value_id: int|null, hardware_id: int|null, asset_model: string|null, serial_number: string|null, asset_value: string|null, asset_currency: string|null, hardware: array{id: int|null, code: string, name: string}}>
     */
    public function resolvedHardwareItemsForDisplay(ItAssetRequest $itAssetRequest): array
    {
        $items = $itAssetRequest->hardwareItems
            ->map(function (ItAssetRequestHardwareItem $item): ?array {
                $hardwareName = $item->hardware?->name ?? $item->hardware_name_snapshot;
                $hardwareCode = $item->hardware?->code ?? $item->hardware_code_snapshot;

                if (! is_string($hardwareName) || trim($hardwareName) === '') {
                    return null;
                }

                return [
                    'hardware_asset_value_id' => $item->hardware_asset_value_id !== null ? (int) $item->hardware_asset_value_id : null,
                    'hardware_id' => (int) $item->hardware_id,
                    'asset_model' => $item->asset_model_snapshot ?: $item->hardwareAssetValue?->asset_model,
                    'serial_number' => $item->hardware !== null
                        ? ($item->serial_number !== null && $item->serial_number !== '' ? (string) $item->serial_number : null)
                        : ($item->serial_number_snapshot !== null && $item->serial_number_snapshot !== ''
                            ? (string) $item->serial_number_snapshot
                            : ($item->serial_number !== null && $item->serial_number !== '' ? (string) $item->serial_number : null)),
                    'asset_value' => $item->asset_value_snapshot !== null ? (string) $item->asset_value_snapshot : null,
                    'asset_currency' => $this->normalizeCurrency($item->asset_currency_snapshot),
                    'hardware' => [
                        'id' => $item->hardware?->id !== null ? (int) $item->hardware->id : null,
                        'code' => is_string($hardwareCode) ? $hardwareCode : '',
                        'name' => $hardwareName,
                    ],
                ];
            })
            ->filter()
            ->values()
            ->all();

        if ($items !== []) {
            return $items;
        }

        return $this->legacyHardwareItemsForDisplay($itAssetRequest);
    }

    /**
     * @param  array<int, array<string, mixed>>  $hardwareItems
     * @return array<int, array{currency: string, total: string, count: int}>
     */
    public function totalsForHardwareItems(array $hardwareItems): array
    {
        $totals = [];

        foreach ($hardwareItems as $item) {
            $currency = $this->normalizeCurrency(is_string($item['asset_currency'] ?? null) ? $item['asset_currency'] : null);
            $value = $item['asset_value'] ?? null;

            if ($currency === null || $value === null || $value === '') {
                continue;
            }

            $totals[$currency] ??= ['currency' => $currency, 'total' => 0.0, 'count' => 0];
            $totals[$currency]['total'] += (float) $value;
            $totals[$currency]['count']++;
        }

        ksort($totals);

        return array_map(
            fn (array $total): array => [
                'currency' => $total['currency'],
                'total' => number_format((float) $total['total'], 2, '.', ''),
                'count' => (int) $total['count'],
            ],
            array_values($totals)
        );
    }

    /**
     * @return array<int, array{id: int, code: string, name: string, asset_value: string|null, asset_currency: string|null}>
     */
    public function hardwareOptions(): array
    {
        $hardware = Hardware::query()
            ->orderBy('name')
            ->get(['id', 'code', 'name']);
        $assetValuesByHardwareId = $this->latestActiveValuesForHardwareIds(
            $hardware->pluck('id')->map(fn ($id): int => (int) $id)->all()
        );

        return $hardware
            ->map(function (Hardware $hardware) use ($assetValuesByHardwareId): array {
                $assetValue = $assetValuesByHardwareId->get((int) $hardware->id);

                return [
                    'id' => (int) $hardware->id,
                    'code' => (string) $hardware->code,
                    'name' => (string) $hardware->name,
                    'asset_value' => $assetValue?->asset_value !== null ? (string) $assetValue->asset_value : null,
                    'asset_currency' => $this->normalizeCurrency($assetValue?->asset_currency),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, hardware_id: int, code: string, name: string, asset_model: string|null, serial_number: string|null, vendor: string|null, specs: string|null, asset_value: string|null, asset_currency: string|null}>
     */
    public function assetOptions(): array
    {
        return $this->activeAssetValueQuery()
            ->with('hardware:id,code,name')
            ->orderBy('asset_model')
            ->orderBy('serial_number')
            ->orderByDesc('id')
            ->get()
            ->filter(fn (HardwareAssetValue $assetValue): bool => $assetValue->hardware !== null)
            ->map(fn (HardwareAssetValue $assetValue): array => [
                'id' => (int) $assetValue->id,
                'hardware_id' => (int) $assetValue->hardware_id,
                'code' => (string) $assetValue->hardware->code,
                'name' => (string) $assetValue->hardware->name,
                'asset_model' => $assetValue->asset_model,
                'serial_number' => $assetValue->serial_number,
                'vendor' => $assetValue->vendor,
                'specs' => $assetValue->specs,
                'asset_value' => $assetValue->asset_value !== null ? (string) $assetValue->asset_value : null,
                'asset_currency' => $this->normalizeCurrency($assetValue->asset_currency),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<int, int>  $hardwareIds
     * @return Collection<int, HardwareAssetValue>
     */
    private function latestActiveValuesForHardwareIds(array $hardwareIds): Collection
    {
        $hardwareIds = array_values(array_unique(array_filter($hardwareIds, fn (int $id): bool => $id > 0)));
        if ($hardwareIds === []) {
            return collect();
        }

        $today = now()->toDateString();

        return $this->activeAssetValueQuery()
            ->whereIn('hardware_id', $hardwareIds)
            ->orderBy('hardware_id')
            ->orderByRaw('CASE WHEN effective_from IS NULL THEN 1 ELSE 0 END')
            ->orderByDesc('effective_from')
            ->orderByDesc('id')
            ->get()
            ->unique('hardware_id')
            ->keyBy('hardware_id');
    }

    private function activeAssetValueQuery(): \Illuminate\Database\Eloquent\Builder
    {
        $today = now()->toDateString();

        return HardwareAssetValue::query()
            ->where('is_active', true)
            ->where(function ($query) use ($today): void {
                $query->whereNull('effective_from')
                    ->orWhereDate('effective_from', '<=', $today);
            })
            ->where(function ($query) use ($today): void {
                $query->whereNull('effective_to')
                    ->orWhereDate('effective_to', '>=', $today);
            });
    }

    /**
     * @return array<int, array{hardware_asset_value_id: int|null, hardware_id: int|null, asset_model: string|null, serial_number: string|null, asset_value: string|null, asset_currency: string|null, hardware: array{id: int|null, code: string, name: string}}>
     */
    private function legacyHardwareItemsForDisplay(ItAssetRequest $itAssetRequest): array
    {
        $legacyHardwareIds = is_array($itAssetRequest->hardware_ids) ? $itAssetRequest->hardware_ids : [];
        if ($legacyHardwareIds === []) {
            return [];
        }

        $legacyHardware = Hardware::withTrashed()
            ->whereIn('id', $legacyHardwareIds)
            ->get(['id', 'code', 'name'])
            ->keyBy('id');
        $singleLegacySerial = count($legacyHardwareIds) === 1 && filled($itAssetRequest->serial_number)
            ? (string) $itAssetRequest->serial_number
            : null;

        $resolved = [];
        foreach ($legacyHardwareIds as $index => $hardwareIdRaw) {
            $hardwareId = (int) $hardwareIdRaw;
            $hardware = $legacyHardware->get($hardwareId);
            if ($hardware === null) {
                continue;
            }

            $resolved[] = [
                'hardware_asset_value_id' => null,
                'hardware_id' => $hardwareId,
                'asset_model' => null,
                'serial_number' => $index === 0 ? $singleLegacySerial : null,
                'asset_value' => null,
                'asset_currency' => null,
                'hardware' => [
                    'id' => (int) $hardware->id,
                    'code' => (string) $hardware->code,
                    'name' => (string) $hardware->name,
                ],
            ];
        }

        return $resolved;
    }
}
