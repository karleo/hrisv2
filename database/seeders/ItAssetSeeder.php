<?php

namespace Database\Seeders;

use App\Enums\ItAssetCategory;
use App\Enums\ItAssetStatus;
use App\Models\Accessory;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\ItAsset;
use App\Models\Software;
use App\Models\User;
use App\Services\ItAssetLifecycleService;
use Illuminate\Database\Seeder;

class ItAssetSeeder extends Seeder
{
    public function run(): void
    {
        $lifecycle = app(ItAssetLifecycleService::class);
        $employee = Employee::query()->first();
        $user = User::query()->first();
        $hardware = Hardware::query()->first();
        $software = Software::query()->first();
        $mouse = Accessory::query()->where('code', 'MOU')->first();

        if ($hardware !== null) {
            $laptop = $lifecycle->createAsset(ItAssetCategory::Hardware, [
                'name' => 'Demo Laptop',
                'hardware_id' => $hardware->id,
                'serial_number' => 'DEMO-LAP-001',
            ]);

            if ($employee !== null && $user !== null) {
                $lifecycle->assign($laptop, $employee, $user, 'Demo assignment');
            }
        }

        if ($software !== null) {
            $lifecycle->createAsset(ItAssetCategory::Software, [
                'name' => 'Demo Office License',
                'software_id' => $software->id,
                'license_key' => 'DEMO-OFFICE-KEY',
                'license_seats' => 1,
            ]);
        }

        if ($mouse !== null) {
            ItAsset::query()->firstOrCreate(
                ['serial_number' => 'DEMO-MOU-001'],
                [
                    'category' => ItAssetCategory::Accessory,
                    'name' => 'Demo Mouse',
                    'status' => ItAssetStatus::Available,
                    'accessory_id' => $mouse->id,
                ],
            );
        }
    }
}
