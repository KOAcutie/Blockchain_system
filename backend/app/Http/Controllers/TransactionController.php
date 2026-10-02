<?php

namespace App\Http\Controllers;

use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Services\BlockchainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function __construct(
        protected BlockchainService $blockchainService
    ) {}

    /**
     * GET /api/student/transactions
     */
    public function studentIndex(Request $request): JsonResponse
    {
        $transactions = Transaction::with(['payment.user', 'payment.fee', 'payment.verifier', 'payment.receipt', 'blockchainRecord'])
            ->whereHas('payment', fn ($q) => $q->where('user_id', $request->user()->id))
            ->orderByDesc('created_at')
            ->get();

        return $this->successResponse(
            TransactionResource::collection($transactions)->resolve($request),
            'Student transactions retrieved successfully'
        );
    }

    /**
     * GET /api/student/transactions/{id}
     * Retrieves transaction + blockchain record, and optionally performs live verification.
     */
    public function studentShow(Request $request, string $id): JsonResponse
    {
        $transaction = Transaction::with(['payment.user', 'payment.fee', 'payment.verifier', 'payment.receipt', 'blockchainRecord'])
            ->where('id', $id)
            ->orWhere('transaction_id', $id)
            ->first();

        if (! $transaction) {
            return $this->errorResponse('Transaction not found.', ['transaction' => ['Requested transaction record does not exist.']], 404);
        }

        $user = $request->user();
        if ($user->hasRole('student') && (int) $transaction->payment?->user_id !== (int) $user->id) {
            return $this->errorResponse('Forbidden.', ['authorization' => ['You can only view your own transactions.']], 403);
        }

        $verification = null;
        if ($request->boolean('verify', false)) {
            $verification = $this->blockchainService->verifyTransaction($transaction);
            $transaction->refresh()->load(['payment.user', 'payment.fee', 'payment.verifier', 'payment.receipt', 'blockchainRecord']);
        }

        $payload = (new TransactionResource($transaction))->resolve($request);
        if ($verification !== null) {
            $payload['verification'] = $verification;
        }

        return $this->successResponse($payload, 'Transaction details retrieved successfully');
    }

    /**
     * GET /api/officer/transactions
     */
    public function officerIndex(Request $request): JsonResponse
    {
        $query = Transaction::with(['payment.user', 'payment.fee', 'payment.verifier', 'payment.receipt', 'blockchainRecord'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $transactions = $query->get();

        return $this->successResponse(
            TransactionResource::collection($transactions)->resolve($request),
            'All student transactions retrieved successfully'
        );
    }
}
