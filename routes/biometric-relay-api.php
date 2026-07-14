<?php

use App\Http\Controllers\Biometric\BiometricRelayHealthController;
use Illuminate\Support\Facades\Route;

Route::get('biometric/relay/health', [BiometricRelayHealthController::class, 'health'])
    ->name('biometric.relay.health');

Route::post('biometric/relay/heartbeat', [BiometricRelayHealthController::class, 'heartbeat'])
    ->name('biometric.relay.heartbeat');
