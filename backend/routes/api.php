<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BlockchainController;
use App\Http\Controllers\FeeController;
use App\Http\Controllers\FundUsageController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransparencyController;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Health Check Endpoint
|--------------------------------------------------------------------------
*/
Route::get('/health', function () {
    $dbConnected = false;
    try {
        DB::connection()->getPdo();
        $dbConnected = true;
    } catch (\Throwable) {
        $dbConnected = false;
    }

    return response()->json([
        'success' => true,
        'message' => 'SSC Transparency Laravel API is healthy',
        'data' => [
            'service' => 'ssc-transparency-backend',
            'status' => 'ok',
            'database_connected' => $dbConnected,
            'timestamp' => now()->toIso8601String(),
        ],
    ]);
});

/*
|--------------------------------------------------------------------------
| Authentication Endpoints (/api/auth/*)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

/*
|--------------------------------------------------------------------------
| Public & Student Transparency Endpoints (/api/transparency/*)
|--------------------------------------------------------------------------
*/
Route::prefix('transparency')->group(function () {
    Route::get('/', [TransparencyController::class, 'index']);
    Route::get('/summary', [TransparencyController::class, 'summary']);
    Route::get('/collections', [TransparencyController::class, 'collections']);
    Route::get('/funds', [TransparencyController::class, 'funds']);
    Route::get('/ledger', [TransparencyController::class, 'ledger']);
    Route::get('/verify', [TransparencyController::class, 'verify']);
    Route::post('/verify', [TransparencyController::class, 'verify']);
});

/*
|--------------------------------------------------------------------------
| Fee Management Endpoints (/api/fees/*)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('fees')->group(function () {
    Route::get('/', [FeeController::class, 'index']);
    Route::get('/{id}', [FeeController::class, 'show']);

    Route::middleware('role:officer,admin')->group(function () {
        Route::post('/', [FeeController::class, 'store']);
        Route::put('/{id}', [FeeController::class, 'update']);
        Route::delete('/{id}', [FeeController::class, 'destroy']);
    });
});

/*
|--------------------------------------------------------------------------
| Student Endpoints (/api/student/*)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:student,officer,admin'])->prefix('student')->group(function () {
    Route::get('/fees', [FeeController::class, 'studentIndex']);
    Route::get('/fees/{id}', [FeeController::class, 'studentShow']);

    Route::get('/payments', [PaymentController::class, 'studentIndex']);
    Route::post('/payments', [PaymentController::class, 'store'])->middleware('role:student');
    Route::get('/payments/{id}', [PaymentController::class, 'studentShow']);

    Route::get('/transactions', [TransactionController::class, 'studentIndex']);
    Route::get('/transactions/{id}', [TransactionController::class, 'studentShow']);
    Route::get('/transactions/{id}/receipt', [ReceiptController::class, 'showByTransaction']);

    Route::get('/receipts/{id}', [ReceiptController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| SSC Officer Endpoints (/api/officer/*)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:officer,admin'])->prefix('officer')->group(function () {
    // Officer Fees alias
    Route::get('/fees', [FeeController::class, 'index']);
    Route::post('/fees', [FeeController::class, 'store']);
    Route::get('/fees/{id}', [FeeController::class, 'show']);
    Route::put('/fees/{id}', [FeeController::class, 'update']);
    Route::delete('/fees/{id}', [FeeController::class, 'destroy']);

    // Officer Payments
    Route::get('/payments', [PaymentController::class, 'officerIndex']);
    Route::get('/payments/{id}', [PaymentController::class, 'officerShow']);
    Route::post('/payments/{id}/verify', [PaymentController::class, 'verify']);
    Route::post('/payments/{id}/reject', [PaymentController::class, 'reject']);
    Route::get('/payments/{id}/proof', [PaymentController::class, 'viewProof']);

    // Officer Transactions
    Route::get('/transactions', [TransactionController::class, 'officerIndex']);

    // Officer Fund Usage
    Route::get('/funds', [FundUsageController::class, 'index']);
    Route::post('/funds', [FundUsageController::class, 'store']);
    Route::get('/funds/{id}', [FundUsageController::class, 'show']);
    Route::put('/funds/{id}', [FundUsageController::class, 'update']);
    Route::post('/funds/{id}/publish', [FundUsageController::class, 'publish']);

    // Officer Reports
    Route::prefix('reports')->group(function () {
        Route::get('/summary', [ReportController::class, 'summary']);
        Route::get('/collections', [ReportController::class, 'collections']);
        Route::get('/transactions', [ReportController::class, 'transactions']);
        Route::get('/funds', [ReportController::class, 'funds']);
    });
});

/*
|--------------------------------------------------------------------------
| Admin-Only Endpoints (/api/admin/*)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/audit-logs', function () {
        $logs = AuditLog::with('user:id,name,email')->orderByDesc('id')->limit(100)->get();

        return response()->json([
            'success' => true,
            'message' => 'Audit logs retrieved successfully',
            'data' => $logs,
        ]);
    });

    Route::get('/users', function () {
        $users = User::with('role')->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'message' => 'System users retrieved successfully',
            'data' => \App\Http\Resources\UserResource::collection($users),
        ]);
    });
});

/*
|--------------------------------------------------------------------------
| Blockchain Endpoints (/api/blockchain/*)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('blockchain')->group(function () {
    Route::get('/network', [BlockchainController::class, 'network']);
    Route::post('/verify', [BlockchainController::class, 'verify']);
    Route::get('/transactions/{hash}', [BlockchainController::class, 'showByHash']);

    Route::middleware('role:officer,admin')->group(function () {
        Route::post('/transactions', [BlockchainController::class, 'submit']);
    });
});
