<?php

namespace Database\Seeders;

use App\Models\Software;
use Illuminate\Database\Seeder;

class SoftwareSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $software = [
            [
                'code' => 'RITZY',
                'name' => 'Ritzy',
                'description' => 'Ritzy system/application',
            ],
            [
                'code' => 'FLAIR',
                'name' => 'Flair',
                'description' => 'Flair system/application',
            ],
            [
                'code' => 'WMS',
                'name' => 'WMS',
                'description' => 'Warehouse Management System (WMS)',
            ],
        ];

        foreach ($software as $item) {
            Software::query()->updateOrCreate(
                ['code' => $item['code']],
                $item
            );
        }
    }
}
