<?php

namespace App\Services\Reports;

use App\Enums\ItAssetCategory;
use App\Models\ItAsset;
use Illuminate\Database\Eloquent\Builder;

final class ItAssetInventoryReportService
{
    /**
     * @return array{
     *     rows: list<array<string, mixed>>,
     *     total_assets: int,
     *     total_value: float,
     * }
     */
    public function build(
        ?string $from,
        ?string $to,
        ?ItAssetCategory $category,
        ?int $hardwareId,
        ?int $employeeId,
    ): array {
        $assets = $this->baseQuery($from, $to, $category, $hardwareId, $employeeId)
            ->orderBy('code')
            ->get();

        $rows = [];
        $totalValue = 0.0;

        foreach ($assets as $asset) {
            $value = $asset->asset_value !== null ? (float) $asset->asset_value : null;

            if ($value !== null) {
                $totalValue += $value;
            }

            $employee = $asset->currentEmployee;

            $rows[] = [
                'code' => $asset->code,
                'category' => $asset->category->label(),
                'category_value' => $asset->category->value,
                'label' => $asset->name,
                'device_type' => $this->deviceTypeLabel($asset),
                'identifier' => $asset->identifier() ?? '—',
                'status' => $asset->status->label(),
                'employee_name' => $employee !== null
                    ? trim($employee->first_name.' '.$employee->last_name)
                    : '—',
                'employee_code' => $employee?->employee_code,
                'purchase_date' => $asset->purchase_date?->toDateString(),
                'asset_value' => $value,
                'asset_currency' => $asset->asset_currency,
                'registered_at' => $asset->created_at?->toDateString(),
            ];
        }

        return [
            'rows' => $rows,
            'total_assets' => count($rows),
            'total_value' => $totalValue,
        ];
    }

    private function baseQuery(
        ?string $from,
        ?string $to,
        ?ItAssetCategory $category,
        ?int $hardwareId,
        ?int $employeeId,
    ): Builder {
        return ItAsset::query()
            ->with([
                'hardware:id,code,name',
                'software:id,code,name',
                'accessory:id,code,name',
                'currentEmployee:id,first_name,last_name,employee_code',
            ])
            ->when(
                $from !== null && $to !== null,
                function (Builder $query) use ($from, $to): void {
                    $query->where(function (Builder $dateQuery) use ($from, $to): void {
                        $dateQuery
                            ->whereBetween('purchase_date', [$from, $to])
                            ->orWhere(function (Builder $fallbackQuery) use ($from, $to): void {
                                $fallbackQuery
                                    ->whereNull('purchase_date')
                                    ->whereDate('created_at', '>=', $from)
                                    ->whereDate('created_at', '<=', $to);
                            });
                    });
                }
            )
            ->when(
                $category !== null,
                fn (Builder $query) => $query->where('category', $category)
            )
            ->when(
                $hardwareId !== null,
                fn (Builder $query) => $query->where('hardware_id', $hardwareId)
            )
            ->when(
                $employeeId !== null,
                fn (Builder $query) => $query->where('current_employee_id', $employeeId)
            );
    }

    private function deviceTypeLabel(ItAsset $asset): string
    {
        return match ($asset->category) {
            ItAssetCategory::Hardware => (string) ($asset->hardware?->name ?? '—'),
            ItAssetCategory::Software => (string) ($asset->software?->name ?? '—'),
            ItAssetCategory::Accessory => (string) ($asset->accessory?->name ?? '—'),
        };
    }
}
