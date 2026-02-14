<?php

use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\JobPositionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('departments', DepartmentController::class);
    Route::resource('job-positions', JobPositionController::class);
});

require __DIR__.'/settings.php';
