<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReceiptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $payment = $this->payment;
        $student = $payment?->user;
        $fee = $payment?->fee;
        $transaction = $payment?->transaction;
        $bc = $transaction?->blockchainRecord;

        return [
            'id' => $this->id,
            'receipt_number' => $this->receipt_number,
            'issued_at' => $this->issued_at?->toIso8601String(),
            'status' => $this->status,
            'payment_id' => $this->payment_id,
            'payment_status' => $payment?->status ?? 'pending',
            'payment_method' => $payment?->payment_method,
            'reference_number' => $payment?->reference_number,
            'amount' => (float) ($payment?->amount ?? 0),
            'date' => ($payment?->recorded_at ?? $this->issued_at)?->toIso8601String(),
            'student' => $student ? [
                'name' => $student->name,
                'student_id' => $student->student_id,
                'college' => $student->college ?? 'CCIS',
                'program' => $student->program ?? 'BS Computer Science',
            ] : null,
            'fee' => $fee ? [
                'id' => $fee->id,
                'code' => $fee->code,
                'name' => $fee->name,
                'purpose' => $fee->purpose,
                'semester' => $fee->semester,
                'academic_year' => $fee->academic_year,
            ] : null,
            'transaction_id' => $transaction?->transaction_id,
            'transaction_db_id' => $transaction?->id,
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
