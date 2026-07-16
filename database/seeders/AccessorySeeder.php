<?php

namespace Database\Seeders;

use App\Models\Accessory;
use Illuminate\Database\Seeder;

class AccessorySeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['code' => 'MOU', 'name' => 'Mouse', 'description' => 'Standard wired or wireless mouse'],
            ['code' => 'KEY', 'name' => 'Keyboard', 'description' => 'Standard keyboard'],
            ['code' => 'HST', 'name' => 'Headset', 'description' => 'USB or wireless headset'],
            ['code' => 'DOCK', 'name' => 'Docking Station', 'description' => 'Laptop docking station'],
            ['code' => 'BAG', 'name' => 'Laptop Bag', 'description' => 'Carry bag for laptop'],
        ];

        foreach ($items as $item) {
            Accessory::query()->updateOrCreate(
                ['code' => $item['code']],
                [
                    'name' => $item['name'],
                    'description' => $item['description'],
                ],
            );
        }
    }
}
