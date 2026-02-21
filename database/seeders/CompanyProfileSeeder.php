<?php

namespace Database\Seeders;

use App\Models\CompanyProfile;
use App\Models\Country;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class CompanyProfileSeeder extends Seeder
{
    /**
     * Minimal 1x1 PNG (transparent pixel). Used to seed logo files.
     */
    private const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $countries = Country::query()->orderBy('name')->limit(2)->pluck('id')->all();
        $countryId1 = $countries[0] ?? null;
        $countryId2 = $countries[1] ?? $countryId1;

        $profiles = [
            [
                'company_name' => 'Prime Logistics',
                'company_address_1' => 'Warehouse G09, Dubai Aiport Freezone, Dubai, UAE',
                'company_address_2' => 'S',
                'country_id' => $countryId1,
                'website' => 'https://primelogistics.ae',
            ],
            [
                'company_name' => 'Prime Logistics KSA',
                'company_address_1' => 'Riyad Riyadh Freezone, Riyadh, Saudi Arabia',
                'company_address_2' => 'Building B',
                'country_id' => $countryId2,
                'website' => 'https://primelogistics.ae',
            ],
        ];

        $logoContent = base64_decode(self::TINY_PNG_BASE64, true);
        if ($logoContent === false) {
            throw new \RuntimeException('Invalid base64 logo content.');
        }

        foreach ($profiles as $data) {
            $profile = CompanyProfile::query()->updateOrCreate(
                ['company_name' => $data['company_name']],
                $data
            );

            $path = sprintf(
                'company-profiles/%d/logo.png',
                $profile->id
            );
            Storage::disk('public')->put($path, $logoContent);
            $profile->update(['logo' => $path]);
        }
    }
}
