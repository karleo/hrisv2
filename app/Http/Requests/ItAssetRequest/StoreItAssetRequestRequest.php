<?php

namespace App\Http\Requests\ItAssetRequest;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreItAssetRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:'.Employee::class.',id'],
            'department_id' => ['required', 'integer', 'exists:'.Department::class.',id'],
            'date' => ['required', 'date'],
            'date_issued' => ['nullable', 'date'],
            'hardware_ids' => ['nullable', 'array'],
            'hardware_ids.*' => ['integer', 'exists:'.Hardware::class.',id'],
            'hardware_items' => ['nullable', 'array'],
            'hardware_items.*.hardware_asset_value_id' => ['nullable', 'integer', 'distinct', 'exists:'.HardwareAssetValue::class.',id'],
            'hardware_items.*.hardware_id' => ['required_with:hardware_items', 'integer', 'exists:'.Hardware::class.',id'],
            'hardware_items.*.serial_number' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'employee_signature_data_url' => ['nullable', 'string'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $items = $this->input('hardware_items', []);
                if (! is_array($items) || $items === []) {
                    return;
                }

                $assetValueIds = collect($items)
                    ->filter(fn ($item): bool => is_array($item) && filled($item['hardware_asset_value_id'] ?? null))
                    ->map(fn (array $item): int => (int) $item['hardware_asset_value_id'])
                    ->values();

                if ($assetValueIds->isEmpty()) {
                    return;
                }

                $today = now()->toDateString();
                $activeAssetValues = HardwareAssetValue::query()
                    ->whereIn('id', $assetValueIds->all())
                    ->where('is_active', true)
                    ->where(function ($query) use ($today): void {
                        $query->whereNull('effective_from')
                            ->orWhereDate('effective_from', '<=', $today);
                    })
                    ->where(function ($query) use ($today): void {
                        $query->whereNull('effective_to')
                            ->orWhereDate('effective_to', '>=', $today);
                    })
                    ->get(['id', 'hardware_id'])
                    ->keyBy('id');

                foreach ($items as $index => $item) {
                    if (! is_array($item) || blank($item['hardware_asset_value_id'] ?? null)) {
                        continue;
                    }

                    $assetValue = $activeAssetValues->get((int) $item['hardware_asset_value_id']);
                    if ($assetValue === null) {
                        $validator->errors()->add("hardware_items.$index.hardware_asset_value_id", 'The selected asset is not active.');

                        continue;
                    }

                    if ((int) ($item['hardware_id'] ?? 0) !== (int) $assetValue->hardware_id) {
                        $validator->errors()->add("hardware_items.$index.hardware_id", 'The selected hardware does not match the selected asset.');
                    }
                }
            },
        ];
    }
}
