<?php

namespace App\Http\Controllers\Biometric;

use App\Enums\BiometricConnectionType;
use App\Enums\BiometricSyncStatus;
use App\Enums\BiometricSyncType;
use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Biometric\StoreBiometricDeviceRequest;
use App\Http\Requests\Biometric\SyncBiometricDeviceRequest;
use App\Http\Requests\Biometric\UpdateBiometricDeviceRequest;
use App\Models\BiometricAttendanceSession;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use App\Models\BiometricSyncLog;
use App\Models\Employee;
use App\Services\Biometric\BiometricBackgroundSyncStarter;
use App\Services\Biometric\BiometricDeviceProbeService;
use App\Services\Biometric\BiometricEmployeeMapper;
use App\Services\Biometric\BiometricPipelineTracer;
use App\Services\Biometric\BiometricStaleSyncLogCleaner;
use App\Services\Biometric\BiometricSyncPipeline;
use App\Services\Biometric\ZkDeviceWebReportClient;
use App\Support\BiometricPushUrl;
use App\Support\BiometricTimezoneOptions;
use App\Support\CompanyAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BiometricAttendanceController extends Controller
{
    public function __construct(
        private readonly BiometricStaleSyncLogCleaner $staleSyncLogCleaner,
        private readonly CompanyAccessScope $companyScope,
    ) {}

    public function dashboard(Request $request): Response
    {
        $this->staleSyncLogCleaner->markTimedOutRunningLogs();
        $devices = BiometricDevice::query()->orderBy('name')->get()->map(fn (BiometricDevice $device) => [
            'id' => $device->id,
            'name' => $device->name,
            'model' => $device->model,
            'serial_number' => $device->serial_number,
            'connection_type' => $device->connection_type->value,
            'host' => $device->host,
            'port' => $device->port,
            'timezone' => $device->timezone,
            'is_active' => $device->is_active,
            'last_sync_at' => $device->last_sync_at?->toIso8601String(),
            'last_sync_status' => $device->last_sync_status,
            'last_error' => $device->last_error,
            'protocol' => $device->zkProtocol(),
            'timezone_label' => BiometricTimezoneOptions::label($device->timezone),
            'web_username' => is_string($device->metadata['web_username'] ?? null)
                ? $device->metadata['web_username']
                : null,
            'has_web_password' => is_string($device->metadata['web_password'] ?? null)
                && $device->metadata['web_password'] !== '',
            'has_web_session_id' => is_string($device->metadata['web_session_id'] ?? null)
                && $device->metadata['web_session_id'] !== '',
        ]);

        $recentSyncLogs = BiometricSyncLog::query()
            ->with('device:id,name')
            ->orderByDesc('started_at')
            ->limit(10)
            ->get()
            ->map(fn (BiometricSyncLog $log) => $this->formatSyncLog($log));

        $unmappedPunchesCount = BiometricPunch::query()
            ->whereNull('employee_id')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $user = $request->user();

        return Inertia::render('biometric-attendance/dashboard', [
            'devices' => $devices,
            'recentSyncLogs' => $recentSyncLogs,
            'unmappedPunchesCount' => $unmappedPunchesCount,
            'timezones' => BiometricTimezoneOptions::common(),
            'canManageDevices' => $user?->hasModuleAbility(PermissionModule::BiometricAttendance, ModuleAbility::Update) ?? false,
            'iclockPushUrl' => BiometricPushUrl::cdataEndpoint(),
            'pushUsesLocalhost' => BiometricPushUrl::usesLocalhost(),
        ]);
    }

    public function connectivity(Request $request): Response
    {
        $this->staleSyncLogCleaner->markTimedOutRunningLogs();

        $user = $request->user();

        $devices = $this->devicesForConnectivity();

        return Inertia::render('biometric-attendance/connectivity', [
            'devices' => $devices,
            'canImport' => $user?->hasModuleAbility(PermissionModule::BiometricAttendance, ModuleAbility::Update) ?? false,
            'canManageDevices' => $user?->hasModuleAbility(PermissionModule::BiometricAttendance, ModuleAbility::Update) ?? false,
            'defaultImportRange' => $this->defaultImportDateRange(),
            'iclockPushUrl' => BiometricPushUrl::cdataEndpoint(),
            'pushUsesLocalhost' => BiometricPushUrl::usesLocalhost(),
            'hasAdmsDevices' => collect($devices)->contains(
                fn (array $device): bool => $device['connection_type'] === BiometricConnectionType::AdmsPush->value,
            ),
            'hasWebReportDevices' => collect($devices)->contains(
                fn (array $device): bool => $device['connection_type'] === BiometricConnectionType::DeviceWebReport->value,
            ),
        ]);
    }

    public function import(Request $request): Response
    {
        $this->staleSyncLogCleaner->markTimedOutRunningLogs();

        $user = $request->user();

        return Inertia::render('biometric-attendance/import', [
            'activeDevices' => $this->activeDevicesForSync(),
            'canImport' => $user?->hasModuleAbility(PermissionModule::BiometricAttendance, ModuleAbility::Update) ?? false,
            'iclockPushUrl' => BiometricPushUrl::cdataEndpoint(),
            'runningSyncCount' => BiometricSyncLog::query()->where('status', BiometricSyncStatus::Running)->count(),
            'defaultImportRange' => $this->defaultImportDateRange(),
        ]);
    }

    public function sessions(Request $request): Response
    {
        $this->staleSyncLogCleaner->markTimedOutRunningLogs();

        $from = $request->input('from');
        $to = $request->input('to');

        if (! $request->filled('from') && ! $request->filled('to')) {
            $from = now()->subDays(7)->toDateString();
            $to = now()->toDateString();
        }

        $query = BiometricAttendanceSession::query()
            ->with(['employee:id,first_name,last_name,employee_code', 'device:id,name'])
            ->orderByDesc('clock_in_at');

        if ($from !== null && $from !== '') {
            $query->whereDate('clock_in_at', '>=', $from);
        }

        if ($to !== null && $to !== '') {
            $query->whereDate('clock_in_at', '<=', $to);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('biometric_device_id')) {
            $query->where('biometric_device_id', $request->integer('biometric_device_id'));
        }

        if ($request->filled('status')) {
            if ($request->input('status') === 'open') {
                $query->where('is_open', true);
            } elseif ($request->input('status') === 'closed') {
                $query->where('is_open', false);
            }
        }

        $user = $request->user();
        $this->companyScope->scopeRelationViaEmployee($query, $user);

        $sessions = $query->paginate(20)->withQueryString()->through(
            fn (BiometricAttendanceSession $session) => [
                'id' => $session->id,
                'employee_id' => $session->employee_id,
                'employee_name' => $session->employee
                    ? trim($session->employee->first_name.' '.$session->employee->last_name)
                    : '—',
                'employee_code' => $session->employee?->employee_code,
                'device_name' => $session->device?->name,
                'clock_in_at' => $session->clock_in_at->toIso8601String(),
                'clock_out_at' => $session->clock_out_at?->toIso8601String(),
                'working_minutes' => $session->working_minutes,
                'is_open' => $session->is_open,
            ],
        );

        return Inertia::render('biometric-attendance/sessions', [
            'sessions' => $sessions,
            'filters' => [
                'from' => $from,
                'to' => $to,
                'employee_id' => $request->input('employee_id'),
                'biometric_device_id' => $request->input('biometric_device_id'),
                'status' => $request->input('status'),
            ],
            'devices' => BiometricDevice::query()->orderBy('name')->get(['id', 'name']),
            'employees' => $this->employeesForBiometricSessionFilter($user),
        ]);
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function employeesForBiometricSessionFilter(?\App\Models\User $user): array
    {
        $query = $this->companyScope->scopedEmployeeQuery($user)
            ->where(function ($query) {
                $query->whereNotNull('biometric_user_id')
                    ->orWhereExists(function ($subquery) {
                        $subquery->selectRaw('1')
                            ->from('biometric_attendance_sessions')
                            ->whereColumn('biometric_attendance_sessions.employee_id', 'employees.id');
                    });
            })
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name'])
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'name' => trim($employee->first_name.' '.$employee->last_name),
            ])
            ->values()
            ->all();
    }

    public function punches(Request $request): Response
    {
        $query = BiometricPunch::query()
            ->with(['employee:id,first_name,last_name', 'device:id,name'])
            ->orderByDesc('punched_at');

        if ($request->filled('from')) {
            $query->where('punched_at', '>=', $request->string('from').' 00:00:00');
        }

        if ($request->filled('to')) {
            $query->where('punched_at', '<=', $request->string('to').' 23:59:59');
        }

        if ($request->filled('biometric_device_id')) {
            $query->where('biometric_device_id', $request->integer('biometric_device_id'));
        }

        if ($request->input('mapped') === 'yes') {
            $query->whereNotNull('employee_id');
        } elseif ($request->input('mapped') === 'no') {
            $query->whereNull('employee_id');
        }

        $user = $request->user();
        $this->companyScope->scopeRelationViaEmployee($query, $user);

        $punches = $query->paginate(30)->withQueryString()->through(
            fn (BiometricPunch $punch) => [
                'id' => $punch->id,
                'device_user_id' => $punch->device_user_id,
                'device_name' => $punch->device?->name,
                'employee_name' => $punch->employee
                    ? trim($punch->employee->first_name.' '.$punch->employee->last_name)
                    : null,
                'direction' => $punch->direction->value,
                'punched_at_display' => $this->formatStoredDatetime($punch, 'punched_at'),
                'processed_at_display' => $this->formatStoredDatetime($punch, 'processed_at'),
                'biometric_attendance_session_id' => $punch->biometric_attendance_session_id,
            ],
        );

        return Inertia::render('biometric-attendance/punches', [
            'punches' => $punches,
            'filters' => $request->only(['from', 'to', 'biometric_device_id', 'mapped']),
            'devices' => BiometricDevice::query()->orderBy('name')->get(['id', 'name']),
            'canRemapPunches' => $user?->hasModuleAbility(PermissionModule::BiometricAttendance, ModuleAbility::Update) ?? false,
            'unmappedPunchCount' => BiometricPunch::query()->whereNull('employee_id')->count(),
        ]);
    }

    public function remapPunches(Request $request, BiometricEmployeeMapper $mapper): RedirectResponse
    {
        $validated = $request->validate([
            'biometric_device_id' => ['nullable', 'integer', 'exists:biometric_devices,id'],
        ]);

        if ($validated['biometric_device_id'] ?? null) {
            $device = BiometricDevice::query()->findOrFail($validated['biometric_device_id']);
            $result = $mapper->mapForDevice($device);
        } else {
            $result = $mapper->mapForAllDevices();
        }

        $message = $result['mapped'] > 0
            ? "Linked {$result['mapped']} punch(es) to employees. {$result['unmapped']} punch(es) still have no matching employee PIN."
            : 'No punches were linked. Set each employee’s Biometric user ID to the exact device PIN, then try again.';

        return redirect()
            ->route('biometric-attendance.punches', $request->only(['from', 'to', 'biometric_device_id', 'mapped']))
            ->with('success', $message);
    }

    public function syncLogs(Request $request): Response
    {
        $this->staleSyncLogCleaner->markTimedOutRunningLogs();

        $query = BiometricSyncLog::query()
            ->with(['device:id,name', 'triggeredByUser:id,name'])
            ->orderByDesc('started_at');

        if ($request->filled('biometric_device_id')) {
            $query->where('biometric_device_id', $request->integer('biometric_device_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $syncLogs = $query->paginate(20)->withQueryString()->through(
            fn (BiometricSyncLog $log) => $this->formatSyncLog($log),
        );

        return Inertia::render('biometric-attendance/sync-logs', [
            'syncLogs' => $syncLogs,
            'filters' => $request->only(['biometric_device_id', 'status']),
            'devices' => BiometricDevice::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function storeDevice(StoreBiometricDeviceRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = (bool) ($data['is_active'] ?? false);
        $data['port'] = $data['port'] ?? 4370;
        $data['model'] = $data['model'] ?? 'iClock990';

        if (($data['comm_key'] ?? '') === '') {
            unset($data['comm_key']);
        }

        $data['metadata'] = $this->metadataWithWebLogin([
            'protocol' => $data['protocol'] ?? 'udp',
        ], $request->input('web_username'), $request->input('web_password'), $request->input('web_session_id'));
        unset($data['protocol'], $data['web_username'], $data['web_password'], $data['web_session_id']);

        BiometricDevice::query()->create($data);

        return to_route('biometric-attendance.dashboard')->with('success', 'Device created.');
    }

    public function updateDevice(UpdateBiometricDeviceRequest $request, BiometricDevice $biometric_device): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = (bool) ($data['is_active'] ?? false);
        $data['port'] = $data['port'] ?? 4370;

        if (($data['comm_key'] ?? '') === '') {
            unset($data['comm_key']);
        }

        $protocol = $data['protocol'] ?? $biometric_device->zkProtocol();
        unset($data['protocol']);
        $data['metadata'] = $this->metadataWithWebLogin(
            array_merge($biometric_device->metadata ?? [], ['protocol' => $protocol]),
            $request->input('web_username'),
            $request->input('web_password'),
            $request->input('web_session_id'),
        );
        unset($data['web_username'], $data['web_password'], $data['web_session_id']);

        $biometric_device->update($data);

        return redirect()
            ->back()
            ->with('success', 'Device updated.');
    }

    public function sync(
        SyncBiometricDeviceRequest $request,
        BiometricSyncPipeline $pipeline,
        BiometricBackgroundSyncStarter $syncStarter,
        BiometricDeviceProbeService $probeService,
    ): RedirectResponse|JsonResponse {
        $validated = $request->validated();
        $device = BiometricDevice::query()->findOrFail($validated['biometric_device_id']);

        if (! $device->is_active) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Device is not active. Enable it on the dashboard first.');
        }

        $this->staleSyncLogCleaner->markTimedOutRunningLogs();
        $this->staleSyncLogCleaner->supersedeRunningLogsForDevice($device->id);

        [$from, $until] = $pipeline->parsePullRange(
            $device,
            $validated['from'] ?? null,
            $validated['to'] ?? null,
        );

        $syncLog = $pipeline->createPendingLog(
            $device,
            BiometricSyncType::Manual,
            $request->user()?->id,
            $from,
            $until,
        );

        app(BiometricPipelineTracer::class)->stage('controller_sync_queued', [
            'device_id' => $device->id,
            'sync_log_id' => $syncLog->id,
            'from' => $validated['from'] ?? null,
            'to' => $validated['to'] ?? null,
        ]);

        if ($device->connection_type === BiometricConnectionType::TcpPull) {
            $probe = $probeService->quickProbe($device);

            if (! $probe['pull_can_connect']) {
                $this->failSyncLogImmediately($syncLog, $device, $probe['recommendation']);

                if ($request->wantsJson()) {
                    return response()->json([
                        'ok' => false,
                        'sync_log_id' => $syncLog->id,
                        'message' => $probe['recommendation'],
                    ], 422);
                }

                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', $probe['recommendation']);
            }
        }

        $syncStarter->start(
            $device->id,
            $request->user()?->id,
            $validated['from'] ?? null,
            $validated['to'] ?? null,
            $syncLog->id,
        );

        $syncLog->refresh();

        if ($request->wantsJson()) {
            $isRunning = $syncLog->status === BiometricSyncStatus::Running;

            return response()->json([
                'sync_log_id' => $syncLog->id,
                'message' => $isRunning ? 'Sync started.' : $this->syncResultSummary($syncLog),
                'completed' => ! $isRunning,
                'summary' => $isRunning ? null : $this->syncResultSummary($syncLog),
            ]);
        }

        return redirect()
            ->back()
            ->with('success', 'Sync started. This may take up to a minute while data is read from the device.')
            ->with('sync_log_id', $syncLog->id);
    }

    public function syncStatus(Request $request): JsonResponse
    {
        $this->staleSyncLogCleaner->markTimedOutRunningLogs();

        $validated = $request->validate([
            'sync_log_id' => ['required', 'integer', 'exists:biometric_sync_logs,id'],
        ]);

        $log = BiometricSyncLog::query()->findOrFail($validated['sync_log_id']);

        if (
            $log->status === BiometricSyncStatus::Running
            && $log->started_at !== null
            && $log->started_at->lt(now()->subMinutes(config('biometric.sync_stale_minutes', 5)))
        ) {
            $log->update([
                'status' => BiometricSyncStatus::Failed,
                'finished_at' => now(),
                'error_message' => 'Sync timed out. On Laragon, use the same PHP as Apache (sync_driver=after_response) and enable ext-sockets in that php.ini.',
            ]);
            $log->refresh();
        }

        $metadata = is_array($log->error_metadata) ? $log->error_metadata : [];

        return response()->json([
            'id' => $log->id,
            'status' => $log->status->value,
            'is_running' => $log->status === BiometricSyncStatus::Running,
            'fetched_count' => $log->fetched_count,
            'inserted_count' => $log->inserted_count,
            'in_range' => $metadata['in_range'] ?? null,
            'error_message' => $log->error_message,
            'summary' => $this->syncResultSummary($log),
        ]);
    }

    public function testConnection(
        Request $request,
        BiometricDevice $biometric_device,
        BiometricDeviceProbeService $probeService,
    ): RedirectResponse|JsonResponse {
        $probe = $probeService->quickProbe($biometric_device);

        $metadata = $biometric_device->metadata ?? [];

        if ($probe['ok']) {
            $metadata['last_connectivity_test_at'] = now()->toIso8601String();
            $metadata['last_connectivity_test_ok'] = true;

            $sessionId = app(ZkDeviceWebReportClient::class)->lastSessionIdUsed();

            if (is_string($sessionId) && preg_match('/^\d+$/', $sessionId) === 1) {
                $metadata['web_session_id'] = $sessionId;
            }

            $biometric_device->update([
                'last_error' => null,
                'metadata' => $metadata,
            ]);
        } else {
            $metadata['last_connectivity_test_at'] = now()->toIso8601String();
            $metadata['last_connectivity_test_ok'] = false;

            $biometric_device->update([
                'last_error' => $probe['recommendation'],
                'metadata' => $metadata,
            ]);
        }

        $flashKey = $probe['ok'] ? 'success' : 'error';

        if ($request->wantsJson()) {
            return response()->json([
                'ok' => $probe['ok'],
                'message' => $probe['recommendation'],
            ]);
        }

        return to_route('biometric-attendance.dashboard')->with($flashKey, $probe['recommendation']);
    }

    public function useAdmsPush(BiometricDevice $biometric_device): RedirectResponse
    {
        $biometric_device->update([
            'connection_type' => BiometricConnectionType::AdmsPush,
            'last_error' => null,
            'last_sync_status' => null,
            'metadata' => array_merge($biometric_device->metadata ?? [], [
                'protocol' => 'tcp',
                'switched_to_adms_at' => now()->toIso8601String(),
            ]),
        ]);

        $url = BiometricPushUrl::cdataEndpoint();
        $localhostNote = BiometricPushUrl::usesLocalhost()
            ? ' Add BIOMETRIC_PUSH_BASE_URL=http://YOUR_PC_LAN_IP to .env — the terminal cannot reach localhost.'
            : '';

        return to_route('biometric-attendance.dashboard')->with(
            'success',
            "Device switched to ADMS push. On the iClock: Communication → Cloud Server → Server URL: {$url}. Serial must be {$biometric_device->serial_number}.{$localhostNote}",
        );
    }

    public function useDeviceWebReport(BiometricDevice $biometric_device): RedirectResponse
    {
        $host = $biometric_device->host;

        $biometric_device->update([
            'connection_type' => BiometricConnectionType::DeviceWebReport,
            'port' => 80,
            'last_error' => null,
            'last_sync_status' => null,
            'metadata' => array_merge($biometric_device->metadata ?? [], [
                'protocol' => 'tcp',
                'switched_to_device_web_at' => now()->toIso8601String(),
            ]),
        ]);

        $deviceWebUrl = $host !== null && $host !== ''
            ? rtrim($biometric_device->deviceWebBaseUrl(), '/')
            : 'device IP';

        return to_route('biometric-attendance.import')->with(
            'success',
            "Device switched to web report pull. Open Import attendance, set dates to match Report on the device at {$deviceWebUrl}, then import.",
        );
    }

    public function probeDevice(BiometricDevice $biometric_device, BiometricDeviceProbeService $probeService): JsonResponse
    {
        return response()->json($probeService->probe($biometric_device));
    }

    private function syncResultSummary(BiometricSyncLog $log): string
    {
        if ($log->status === BiometricSyncStatus::Failed) {
            return $log->error_message ?? 'Sync failed.';
        }

        if ($log->status !== BiometricSyncStatus::Completed) {
            return 'Sync in progress…';
        }

        $metadata = is_array($log->error_metadata) ? $log->error_metadata : [];
        $inRange = $metadata['in_range'] ?? $log->fetched_count;

        if ($log->fetched_count === 0) {
            $range = $this->formatSyncLogDateRange($log);

            return 'Sync finished but the device returned no punches for '.$range.'. '
                .'Use the same From/To dates as on the device Report page (check the year).';
        }

        if ($log->inserted_count === 0 && $log->duplicate_count > 0) {
            return "Sync finished: {$log->fetched_count} punches fetched ({$log->duplicate_count} already in Raw punches). Open Raw punches to view them.";
        }

        if ($inRange === 0 && $log->fetched_count > 0) {
            return "Sync finished: {$log->fetched_count} on device but none in the selected date range. Widen the date filter on Pull.";
        }

        if ($log->unmapped_count > 0) {
            return "Sync finished: {$log->inserted_count} new punches ({$log->unmapped_count} need employee biometric user ID mapping).";
        }

        return "Sync finished: {$log->inserted_count} new punch(es) imported. Open Raw punches to review device PINs and in/out times.";
    }

    private function formatStoredDatetime(BiometricPunch $punch, string $column): string
    {
        $raw = $punch->getRawOriginal($column);

        if (is_string($raw) && trim($raw) !== '') {
            return $raw;
        }

        $value = $punch->getAttribute($column);

        if ($value instanceof \Illuminate\Support\Carbon) {
            return $value->format('Y-m-d H:i:s');
        }

        return '—';
    }

    private function formatSyncLogDateRange(BiometricSyncLog $log): string
    {
        $metadata = is_array($log->error_metadata) ? $log->error_metadata : [];

        if (is_string($metadata['from'] ?? null) && is_string($metadata['to'] ?? null)) {
            return $metadata['from'].' to '.$metadata['to'];
        }

        return 'the selected date range';
    }

    /**
     * @return array{from: string, to: string}
     */
    private function defaultImportDateRange(): array
    {
        $device = BiometricDevice::query()
            ->where('is_active', true)
            ->where('connection_type', BiometricConnectionType::DeviceWebReport)
            ->orderBy('id')
            ->first();

        $timezone = $device?->timezone ?? config('app.timezone', 'UTC');
        $to = now($timezone);
        $from = $to->copy()->subDays(7);

        return [
            'from' => $from->format('Y-m-d'),
            'to' => $to->format('Y-m-d'),
        ];
    }

    private function failSyncLogImmediately(
        BiometricSyncLog $syncLog,
        BiometricDevice $device,
        string $message,
    ): void {
        $syncLog->update([
            'status' => BiometricSyncStatus::Failed,
            'finished_at' => now(),
            'error_message' => $message,
        ]);

        $device->update([
            'last_sync_status' => BiometricSyncStatus::Failed->value,
            'last_error' => $message,
        ]);
    }

    /**
     * @return list<array{
     *     id: int,
     *     name: string,
     *     host: string|null,
     *     port: int,
     *     connection_type: string,
     *     is_active: bool,
     *     last_sync_at: string|null,
     *     last_sync_status: string|null,
     *     last_error: string|null,
     *     protocol: string,
     *     last_adms_push_at: string|null,
     *     last_connectivity_test_at: string|null,
     * }>
     */
    private function devicesForConnectivity(): array
    {
        return BiometricDevice::query()
            ->orderBy('name')
            ->get()
            ->map(fn (BiometricDevice $device) => [
                'id' => $device->id,
                'name' => $device->name,
                'host' => $device->host,
                'port' => $device->port,
                'connection_type' => $device->connection_type->value,
                'is_active' => $device->is_active,
                'last_sync_at' => $device->last_sync_at?->toIso8601String(),
                'last_sync_status' => $device->last_sync_status,
                'last_error' => $device->last_error,
                'protocol' => $device->zkProtocol(),
                'last_adms_push_at' => is_string($device->metadata['last_adms_push_at'] ?? null)
                    ? $device->metadata['last_adms_push_at']
                    : null,
                'last_connectivity_test_at' => is_string($device->metadata['last_connectivity_test_at'] ?? null)
                    ? $device->metadata['last_connectivity_test_at']
                    : null,
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, name: string, host: string|null, connection_type: string}>
     */
    private function activeDevicesForSync(): array
    {
        return BiometricDevice::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'host', 'connection_type'])
            ->map(fn (BiometricDevice $device) => [
                'id' => $device->id,
                'name' => $device->name,
                'host' => $device->host,
                'connection_type' => $device->connection_type->value,
            ])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>
     */
    private function metadataWithWebLogin(
        array $metadata,
        mixed $webUsername,
        mixed $webPassword,
        mixed $webSessionId = null,
    ): array {
        if (is_string($webUsername) && $webUsername !== '') {
            $metadata['web_username'] = $webUsername;
        }

        if (is_string($webPassword) && $webPassword !== '') {
            $metadata['web_password'] = $webPassword;
        }

        if (is_string($webSessionId)) {
            $trimmed = trim($webSessionId);

            if ($trimmed === '') {
                unset($metadata['web_session_id']);
            } elseif (preg_match('/^\d+$/', $trimmed) === 1) {
                $metadata['web_session_id'] = $trimmed;
            }
        }

        return $metadata;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatSyncLog(BiometricSyncLog $log): array
    {
        return [
            'id' => $log->id,
            'device_id' => $log->biometric_device_id,
            'device_name' => $log->device?->name,
            'triggered_by_name' => $log->triggeredByUser?->name,
            'sync_type' => $log->sync_type->value,
            'status' => $log->status->value,
            'started_at' => $log->started_at->toIso8601String(),
            'finished_at' => $log->finished_at?->toIso8601String(),
            'fetched_count' => $log->fetched_count,
            'inserted_count' => $log->inserted_count,
            'duplicate_count' => $log->duplicate_count,
            'unmapped_count' => $log->unmapped_count,
            'failed_count' => $log->failed_count,
            'sessions_created_count' => $log->sessions_created_count,
            'sessions_updated_count' => $log->sessions_updated_count,
            'error_message' => $log->error_message,
            'error_metadata' => $log->error_metadata,
            'is_running' => $log->status === BiometricSyncStatus::Running,
        ];
    }
}
