<?php

namespace Database\Seeders;

use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use Illuminate\Database\Seeder;

class HardwareAssetValueSeeder extends Seeder
{
    public function run(): void
    {
        $hardwareByCode = Hardware::query()->pluck('id', 'code');

        $assets = [
            [
                'hardware_code' => 'LAP',
                'asset_model' => 'Dell Latitude 5540',
                'asset_value' => 4200.00,
                'serial_number' => 'SN-LAP-00001',
                'vendor' => 'Dell Technologies',
                'specs' => 'Intel i7, 16GB RAM, 512GB SSD',
            ],
            [
                'hardware_code' => 'LAP',
                'asset_model' => 'Lenovo ThinkPad T14',
                'asset_value' => 3850.00,
                'serial_number' => 'SN-LAP-00002',
                'vendor' => 'Lenovo',
                'specs' => 'Intel i5, 16GB RAM, 512GB SSD',
            ],
            [
                'hardware_code' => 'DESK',
                'asset_model' => 'Dell OptiPlex 7020',
                'asset_value' => 3100.00,
                'serial_number' => 'SN-DESK-00001',
                'vendor' => 'Dell Technologies',
                'specs' => 'Intel i5, 8GB RAM, 256GB SSD',
            ],
            [
                'hardware_code' => 'MON',
                'asset_model' => 'Dell P2422H 24"',
                'asset_value' => 650.00,
                'serial_number' => 'SN-MON-00001',
                'vendor' => 'Dell Technologies',
                'specs' => '24" FHD IPS',
            ],
            [
                'hardware_code' => 'MON',
                'asset_model' => 'LG 27UK850-W',
                'asset_value' => 890.00,
                'serial_number' => 'SN-MON-00002',
                'vendor' => 'LG Electronics',
                'specs' => '27" 4K USB-C',
            ],
            [
                'hardware_code' => 'SSD',
                'asset_model' => 'Samsung 990 Pro 1TB',
                'asset_value' => 420.00,
                'serial_number' => 'SN-SSD-00001',
                'vendor' => 'Samsung',
                'specs' => 'NVMe M.2 1TB',
            ],
            [
                'hardware_code' => 'RAM',
                'asset_model' => 'Kingston 16GB DDR5',
                'asset_value' => 180.00,
                'serial_number' => 'SN-RAM-00001',
                'vendor' => 'Kingston',
                'specs' => '16GB DDR5-5600',
            ],
            [
                'hardware_code' => 'PRN',
                'asset_model' => 'HP LaserJet Pro M404dn',
                'asset_value' => 950.00,
                'serial_number' => 'SN-PRN-00001',
                'vendor' => 'HP',
                'specs' => 'Mono laser, network',
            ],
            [
                'hardware_code' => 'UPS',
                'asset_model' => 'APC Smart-UPS 1500VA',
                'asset_value' => 720.00,
                'serial_number' => 'SN-UPS-00001',
                'vendor' => 'APC',
                'specs' => '1500VA rack/tower',
            ],
            [
                'hardware_code' => 'RTR',
                'asset_model' => 'Cisco RV340',
                'asset_value' => 1100.00,
                'serial_number' => 'SN-RTR-00001',
                'vendor' => 'Cisco',
                'specs' => 'Dual WAN VPN router',
            ],
        ];

        $effectiveFrom = now()->subMonths(3)->format('Y-m-d');
        $purchaseDate = now()->subYear()->format('Y-m-d');

        foreach ($assets as $asset) {
            $hardwareId = $hardwareByCode[$asset['hardware_code']] ?? null;

            if ($hardwareId === null) {
                continue;
            }

            HardwareAssetValue::query()->updateOrCreate(
                ['serial_number' => $asset['serial_number']],
                [
                    'hardware_id' => $hardwareId,
                    'asset_model' => $asset['asset_model'],
                    'asset_value' => $asset['asset_value'],
                    'asset_currency' => 'AED',
                    'purchase_date' => $purchaseDate,
                    'vendor' => $asset['vendor'],
                    'specs' => $asset['specs'],
                    'effective_from' => $effectiveFrom,
                    'effective_to' => null,
                    'is_active' => true,
                ],
            );
        }
    }
}
