<?php

namespace Database\Seeders;

use App\Models\Hardware;
use Illuminate\Database\Seeder;

class HardwareSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $hardware = [
            ['code' => 'CPU', 'name' => 'Processor (CPU)', 'description' => 'Central Processing Unit'],
            ['code' => 'MB', 'name' => 'Motherboard', 'description' => 'Main circuit board of the computer'],
            ['code' => 'RAM', 'name' => 'Memory (RAM)', 'description' => 'Random Access Memory'],
            ['code' => 'SSD', 'name' => 'Solid State Drive (SSD)', 'description' => 'Primary storage (SSD)'],
            ['code' => 'HDD', 'name' => 'Hard Disk Drive (HDD)', 'description' => 'Primary storage (HDD)'],
            ['code' => 'GPU', 'name' => 'Graphics Card (GPU)', 'description' => 'Graphics Processing Unit'],
            ['code' => 'PSU', 'name' => 'Power Supply Unit (PSU)', 'description' => 'Power supply for the system'],
            ['code' => 'CASE', 'name' => 'Computer Case', 'description' => 'System unit enclosure/chassis'],
            ['code' => 'COOL', 'name' => 'Cooling System', 'description' => 'CPU cooler / case fans'],
            ['code' => 'NIC', 'name' => 'Network Card (NIC)', 'description' => 'Network interface controller'],
            ['code' => 'MON', 'name' => 'Monitor', 'description' => 'Display device'],
            ['code' => 'KB', 'name' => 'Keyboard', 'description' => 'Input device'],
            ['code' => 'MOUSE', 'name' => 'Mouse', 'description' => 'Pointing device'],
            ['code' => 'PRN', 'name' => 'Printer', 'description' => 'Output device for printing'],
            ['code' => 'SCN', 'name' => 'Scanner', 'description' => 'Input device for scanning documents'],
            ['code' => 'UPS', 'name' => 'UPS', 'description' => 'Uninterruptible Power Supply'],
            ['code' => 'RTR', 'name' => 'Router', 'description' => 'Network routing device'],
            ['code' => 'SWT', 'name' => 'Network Switch', 'description' => 'Network switching device'],
            ['code' => 'LAP', 'name' => 'Laptop', 'description' => 'Portable computer'],
            ['code' => 'DESK', 'name' => 'Desktop', 'description' => 'Desktop computer'],
        ];

        foreach ($hardware as $item) {
            Hardware::query()->updateOrCreate(
                ['code' => $item['code']],
                $item
            );
        }
    }
}
