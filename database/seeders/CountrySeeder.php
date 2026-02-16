<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sourceUrl = 'https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json';

        $json = @file_get_contents($sourceUrl);

        if (! is_string($json) || $json === '') {
            throw new \RuntimeException('Unable to download country list for seeding.');
        }

        /** @var array<int, array<string, mixed>> $rows */
        $rows = json_decode($json, true, flags: JSON_THROW_ON_ERROR);

        foreach ($rows as $row) {
            $code = strtoupper((string) ($row['alpha-2'] ?? ''));
            $name = (string) ($row['name'] ?? '');

            if ($code === '' || $name === '' || strlen($code) !== 2) {
                continue;
            }

            Country::query()->updateOrCreate(
                ['code' => $code],
                ['code' => $code, 'name' => $name]
            );
        }
    }
}
