<?php

use App\Http\Controllers\Biometric\IclockAdmsController;
use Illuminate\Support\Facades\Route;

Route::match(['get', 'post'], 'cdata', [IclockAdmsController::class, 'cdata']);
Route::get('getrequest', [IclockAdmsController::class, 'getRequest']);
Route::post('devicecmd', [IclockAdmsController::class, 'deviceCmd']);
