<?php

namespace App\Services\Biometric;

use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use App\Models\Employee;
use Illuminate\Support\Collection;

final class BiometricEmployeeMapper
{
    /**
     * @return array{mapped: int, unmapped: int}
     */
    public function mapForAllDevices(): array
    {
        $totals = ['mapped' => 0, 'unmapped' => 0];

        BiometricDevice::query()
            ->orderBy('id')
            ->pluck('id')
            ->each(function (int $deviceId) use (&$totals): void {
                $device = BiometricDevice::query()->find($deviceId);

                if ($device === null) {
                    return;
                }

                $result = $this->mapForDevice($device);
                $totals['mapped'] += $result['mapped'];
                $totals['unmapped'] += $result['unmapped'];
            });

        return $totals;
    }

    /**
     * @return array{mapped: int, unmapped: int}
     */
    public function mapForDevice(BiometricDevice $device): array
    {
        $employeeMap = $this->employeeIdByDevicePin();

        $mapped = 0;
        $unmapped = 0;

        BiometricPunch::query()
            ->where('biometric_device_id', $device->id)
            ->whereNull('employee_id')
            ->orderBy('id')
            ->chunkById(500, function (Collection $punches) use ($employeeMap, &$mapped, &$unmapped): void {
                foreach ($punches as $punch) {
                    /** @var BiometricPunch $punch */
                    $employeeId = $this->resolveEmployeeId($employeeMap, $punch->device_user_id);

                    if ($employeeId === null) {
                        $unmapped++;

                        continue;
                    }

                    $punch->employee_id = $employeeId;
                    $punch->save();
                    $mapped++;
                }
            });

        return ['mapped' => $mapped, 'unmapped' => $unmapped];
    }

    /**
     * @return Collection<string, int>
     */
    private function employeeIdByDevicePin(): Collection
    {
        $map = collect();

        Employee::query()
            ->whereNotNull('biometric_user_id')
            ->each(function (Employee $employee) use ($map): void {
                $pin = trim((string) $employee->biometric_user_id);

                if ($pin === '') {
                    return;
                }

                $map->put($pin, $employee->id);

                if (ctype_digit($pin)) {
                    $normalized = ltrim($pin, '0') ?: '0';
                    $map->put($normalized, $employee->id);
                }
            });

        return $map;
    }

    /**
     * @param  Collection<string, int>  $employeeMap
     */
    private function resolveEmployeeId(Collection $employeeMap, string $deviceUserId): ?int
    {
        $pin = trim($deviceUserId);

        if ($pin === '') {
            return null;
        }

        $employeeId = $employeeMap->get($pin);

        if ($employeeId !== null) {
            return $employeeId;
        }

        if (ctype_digit($pin)) {
            $normalized = ltrim($pin, '0') ?: '0';

            return $employeeMap->get($normalized);
        }

        return null;
    }
}
