<?php

namespace Database\Seeders;

use App\Models\AppVersion;
use Illuminate\Database\Seeder;

class AppVersionSeeder extends Seeder
{
    public function run(): void
    {
        AppVersion::query()->updateOrCreate(
            ['version' => '1.12'],
            [
                'description' => 'Initial tracked release version.',
                'released_at' => now(),
            ],
        );
    }
}
