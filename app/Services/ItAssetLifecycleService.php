<?php

namespace App\Services;

use App\Enums\ItAssetCategory;
use App\Enums\ItAssetEventType;
use App\Enums\ItAssetStatus;
use App\Models\Employee;
use App\Models\ItAsset;
use App\Models\ItAssetAssignment;
use App\Models\ItAssetEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ItAssetLifecycleService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createAsset(ItAssetCategory $category, array $data, ?User $actor = null): ItAsset
    {
        $asset = ItAsset::query()->create([
            ...$data,
            'category' => $category,
            'status' => ItAssetStatus::Available,
        ]);

        $this->recordEvent($asset, ItAssetEventType::Created, $actor, [
            'category' => $category->value,
            'name' => $asset->name,
        ]);

        return $asset;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateAsset(ItAsset $asset, array $data, ?User $actor = null): ItAsset
    {
        if ($asset->status === ItAssetStatus::Assigned) {
            $allowed = ['condition_notes', 'remarks'];
            $data = array_intersect_key($data, array_flip($allowed));
        }

        $asset->update($data);

        $this->recordEvent($asset, ItAssetEventType::Updated, $actor, [
            'changes' => array_keys($data),
        ]);

        return $asset->refresh();
    }

    public function assign(ItAsset $asset, Employee $employee, User $actor, ?string $notes = null): ItAssetAssignment
    {
        if ($asset->status !== ItAssetStatus::Available) {
            throw ValidationException::withMessages([
                'employee_id' => 'Only available assets can be assigned.',
            ]);
        }

        return DB::transaction(function () use ($asset, $employee, $actor, $notes): ItAssetAssignment {
            $assignment = ItAssetAssignment::query()->create([
                'it_asset_id' => $asset->id,
                'employee_id' => $employee->id,
                'assigned_at' => now(),
                'assigned_by_user_id' => $actor->id,
                'assignment_notes' => $notes,
            ]);

            $asset->update([
                'status' => ItAssetStatus::Assigned,
                'current_employee_id' => $employee->id,
            ]);

            $this->recordEvent($asset, ItAssetEventType::Assigned, $actor, [
                'employee_id' => $employee->id,
                'employee_name' => trim($employee->first_name.' '.$employee->last_name),
            ], $assignment);

            return $assignment;
        });
    }

    public function returnAsset(ItAsset $asset, User $actor, ?string $condition = null, ?string $notes = null): void
    {
        if ($asset->status !== ItAssetStatus::Assigned) {
            throw ValidationException::withMessages([
                'return' => 'Only assigned assets can be returned.',
            ]);
        }

        $assignment = $asset->activeAssignment;

        if ($assignment === null) {
            throw ValidationException::withMessages([
                'return' => 'No active assignment found for this asset.',
            ]);
        }

        DB::transaction(function () use ($asset, $assignment, $actor, $condition, $notes): void {
            $assignment->update([
                'returned_at' => now(),
                'returned_by_user_id' => $actor->id,
                'condition_on_return' => $condition,
                'return_notes' => $notes,
            ]);

            $asset->update([
                'status' => ItAssetStatus::Available,
                'current_employee_id' => null,
            ]);

            $this->recordEvent($asset, ItAssetEventType::Returned, $actor, [
                'employee_id' => $assignment->employee_id,
                'condition_on_return' => $condition,
            ], $assignment);
        });
    }

    public function changeStatus(ItAsset $asset, ItAssetStatus $status, User $actor, ?string $notes = null): void
    {
        if ($asset->status === ItAssetStatus::Assigned && $status !== ItAssetStatus::Lost) {
            throw ValidationException::withMessages([
                'status' => 'Return the asset before changing its status.',
            ]);
        }

        $previous = $asset->status;
        $asset->update(['status' => $status]);

        $this->recordEvent($asset, ItAssetEventType::StatusChanged, $actor, [
            'from' => $previous->value,
            'to' => $status->value,
            'notes' => $notes,
        ]);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function recordEvent(
        ItAsset $asset,
        ItAssetEventType $type,
        ?User $actor,
        array $metadata = [],
        ?ItAssetAssignment $assignment = null,
    ): ItAssetEvent {
        return ItAssetEvent::query()->create([
            'it_asset_id' => $asset->id,
            'it_asset_assignment_id' => $assignment?->id,
            'event_type' => $type,
            'actor_user_id' => $actor?->id,
            'actor_name' => $actor?->name ?? $actor?->email ?? 'System',
            'metadata' => $metadata === [] ? null : $metadata,
            'created_at' => now(),
        ]);
    }
}
