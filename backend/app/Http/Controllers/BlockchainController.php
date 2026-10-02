<?php

namespace App\Http\Controllers;

use App\Models\BlockchainRecord;
use App\Models\Transaction;
use App\Services\BlockchainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlockchainController extends Controller
{
    public function __construct(
        protected BlockchainService $blockchainService
    ) {}

    /**
     * GET /api/blockchain/network
     */
    public function network(): JsonResponse
    {
        $status = $this->blockchainService->getNetworkStatus();

        if (! ($status['reachable'] ?? false)) {
            return $this->errorResponse(
                'Blockchain service is currently unavailable.',
                ['blockchain' => [$status['message'] ?? 'Service unreachable']],
                503
            );
        }

        return $this->successResponse($status['data'] ?? [], 'Blockchain network status retrieved');
    }

    /**
     * POST /api/blockchain/transactions
     * Safe retry or manual submission of a transaction's record hash to the blockchain.
     */
    public function submit(Request $request): JsonResponse
    {
        $txIdentifier = $request->input('transaction_id');
        if (! $txIdentifier) {
            return $this->errorResponse('Validation failed', ['transaction_id' => ['The transaction_id field is required.']], 422);
        }

        $transaction = Transaction::with(['payment', 'blockchainRecord'])
            ->where('transaction_id', $txIdentifier)
            ->orWhere('id', $txIdentifier)
            ->first();

        if (! $transaction) {
            return $this->errorResponse('Transaction not found.', ['transaction' => ['Transaction does not exist.']], 404);
        }

        $record = $this->blockchainService->submitTransaction($transaction, $request->user()?->id);

        if ($record->status === 'failed') {
            return $this->errorResponse(
                'Blockchain submission failed; transaction record preserved for retry.',
                [
                    'blockchain' => [$record->error_message ?? 'Unable to record transaction on blockchain.'],
                    'status' => $record->status,
                    'record_hash' => $record->record_hash,
                ],
                503
            );
        }

        return $this->successResponse([
            'transaction_id' => $transaction->transaction_id,
            'status' => $transaction->status,
            'blockchain' => [
                'status' => $record->status,
                'network' => $record->network,
                'transaction_hash' => $record->blockchain_transaction_hash,
                'record_hash' => $record->record_hash,
                'contract_address' => $record->contract_address,
                'block_number' => $record->block_number,
                'confirmed_at' => $record->confirmed_at?->toIso8601String(),
            ],
        ], 'Transaction submitted to blockchain service');
    }

    /**
     * POST /api/blockchain/verify
     */
    public function verify(Request $request): JsonResponse
    {
        $txIdentifier = $request->input('transaction_id');
        if (! $txIdentifier) {
            return $this->errorResponse('Validation failed', ['transaction_id' => ['The transaction_id field is required.']], 422);
        }

        $transaction = Transaction::with(['payment', 'blockchainRecord'])
            ->where('transaction_id', $txIdentifier)
            ->orWhere('id', $txIdentifier)
            ->first();

        if (! $transaction) {
            return $this->errorResponse('Transaction not found.', ['transaction' => ['Transaction does not exist.']], 404);
        }

        $result = $this->blockchainService->verifyTransaction($transaction);

        if ($result['service_unavailable'] ?? false) {
            return $this->errorResponse(
                'Blockchain verification service is currently unavailable.',
                ['blockchain' => [$result['error'] ?? 'Service unreachable']],
                503
            );
        }

        return $this->successResponse($result, 'Blockchain verification completed');
    }

    /**
     * GET /api/blockchain/transactions/{hash}
     */
    public function showByHash(string $hash): JsonResponse
    {
        $record = BlockchainRecord::with('transaction')
            ->where('blockchain_transaction_hash', $hash)
            ->orWhere('record_hash', $hash)
            ->first();

        if (! $record) {
            return $this->errorResponse('Blockchain record not found.', ['blockchain' => ['No matching blockchain record found.']], 404);
        }

        return $this->successResponse([
            'transaction_id' => $record->transaction?->transaction_id,
            'network' => $record->network,
            'contract_address' => $record->contract_address,
            'transaction_hash' => $record->blockchain_transaction_hash,
            'record_hash' => $record->record_hash,
            'block_number' => $record->block_number,
            'status' => $record->status,
            'confirmed_at' => $record->confirmed_at?->toIso8601String(),
            'error_message' => $record->error_message,
        ], 'Blockchain record retrieved successfully');
    }
}
