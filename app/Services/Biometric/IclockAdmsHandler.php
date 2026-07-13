<?php

namespace App\Services\Biometric;

use App\Enums\BiometricSyncStatus;
use App\Models\BiometricDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

final class IclockAdmsHandler
{
    public function __construct(
        private readonly IclockAdmsAttendanceParser $parser,
        private readonly BiometricPunchImporter $importer,
        private readonly BiometricEmployeeMapper $employeeMapper,
        private readonly BiometricSessionPairingService $sessionPairing,
        private readonly BiometricAdmsCommandQueue $commandQueue,
    ) {}

    public function handleGet(Request $request): string
    {
        $serial = $this->serialFromRequest($request);
        $device = $this->findDeviceBySerial($serial);

        if ($device !== null) {
            $device->update([
                'metadata' => array_merge($device->metadata ?? [], [
                    'last_adms_handshake_at' => now()->toIso8601String(),
                ]),
            ]);
            $device->refresh();
        }

        // Echo last stamp from the device (default 0). Never use wall-clock now — that
        // tells many ZK firmwares "already synced" and blocks historical ATTLOG dumps.
        $attStamp = $this->stampFromDevice($device, 'last_attlog_stamp');
        $operStamp = $this->stampFromDevice($device, 'last_operlog_stamp', $attStamp);

        return implode("\n", [
            'GET OPTION FROM: '.($serial !== '' ? $serial : 'unknown'),
            'ATTLOGStamp='.$attStamp,
            'OPERLOGStamp='.$operStamp,
            'ErrorDelay=60',
            'Delay=30',
            'TransTimes=00:00;23:59',
            'TransInterval=1',
            'TransFlag=TransData AttLog',
            'Realtime=1',
            'Encrypt=0',
        ]);
    }

    public function handlePost(Request $request): string
    {
        $serial = $this->serialFromRequest($request);
        $table = (string) $request->query('table', '');

        if ($serial === '') {
            Log::warning('iclock ADMS POST without serial', ['query' => $request->query()]);

            return 'OK';
        }

        $device = $this->findDeviceBySerial($serial);

        if ($device === null) {
            Log::warning('iclock ADMS POST for unknown serial', ['serial' => $serial]);

            return 'OK';
        }

        if ($table !== '' && strtoupper($table) !== 'ATTLOG') {
            $this->touchDevice($device, $request);

            return 'OK';
        }

        $body = $request->getContent();

        if ($body === '') {
            $this->touchDevice($device, $request);

            return 'OK';
        }

        $punches = $this->parser->parseBody($device, $body);
        $import = $this->importer->import($device, $punches);
        $this->employeeMapper->mapForDevice($device);
        $sessions = $this->sessionPairing->processUnprocessedPunches($device);

        $metadata = array_merge($device->metadata ?? [], [
            'last_adms_push_at' => now()->toIso8601String(),
            'last_adms_inserted' => $import['inserted'],
            'last_adms_punch_count' => count($punches),
        ]);

        $stamp = $this->stampFromRequest($request);

        if ($stamp !== null) {
            $metadata['last_attlog_stamp'] = $stamp;
        }

        $device->update([
            'last_sync_at' => now(),
            'last_sync_status' => BiometricSyncStatus::Completed->value,
            'last_error' => null,
            'metadata' => $metadata,
        ]);

        Log::info('iclock ADMS attendance received', [
            'serial' => $serial,
            'device_id' => $device->id,
            'lines' => count($punches),
            'inserted' => $import['inserted'],
            'sessions_created' => $sessions['created'],
        ]);

        return 'OK';
    }

    public function handleGetRequest(Request $request): string
    {
        $serial = $this->serialFromRequest($request);
        $device = $this->findDeviceBySerial($serial);

        if ($device === null) {
            return 'OK';
        }

        $this->touchDevice($device, $request);

        $commands = $this->commandQueue->drain($device);

        if ($commands === []) {
            return 'OK';
        }

        $lines = [];
        $id = (int) now()->timestamp;

        foreach ($commands as $command) {
            $lines[] = 'C:'.$id.':'.$command;
            $id++;
        }

        Log::info('iclock ADMS commands sent', [
            'serial' => $serial,
            'device_id' => $device->id,
            'commands' => $commands,
        ]);

        return implode("\n", $lines)."\n";
    }

    public function handleDeviceCmd(Request $request): string
    {
        return 'OK';
    }

    private function touchDevice(BiometricDevice $device, ?Request $request = null): void
    {
        $metadata = array_merge($device->metadata ?? [], [
            'last_adms_push_at' => now()->toIso8601String(),
        ]);

        if ($request !== null) {
            $stamp = $this->stampFromRequest($request);

            if ($stamp !== null) {
                $metadata['last_attlog_stamp'] = $stamp;
            }
        }

        $device->update([
            'metadata' => $metadata,
        ]);
    }

    private function stampFromRequest(Request $request): ?string
    {
        $stamp = $request->query('Stamp') ?? $request->query('stamp');

        if (! is_string($stamp) && ! is_numeric($stamp)) {
            return null;
        }

        $normalized = trim((string) $stamp);

        return $normalized !== '' ? $normalized : null;
    }

    private function stampFromDevice(?BiometricDevice $device, string $key, string $default = '0'): string
    {
        if ($device === null) {
            return $default;
        }

        $raw = $device->metadata[$key] ?? null;

        if (is_string($raw) || is_numeric($raw)) {
            $normalized = trim((string) $raw);

            if ($normalized !== '') {
                return $normalized;
            }
        }

        return $default;
    }

    private function serialFromRequest(Request $request): string
    {
        return trim((string) ($request->query('SN') ?? $request->query('sn') ?? ''));
    }

    private function findDeviceBySerial(string $serial): ?BiometricDevice
    {
        if ($serial === '') {
            return null;
        }

        return BiometricDevice::query()
            ->where('serial_number', $serial)
            ->where('is_active', true)
            ->first();
    }
}
