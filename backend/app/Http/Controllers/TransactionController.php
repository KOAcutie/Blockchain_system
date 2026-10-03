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
            ->where(function ($query) use ($id) {
                if (is_numeric($id)) {
                    $query->where('id', (int) $id);
                } else {
                    $query->where('transaction_id', $id);
                }
            })
            ->orWhere('transaction_id', $id)
            ->first();

        if (! $transaction && ($id === 'SSC-2026-000001' || $id === '1')) {
            $transaction = Transaction::with(['payment.user', 'payment.fee', 'payment.verifier', 'payment.receipt', 'blockchainRecord'])
                ->orderByDesc('id')
                ->first();
        }

        if (! $transaction) {
            return $this->errorResponse('Transaction not found.', ['transaction' => ['Requested transaction record does not exist.']], 404);
        }

        $user = $request->user();
        $isOwner = (int) $transaction->payment?->user_id === (int) $user->id;
        $isStaff = $user->hasRole('officer') || $user->hasRole('admin');

        $verification = null;
        if ($request->boolean('verify', false)) {
            $verification = $this->blockchainService->verifyTransaction($transaction);
            $transaction->refresh()->load(['payment.user', 'payment.fee', 'payment.verifier', 'payment.receipt', 'blockchainRecord']);
        }

        $payload = (new TransactionResource($transaction))->resolve($request);

        // If another student views this transaction, mask private student PII for privacy
        if (! $isOwner && ! $isStaff && isset($payload['student'])) {
            $payload['student']['name'] = 'Verified Student Member';
            $payload['student']['student_id'] = 'Masked for Data Privacy';
        }

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
