<?php

use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeRequestController;
use App\Http\Controllers\HardwareController;
use App\Http\Controllers\ItAssetRequestController;
use App\Http\Controllers\ItRequestController;
use App\Http\Controllers\JobPositionController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\SoftwareController;
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
    Route::get('employees/{employee}/business-card', [EmployeeController::class, 'businessCard'])
        ->name('employees.business-card');
    Route::resource('employees', EmployeeController::class);
    Route::delete('employees/{employee}/documents/{employee_document}', [EmployeeController::class, 'destroyDocument'])
        ->name('employees.documents.destroy');
    Route::resource('job-positions', JobPositionController::class);
    Route::resource('leave-types', LeaveTypeController::class);
    Route::resource('countries', CountryController::class);
    Route::resource('company-profiles', CompanyProfileController::class);
    Route::resource('software', SoftwareController::class);
    Route::resource('hardware', HardwareController::class);
    Route::resource('leave-requests', LeaveRequestController::class);
    Route::get('leave-requests/{leave_request}/print', [LeaveRequestController::class, 'print'])
        ->name('leave-requests.print');
    Route::post('leave-requests/{leave_request}/signatures', [LeaveRequestController::class, 'updateSignatures'])
        ->name('leave-requests.signatures.update');
    Route::resource('it-requests', ItRequestController::class);
    Route::post('it-requests/{it_request}/signatures', [ItRequestController::class, 'updateSignatures'])
        ->name('it-requests.signatures.update');
    Route::resource('employee-requests', EmployeeRequestController::class);
    Route::post('employee-requests/{employee_request}/signatures', [EmployeeRequestController::class, 'updateSignatures'])
        ->name('employee-requests.signatures.update');
    Route::resource('it-asset-requests', ItAssetRequestController::class);
    Route::post('it-asset-requests/{it_asset_request}/signatures', [ItAssetRequestController::class, 'updateSignatures'])
        ->name('it-asset-requests.signatures.update');
});

require __DIR__.'/settings.php';
