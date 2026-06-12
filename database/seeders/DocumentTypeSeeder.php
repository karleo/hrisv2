<?php

namespace Database\Seeders;

use App\Models\DocumentType;
use Illuminate\Database\Seeder;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'code' => 'PASSPORT',
                'name' => 'Passport',
                'description' => 'National passport',
                'requires_expiry_date' => true,
            ],
            [
                'code' => 'VISA',
                'name' => 'Residence Visa',
                'description' => 'UAE residence / employment visa',
                'requires_expiry_date' => true,
            ],
            [
                'code' => 'EID',
                'name' => 'Emirates ID',
                'description' => 'UAE Emirates ID card',
                'requires_expiry_date' => true,
            ],
            [
                'code' => 'LABOUR',
                'name' => 'Labour Card',
                'description' => 'MOHRE labour card',
                'requires_expiry_date' => true,
            ],
            [
                'code' => 'CONTRACT',
                'name' => 'Employment Contract',
                'description' => 'Signed employment contract',
                'requires_expiry_date' => false,
            ],
            [
                'code' => 'LICENSE',
                'name' => 'Driving License',
                'description' => 'Valid driving license',
                'requires_expiry_date' => true,
            ],
            [
                'code' => 'CERT',
                'name' => 'Certificate',
                'description' => 'Training or professional certificate',
                'requires_expiry_date' => false,
            ],
            [
                'code' => 'OTHER',
                'name' => 'Other Document',
                'description' => 'Miscellaneous employee document',
                'requires_expiry_date' => false,
            ],
        ];

        foreach ($types as $type) {
            DocumentType::query()->updateOrCreate(
                ['code' => $type['code']],
                [
                    ...$type,
                    'is_active' => true,
                ],
            );
        }
    }
}
