<?php

namespace Database\Seeders;

use App\Enums\BiometricConnectionType;
use App\Models\BiometricDevice;
use App\Support\BiometricTimezoneOptions;
use Illuminate\Database\Seeder;

class BiometricDeviceSeeder extends Seeder
{
    public function run(): void
    {
        BiometricDevice::query()->updateOrCreate(
            ['serial_number' => 'OAE7050057042700029'],
            [
                'name' => 'Main entrance iClock990',
                'model' => 'iClock990',
                'connection_type' => BiometricConnectionType::DeviceWebReport,
                'host' => '192.168.1.44',
                'port' => 80,
                'timezone' => BiometricTimezoneOptions::Default,
                'is_active' => true,
                'metadata' => [
                    'protocol' => 'tcp',
                    'web_username' => config('biometric.device_web.default_username', 'administrator'),
                    'web_password' => config('biometric.device_web.default_password', ''),
                ],
            ],
        );
    }
}
