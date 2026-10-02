<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $tx = $this->whenLoaded('transaction', fn () => $this->transaction, $this->transaction);
        $bc = $tx?->blockchainRecord;
        $receipt = $this->whenLoaded('receipt', fn () => $this->receipt, $this->receipt);

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'student' => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'student_id' => $this->user->student_id,
                'college' => $this->user->college ?? 'CCIS',
            ] : null,
            'fee_id' => $this->fee_id,
            'fee' => $this->fee ? [
                'id' => $this->fee->id,
                'code' => $this->fee->code,
                'name' => $this->fee->name,
                'purpose' => $this->fee->purpose,
                'amount' => (float) $this->fee->amount,
            ] : null,
            'amount' => (float) $this->amount,
            'payment_method' => $this->payment_method,
            'reference_number' => $this->reference_number,
            'has_proof' => ! empty($this->proof_path),
            'proof_url' => ! empty($this->proof_path)
                ? url("/api/officer/payments/{$this->id}/proof")
                : null,
            'notes' => $this->notes,
            'rejection_reason' => $this->rejection_reason,
            'status' => $this->status,
            'recorded_at' => $this->recorded_at?->toIso8601String(),
            'verified_at' => $this->verified_at?->toIso8601String(),
            'verified_by' => $this->verifier?->name,
            'transaction_id' => $tx?->transaction_id,
            'transaction_db_id' => $tx?->id,
            'receipt_id' => $receipt?->id,
            'receipt_number' => $receipt?->receipt_number,
            'blockchain' => $bc ? [
                'status' => $bc->status,
                'network' => $bc->network,
                'transaction_hash' => $bc->blockchain_transaction_hash,
                'record_hash' => $bc->record_hash,
                'contract_address' => $bc->contract_address,
                'block_number' => $bc->block_number,
                'confirmed_at' => $bc->confirmed_at?->toIso8601String(),
                'error_message' => $bc->error_message,
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
