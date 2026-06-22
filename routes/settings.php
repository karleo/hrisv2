<?php

use App\Http\Controllers\Settings\AiAssistantController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SmtpController;
use App\Http\Controllers\Settings\StorageMaintenanceController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    Route::get('settings/smtp', [SmtpController::class, 'edit'])
        ->name('smtp.edit');
    Route::put('settings/smtp', [SmtpController::class, 'update'])
        ->name('smtp.update');
    Route::post('settings/smtp/test', [SmtpController::class, 'test'])
        ->middleware('throttle:5,1')
        ->name('smtp.test');

    Route::get('settings/ai-assistant', [AiAssistantController::class, 'edit'])
        ->name('ai-assistant.edit');
    Route::put('settings/ai-assistant', [AiAssistantController::class, 'update'])
        ->name('ai-assistant.update');
    Route::post('settings/ai-assistant/test', [AiAssistantController::class, 'test'])
        ->middleware('throttle:5,1')
        ->name('ai-assistant.test');

    Route::get('settings/storage-maintenance', [StorageMaintenanceController::class, 'edit'])
        ->name('storage-maintenance.edit');
    Route::put('settings/storage-maintenance', [StorageMaintenanceController::class, 'update'])
        ->name('storage-maintenance.update');
    Route::post('settings/storage-maintenance/run', [StorageMaintenanceController::class, 'run'])
        ->middleware('throttle:5,1')
        ->name('storage-maintenance.run');
    Route::post('settings/storage-maintenance/database/backup', [StorageMaintenanceController::class, 'backupDatabase'])
        ->name('storage-maintenance.database.backup');
    Route::get('settings/storage-maintenance/database/download/{filename}', [StorageMaintenanceController::class, 'downloadBackup'])
        ->name('storage-maintenance.database.download');
    Route::post('settings/storage-maintenance/database/restore', [StorageMaintenanceController::class, 'restoreDatabase'])
        ->name('storage-maintenance.database.restore');
    Route::post('settings/storage-maintenance/database/restore-stored', [StorageMaintenanceController::class, 'restoreStoredDatabase'])
        ->name('storage-maintenance.database.restore-stored');
});
