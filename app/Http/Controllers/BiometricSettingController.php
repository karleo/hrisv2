<?php

namespace App\Http\Controllers;

use App\Http\Requests\BiometricSetting\UpdateBiometricSettingRequest;
use App\Models\BiometricSetting;
use App\Services\BiometricAttendanceSyncService;
use App\Services\ZktecoIclock990Client;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class BiometricSettingController extends Controller
{
    public function index(): Response
    {
        $setting = BiometricSetting::current();

        return Inertia::render('biometric-settings/index', [
            'setting' => [
                'is_enabled' => $setting->is_enabled,
                'device_ip' => $setting->device_ip,
                'device_port' => $setting->device_port,
                'comm_key' => $setting->comm_key,
                'timeout_seconds' => $setting->timeout_seconds,
                'poll_interval_minutes' => $setting->poll_interval_minutes,
                'timezone' => $setting->timezone,
                'duplicate_window_seconds' => $setting->duplicate_window_seconds,
                'max_pairing_hours' => $setting->max_pairing_hours,
                'treat_single_punch_as_open_entry' => $setting->treat_single_punch_as_open_entry,
                'employee_identifier_field' => $setting->employee_identifier_field,
                'location_name' => $setting->location_name,
                'last_polled_at' => $setting->last_polled_at?->toIso8601String(),
                'last_log_cursor' => $setting->last_log_cursor,
            ],
            'pushEndpoint' => url('/iclock/cdata'),
            'handshakeEndpoint' => url('/iclock/getrequest'),
        ]);
    }

    public function update(UpdateBiometricSettingRequest $request): RedirectResponse
    {
        $setting = BiometricSetting::current();
        $setting->update($request->validated());

        return to_route('biometric-settings.index')->with('success', 'Biometric settings updated.');
    }

    public function testConnection(ZktecoIclock990Client $client): RedirectResponse
    {
        $setting = BiometricSetting::current();

        try {
            $rows = $client->fetchPunches($setting);
        } catch (Throwable $e) {
            return back()->withErrors([
                'biometric_connection' => $e->getMessage(),
            ]);
        }

        return back()->with('success', sprintf('Connection succeeded. %d punch row(s) fetched.', count($rows)));
    }

    public function syncNow(BiometricAttendanceSyncService $syncService): RedirectResponse
    {
        try {
            $result = $syncService->sync();
        } catch (Throwable $e) {
            return back()->withErrors([
                'biometric_sync' => $e->getMessage(),
            ]);
        }

        return back()->with(
            'success',
            sprintf(
                'Biometric sync done. fetched=%d processed=%d skipped=%d.',
                $result['fetched'],
                $result['processed'],
                $result['skipped']
            )
        );
    }
}
