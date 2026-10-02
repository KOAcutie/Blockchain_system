<?php

namespace App\Services;

use App\Models\BlockchainRecord;
use App\Models\Transaction;
use Illuminate\Support\Facades\Http;
use Throwable;

class BlockchainService
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Generate a deterministic SHA-256 record hash from canonical transaction data.
     * Never includes student name, email, raw student ID, password, or private documents.
     */
    public function generateRecordHash(Transaction $transaction): string
    {
        $transaction->loadMissing('payment');
        $payment = $transaction->payment;

        $studentReference = hash('sha256', 'ssc-student-ref:' . ($payment?->user_id ?? 0));
        $timestampIso = ($transaction->confirmed_at ?? $transaction->created_at ?? now())
            ->copy()
            ->utc()
            ->format('Y-m-d\TH:i:s\Z');

        $canonical = [
            'amount' => number_format((float) $transaction->amount, 2, '.', ''),
            'fee_id' => (int) ($payment?->fee_id ?? 0),
            'student_ref' => $studentReference,
            'timestamp' => $timestampIso,
            'transaction_id' => (string) $transaction->transaction_id,
        ];

        ksort($canonical);
        $json = json_encode($canonical, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return '0x' . hash('sha256', (string) $json);
    }

    /**
     * Ensure a pending blockchain record exists for the transaction.
     */
    public function ensurePendingRecord(Transaction $transaction): BlockchainRecord
    {
        $existing = BlockchainRecord::where('transaction_id', $transaction->id)->first();
        if ($existing) {
            return $existing;
        }

        return BlockchainRecord::create([
            'transaction_id' => $transaction->id,
            'network' => config('services.blockchain.network', 'localhost'),
            'contract_address' => null,
            'blockchain_transaction_hash' => null,
            'block_number' => null,
            'record_hash' => $this->generateRecordHash($transaction),
            'status' => 'pending',
            'confirmed_at' => null,
            'error_message' => null,
        ]);
    }

    /**
     * Submit or retry a verified transaction to the Python FastAPI Blockchain Service.
     * Preserves transaction and payment records if the blockchain service is unreachable or fails.
     */
    public function submitTransaction(Transaction $transaction, ?int $actorUserId = null): BlockchainRecord
    {
        $transaction->loadMissing('payment');
        $record = BlockchainRecord::where('transaction_id', $transaction->id)->first();

        // Idempotency: if already confirmed on-chain, return without duplicate submission
        if ($record && $record->status === 'confirmed' && $record->blockchain_transaction_hash) {
            return $record;
        }

        $recordHash = $record?->record_hash ?: $this->generateRecordHash($transaction);

        if (! $record) {
            $record = BlockchainRecord::create([
                'transaction_id' => $transaction->id,
                'network' => config('services.blockchain.network', 'localhost'),
                'record_hash' => $recordHash,
                'status' => 'pending',
            ]);
        } else {
            $record->update([
                'record_hash' => $recordHash,
                'error_message' => null,
            ]);
        }

        $timestampIso = ($transaction->confirmed_at ?? $transaction->created_at ?? now())
            ->copy()
            ->utc()
            ->format('Y-m-d\TH:i:s\Z');

        $payload = [
            'transaction_id' => $transaction->transaction_id,
            'record_hash' => $recordHash,
            'amount' => (int) round(((float) $transaction->amount) * 100), // centavos integer for uint256
            'timestamp' => $timestampIso,
        ];

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'X-Service-Key' => (string) config('services.blockchain.key'),
                    'Accept' => 'application/json',
                ])
                ->post(rtrim((string) config('services.blockchain.url'), '/') . '/api/blockchain/transactions', $payload);

            if (! $response->successful()) {
                $errorMsg = $response->json('detail')
                    ?? $response->json('message')
                    ?? ('Python blockchain service returned HTTP ' . $response->status());

                $record->update([
                    'status' => 'failed',
                    'error_message' => is_string($errorMsg) ? $errorMsg : json_encode($errorMsg),
                ]);

                $this->auditLogService->log(
                    'blockchain_failed',
                    "Blockchain submission failed for {$transaction->transaction_id}",
                    $actorUserId,
                    'Transaction',
                    $transaction->id,
                    ['transaction_id' => $transaction->transaction_id, 'error' => $record->error_message]
                );

                return $record->fresh();
            }

            $body = $response->json();
            $txHash = $body['transaction_hash'] ?? ($body['data']['transaction_hash'] ?? null);
            $contractAddress = $body['contract_address'] ?? ($body['data']['contract_address'] ?? null);
            $network = $body['network'] ?? ($body['data']['network'] ?? 'localhost');
            $blockNumber = $body['block_number'] ?? ($body['data']['block_number'] ?? null);
            $remoteStatus = $body['status'] ?? ($body['data']['status'] ?? 'submitted');

            // Step 1: mark as submitted when Python submits transaction
            $record->update([
                'network' => $network,
                'contract_address' => $contractAddress,
                'blockchain_transaction_hash' => $txHash,
                'block_number' => $blockNumber,
                'status' => 'submitted',
                'error_message' => null,
            ]);

            $this->auditLogService->log(
                'blockchain_submitted',
                "Transaction {$transaction->transaction_id} submitted to blockchain ({$txHash})",
                $actorUserId,
                'Transaction',
                $transaction->id,
                ['transaction_id' => $transaction->transaction_id, 'transaction_hash' => $txHash]
            );

            // Step 2: transition to confirmed when blockchain confirmation is present
            $isConfirmed = ($remoteStatus === 'confirmed')
                || ($body['confirmed'] ?? false)
                || ($blockNumber !== null && $txHash !== null);

            if ($isConfirmed) {
                $record->update([
                    'status' => 'confirmed',
                    'confirmed_at' => now(),
                ]);

                $this->auditLogService->log(
                    'blockchain_confirmed',
                    "Blockchain confirmation recorded for {$transaction->transaction_id} at block #{$blockNumber}",
                    $actorUserId,
                    'Transaction',
                    $transaction->id,
                    [
                        'transaction_id' => $transaction->transaction_id,
                        'transaction_hash' => $txHash,
                        'block_number' => $blockNumber,
                    ]
                );
            }

            return $record->fresh();
        } catch (Throwable $e) {
            $record->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            $this->auditLogService->log(
                'blockchain_failed',
                "Blockchain service unreachable for {$transaction->transaction_id}",
                $actorUserId,
                'Transaction',
                $transaction->id,
                ['transaction_id' => $transaction->transaction_id, 'error' => $e->getMessage()]
            );

            return $record->fresh();
        }
    }

    /**
     * Verify a transaction's record hash against the smart contract via the Python service.
     */
    public function verifyTransaction(Transaction $transaction): array
    {
        $transaction->loadMissing('blockchainRecord');
        $record = $transaction->blockchainRecord;

        $expectedHash = $record?->record_hash ?: $this->generateRecordHash($transaction);

        try {
            $response = Http::timeout(8)
                ->withHeaders([
                    'X-Service-Key' => (string) config('services.blockchain.key'),
                    'Accept' => 'application/json',
                ])
                ->post(rtrim((string) config('services.blockchain.url'), '/') . '/api/blockchain/verify', [
                    'transaction_id' => $transaction->transaction_id,
                    'record_hash' => $expectedHash,
                    'transaction_hash' => $record?->blockchain_transaction_hash,
                ]);

            if (! $response->successful()) {
                return [
                    'verified' => false,
                    'record_hash_matches' => false,
                    'transaction_confirmed' => $record?->status === 'confirmed',
                    'block_number' => $record?->block_number,
                    'transaction_hash' => $record?->blockchain_transaction_hash,
                    'record_hash' => $expectedHash,
                    'contract_address' => $record?->contract_address,
                    'status' => $record?->status ?? 'pending',
                    'error' => 'Blockchain verification service returned HTTP ' . $response->status(),
                ];
            }

            $data = $response->json();
            $verified = (bool) ($data['verified'] ?? false);
            $matches = (bool) ($data['record_hash_matches'] ?? false);
            $confirmed = (bool) ($data['transaction_confirmed'] ?? false);
            $blockNumber = $data['block_number'] ?? $record?->block_number;
            $txHash = $data['transaction_hash'] ?? $record?->blockchain_transaction_hash;
            $contractAddress = $data['contract_address'] ?? $record?->contract_address;

            if ($record && $verified && $matches && $confirmed && $record->status !== 'confirmed') {
                $record->update([
                    'status' => 'confirmed',
                    'block_number' => $blockNumber,
                    'blockchain_transaction_hash' => $txHash,
                    'contract_address' => $contractAddress,
                    'confirmed_at' => $record->confirmed_at ?? now(),
                    'error_message' => null,
                ]);
            }

            return [
                'verified' => $verified,
                'record_hash_matches' => $matches,
                'transaction_confirmed' => $confirmed,
                'block_number' => $blockNumber,
                'transaction_hash' => $txHash,
                'record_hash' => $expectedHash,
                'contract_address' => $contractAddress,
                'status' => $verified ? 'confirmed' : ($record?->status ?? 'pending'),
            ];
        } catch (Throwable $e) {
            return [
                'verified' => false,
                'record_hash_matches' => false,
                'transaction_confirmed' => false,
                'block_number' => $record?->block_number,
                'transaction_hash' => $record?->blockchain_transaction_hash,
                'record_hash' => $expectedHash,
                'contract_address' => $record?->contract_address,
                'status' => $record?->status ?? 'pending',
                'service_unavailable' => true,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Query network & smart contract health from Python service.
     */
    public function getNetworkStatus(): array
    {
        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'X-Service-Key' => (string) config('services.blockchain.key'),
                    'Accept' => 'application/json',
                ])
                ->get(rtrim((string) config('services.blockchain.url'), '/') . '/api/blockchain/network');

            if ($response->successful()) {
                return [
                    'reachable' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'reachable' => false,
                'status_code' => $response->status(),
                'message' => 'Python blockchain service returned an error.',
            ];
        } catch (Throwable $e) {
            return [
                'reachable' => false,
                'message' => 'Python blockchain service is currently unavailable.',
            ];
        }
    }
}
