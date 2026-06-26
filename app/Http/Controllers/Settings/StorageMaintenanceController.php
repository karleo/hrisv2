<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\DatabaseRestoreRequest;
use App\Http\Requests\Settings\StorageSettingUpdateRequest;
use App\Models\StorageSetting;
use App\Services\Database\DatabaseBackupService;
use App\Services\Storage\StorageLinkMaintenanceService;
use App\Services\Storage\StorageSettingsManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class StorageMaintenanceController extends Controller
{
    /**
     * System maintenance page: storage driver (local/S3), symlink/S3 checks, and database backup/restore.
     */
    public function edit(
        Request $request,
        StorageLinkMaintenanceService $storageLinkMaintenance,
        StorageSettingsManager $storageSettingsManager,
        DatabaseBackupService $databaseBackupService,
    ): Response {
        $this->ensureAdministrator($request);

        $settings = StorageSetting::singleton();
        $resolved = $storageSettingsManager->resolved();

        return Inertia::render('settings/storage-maintenance', [
            'settings' => [
                'driver' => $resolved['driver'],
                'aws_access_key_id' => $resolved['aws_access_key_id'],
                'aws_default_region' => $resolved['aws_default_region'],
                'aws_bucket' => $resolved['aws_bucket'],
                'aws_url' => $resolved['aws_url'],
                'aws_use_path_style_endpoint' => $resolved['aws_use_path_style_endpoint'],
                'has_aws_secret' => $resolved['has_aws_secret'],
                'source' => $resolved['source'],
                'updated_at' => $settings?->updated_at?->toIso8601String(),
            ],
            'status' => $storageLinkMaintenance->inspect(),
            'database' => [
                'connection' => $databaseBackupService->connectionName(),
                'driver' => $databaseBackupService->driver(),
                'backups' => $databaseBackupService->listBackups(),
            ],
            'maintenanceResult' => session('maintenance_result'),
            'databaseResult' => session('database_result'),
        ]);
    }

    /**
     * Persist local vs S3 storage choice and AWS credentials for uploads.
     */
    public function update(
        StorageSettingUpdateRequest $request,
        StorageSettingsManager $storageSettingsManager,
    ): RedirectResponse {
        $this->ensureAdministrator($request);

        $validated = $request->validated();
        $settings = StorageSetting::singletonOrCreate([
            'driver' => StorageSetting::DRIVER_LOCAL,
        ]);

        $settings->fill([
            'driver' => $validated['driver'],
            'aws_access_key_id' => $validated['aws_access_key_id'] ?? null,
            'aws_default_region' => $validated['aws_default_region'] ?? null,
            'aws_bucket' => $validated['aws_bucket'] ?? null,
            'aws_url' => StorageSettingsManager::normalizeS3PublicUrl($validated['aws_url'] ?? null),
            'aws_use_path_style_endpoint' => (bool) ($validated['aws_use_path_style_endpoint'] ?? false),
            'updated_by' => $request->user()->id,
        ]);

        if (
            array_key_exists('aws_secret_access_key', $validated)
            && is_string($validated['aws_secret_access_key'])
            && $validated['aws_secret_access_key'] !== ''
        ) {
            $settings->aws_secret_access_key = $validated['aws_secret_access_key'];
        }

        $settings->save();

        $storageSettingsManager->forgetCache();
        $storageSettingsManager->applyLatest();

        return to_route('storage-maintenance.edit')->with('success', 'Storage settings updated successfully.');
    }

    /**
     * Run storage link repair (local) or S3 connectivity verification (cloud).
     */
    public function run(Request $request, StorageLinkMaintenanceService $storageLinkMaintenance): RedirectResponse
    {
        $this->ensureAdministrator($request);

        $validated = $request->validate([
            'force' => ['sometimes', 'boolean'],
        ]);

        try {
            $messages = $storageLinkMaintenance->run((bool) ($validated['force'] ?? false));
        } catch (RuntimeException $exception) {
            return to_route('storage-maintenance.edit')->with('maintenance_result', [
                'success' => false,
                'messages' => [$exception->getMessage()],
            ]);
        }

        return to_route('storage-maintenance.edit')->with([
            'success' => 'Storage maintenance completed successfully.',
            'maintenance_result' => [
                'success' => true,
                'messages' => $messages,
            ],
        ]);
    }

    public function backupDatabase(Request $request, DatabaseBackupService $databaseBackupService): RedirectResponse
    {
        $this->ensureAdministrator($request);

        try {
            $filename = $databaseBackupService->backup();
        } catch (RuntimeException $exception) {
            return to_route('storage-maintenance.edit')->with('database_result', [
                'success' => false,
                'messages' => [$exception->getMessage()],
            ]);
        }

        return to_route('storage-maintenance.edit')->with([
            'success' => 'Database backup created successfully.',
            'database_result' => [
                'success' => true,
                'messages' => [
                    "Backup saved as {$filename}.",
                    'You can download it from the list below before restoring.',
                ],
            ],
        ]);
    }

    public function downloadBackup(Request $request, string $filename, DatabaseBackupService $databaseBackupService): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->ensureAdministrator($request);

        try {
            return $databaseBackupService->downloadResponse($filename);
        } catch (RuntimeException $exception) {
            abort(404, $exception->getMessage());
        }
    }

    public function restoreDatabase(
        DatabaseRestoreRequest $request,
        DatabaseBackupService $databaseBackupService,
    ): RedirectResponse {
        $this->ensureAdministrator($request);

        try {
            $databaseBackupService->restore($request->file('backup_file'));
        } catch (RuntimeException $exception) {
            return to_route('storage-maintenance.edit')->with('database_result', [
                'success' => false,
                'messages' => [$exception->getMessage()],
            ]);
        }

        return to_route('storage-maintenance.edit')->with([
            'success' => 'Database restored successfully.',
            'database_result' => [
                'success' => true,
                'messages' => ['Database restore completed. Refresh the application to use the restored data.'],
            ],
        ]);
    }

    public function restoreStoredDatabase(Request $request, DatabaseBackupService $databaseBackupService): RedirectResponse
    {
        $this->ensureAdministrator($request);

        $validated = $request->validate([
            'backup_name' => ['required', 'string', 'max:255'],
            'confirm_restore' => ['accepted'],
        ]);

        try {
            $databaseBackupService->restoreFromStoredBackup($validated['backup_name']);
        } catch (RuntimeException $exception) {
            return to_route('storage-maintenance.edit')->with('database_result', [
                'success' => false,
                'messages' => [$exception->getMessage()],
            ]);
        }

        return to_route('storage-maintenance.edit')->with([
            'success' => 'Database restored successfully.',
            'database_result' => [
                'success' => true,
                'messages' => [
                    "Restored from {$validated['backup_name']}.",
                    'Refresh the application to use the restored data.',
                ],
            ],
        ]);
    }

    private function ensureAdministrator(Request $request): void
    {
        $user = $request->user();

        if ($user === null || ! $user->isAdministrator()) {
            abort(403);
        }
    }
}
