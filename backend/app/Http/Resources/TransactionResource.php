<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $payment = $this->payment;
        $user = $payment?->user;
        $fee = $payment?->fee;
        $receipt = $payment?->receipt;
        $bc = $this->blockchainRecord;

        return [
            'id' => $this->id,
            'transaction_id' => $this->transaction_id,
            'payment_id' => $this->payment_id,
            'amount' => (float) $this->amount,
            'status' => $this->status,
            'payment_status' => $payment?->status ?? $this->status,
            'payment_method' => $payment?->payment_method,
            'reference_number' => $payment?->reference_number,
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'student' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'student_id' => $user->student_id,
                'college' => $user->college ?? 'CCIS',
            ] : null,
            'fee' => $fee ? [
                'id' => $fee->id,
                'code' => $fee->code,
                'name' => $fee->name,
                'purpose' => $fee->purpose,
                'amount' => (float) $fee->amount,
            ] : null,
            'receipt' => $receipt ? [
                'id' => $receipt->id,
                'receipt_number' => $receipt->receipt_number,
                'issued_at' => $receipt->issued_at?->toIso8601String(),
                'status' => $receipt->status,
            ] : null,
            'verified_by' => $payment?->verifier?->name,
            'blockchain' => [
                'status' => $bc?->status ?? 'pending',
                'verification_label' => match ($bc?->status) {
                    'confirmed' => 'Verified',
                    'failed' => 'Failed',
                    default => 'Pending',
                },
                'network' => $bc?->network ?? 'localhost',
                'transaction_hash' => $bc?->blockchain_transaction_hash,
                'record_hash' => $bc?->record_hash,
                'contract_address' => $bc?->contract_address,
                'block_number' => $bc?->block_number,
                'confirmed_at' => $bc?->confirmed_at?->toIso8601String(),
                'error_message' => $bc?->error_message,
            ],
        ];
    }
}
