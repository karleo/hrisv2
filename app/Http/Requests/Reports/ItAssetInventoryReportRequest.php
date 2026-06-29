<?php

namespace App\Http\Requests\Reports;

use App\Enums\ItAssetCategory;
use App\Models\Employee;
use App\Models\Hardware;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class ItAssetInventoryReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'category' => ['nullable', Rule::enum(ItAssetCategory::class)],
            'hardware_id' => ['nullable', 'integer', Rule::exists(Hardware::class, 'id')],
            'employee_id' => ['nullable', 'integer', Rule::exists(Employee::class, 'id')],
            'export' => ['nullable', 'in:csv,pdf'],
        ];
    }

    /**
     * @return array{from: string|null, to: string|null}
     */
    public function dateRange(): array
    {
        $from = $this->input('from');
        $to = $this->input('to');

        if ($from === null && $to === null) {
            return ['from' => null, 'to' => null];
        }

        $resolvedTo = $to ?? now()->toDateString();
        $resolvedFrom = $from ?? Carbon::parse($resolvedTo)->subDays(30)->toDateString();

        return [
            'from' => $resolvedFrom,
            'to' => $resolvedTo,
        ];
    }

    public function categoryFilter(): ?ItAssetCategory
    {
        $value = $this->input('category');

        if ($value === null || $value === '') {
            return null;
        }

        return ItAssetCategory::from((string) $value);
    }

    public function wantsCsvExport(): bool
    {
        return $this->input('export') === 'csv';
    }

    public function wantsPdfExport(): bool
    {
        return $this->input('export') === 'pdf';
    }
}
