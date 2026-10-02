<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReceiptResource;
use App\Models\Receipt;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    /**
     * GET /api/student/receipts/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $receipt = Receipt::with(['payment.user', 'payment.fee', 'payment.verifier', 'payment.transaction.blockchainRecord'])
            ->where('id', $id)
            ->orWhere('receipt_number', $id)
            ->first();

        if (! $receipt) {
            return $this->errorResponse('Receipt not found.', ['receipt' => ['Digital receipt does not exist.']], 404);
        }

        $user = $request->user();
        if ($user->hasRole('student') && (int) $receipt->payment?->user_id !== (int) $user->id) {
            return $this->errorResponse('Forbidden.', ['authorization' => ['You can only view your own digital receipts.']], 403);
        }

        return $this->successResponse(
            (new ReceiptResource($receipt))->resolve($request),
            'Digital receipt retrieved successfully'
        );
    }

    /**
     * GET /api/student/transactions/{id}/receipt
     */
    public function showByTransaction(Request $request, string $id): JsonResponse
    {
        $transaction = Transaction::with(['payment.user', 'payment.fee', 'payment.verifier', 'payment.receipt', 'blockchainRecord'])
            ->where('id', $id)
            ->orWhere('transaction_id', $id)
            ->first();

        if (! $transaction || ! $transaction->payment?->receipt) {
            return $this->errorResponse('Receipt not found for this transaction.', ['receipt' => ['Digital receipt does not exist.']], 404);
        }

        $user = $request->user();
        if ($user->hasRole('student') && (int) $transaction->payment->user_id !== (int) $user->id) {
            return $this->errorResponse('Forbidden.', ['authorization' => ['You can only view your own digital receipts.']], 403);
        }

        $receipt = $transaction->payment->receipt->load(['payment.user', 'payment.fee', 'payment.verifier', 'payment.transaction.blockchainRecord']);

        return $this->successResponse(
            (new ReceiptResource($receipt))->resolve($request),
            'Transaction digital receipt retrieved successfully'
        );
    }
}
