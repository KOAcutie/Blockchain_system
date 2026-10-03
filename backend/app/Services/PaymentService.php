<?php

namespace App\Services;

use App\Models\Fee;
use App\Models\FeeAssignment;
use App\Models\Payment;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        protected ReceiptService $receiptService,
        protected BlockchainService $blockchainService,
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Record a student payment, create its application Transaction and Receipt,
     * and initialize its pending BlockchainRecord.
     */
    public function recordPayment(User $student, array $data, ?UploadedFile $proofFile = null): Payment
    {
        $fee = Fee::find($data['fee_id'] ?? null);
        if (! $fee || $fee->status !== 'active') {
            throw ValidationException::withMessages([
                'fee_id' => ['The selected SSC fee is invalid or not currently open for payment.'],
            ]);
        }

        // Verify or auto-create fee assignment for the student
        $assignment = FeeAssignment::where('fee_id', $fee->id)
            ->where('user_id', $student->id)
            ->first();

        if (! $assignment) {
            $assignment = FeeAssignment::firstOrCreate([
                'fee_id' => $fee->id,
                'user_id' => $student->id,
            ], [
                'status' => 'unpaid',
            ]);
        }

        // Verify amount matches the assessed fee; default to expected fee amount if omitted or zero
        $submittedAmount = round((float) ($data['amount'] ?? 0), 2);
        $expectedAmount = round((float) $fee->amount, 2);
        if ($submittedAmount <= 0) {
            $submittedAmount = $expectedAmount;
        } elseif (abs($submittedAmount - $expectedAmount) > 0.01) {
            throw ValidationException::withMessages([
                'amount' => [sprintf('Payment amount (%.2f) must match the assessed fee amount (%.2f).', $submittedAmount, $expectedAmount)],
            ]);
        }

        // Prevent duplicate pending/confirmed/completed payments for the same fee
        $duplicate = Payment::where('user_id', $student->id)
            ->where('fee_id', $fee->id)
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'fee_id' => [sprintf('A payment for "%s" has already been recorded and is currently %s.', $fee->name, 'in verification')],
            ]);
        }

        // Also check duplicate reference_number across active payments
        $duplicateRef = Payment::where('reference_number', $data['reference_number'])
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->where('user_id', '!=', $student->id)
            ->exists();

        if ($duplicateRef) {
            throw ValidationException::withMessages([
                'reference_number' => ['This payment reference number has already been recorded in the system.'],
            ]);
        }

        $proofPath = null;
        if ($proofFile) {
            $proofPath = $proofFile->store('payment_proofs', 'local');
        }

        return DB::transaction(function () use ($student, $fee, $assignment, $data, $submittedAmount, $proofPath) {
            $payment = Payment::create([
                'user_id' => $student->id,
                'fee_id' => $fee->id,
                'amount' => $submittedAmount,
                'payment_method' => $data['payment_method'],
                'reference_number' => $data['reference_number'],
                'proof_path' => $proofPath,
                'notes' => $data['notes'] ?? null,
                'status' => 'pending',
                'recorded_at' => now(),
            ]);

            $transactionId = $this->generateUniqueTransactionId();

            $transaction = Transaction::create([
                'payment_id' => $payment->id,
                'transaction_id' => $transactionId,
                'amount' => $submittedAmount,
                'status' => 'pending',
                'confirmed_at' => null,
            ]);

            $this->receiptService->createForPayment($payment);
            $this->blockchainService->ensurePendingRecord($transaction);

            $assignment->update([
                'status' => 'pending_verification',
            ]);

            $this->auditLogService->log(
                'payment_recorded',
                "Student {$student->email} recorded payment {$payment->reference_number} ({$transaction->transaction_id})",
                $student->id,
                'Payment',
                $payment->id,
                [
                    'transaction_id' => $transaction->transaction_id,
                    'fee_id' => $fee->id,
                    'amount' => $submittedAmount,
                    'payment_method' => $payment->payment_method,
                ]
            );

            return $payment->load(['user', 'fee', 'transaction.blockchainRecord', 'receipt']);
        });
    }

    /**
     * Verify a student payment as an SSC officer/admin, confirm the transaction,
     * and submit the deterministic record hash to the Python Blockchain API.
     */
    public function verifyPayment(Payment $payment, User $officer): Payment
    {
        if (in_array($payment->status, ['rejected', 'failed'], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot verify a payment with status '{$payment->status}'."],
            ]);
        }

        $transaction = DB::transaction(function () use ($payment, $officer) {
            $now = now();

            $payment->update([
                'status' => 'confirmed',
                'verified_at' => $payment->verified_at ?? $now,
                'verified_by' => $payment->verified_by ?? $officer->id,
            ]);

            $transaction = $payment->transaction;
            if (! $transaction) {
                $transaction = Transaction::create([
                    'payment_id' => $payment->id,
                    'transaction_id' => $this->generateUniqueTransactionId(),
                    'amount' => $payment->amount,
                    'status' => 'confirmed',
                    'confirmed_at' => $now,
                ]);
            } else {
                $transaction->update([
                    'status' => 'confirmed',
                    'confirmed_at' => $transaction->confirmed_at ?? $now,
                ]);
            }

            $this->receiptService->createForPayment($payment);

            FeeAssignment::where('fee_id', $payment->fee_id)
                ->where('user_id', $payment->user_id)
                ->update(['status' => 'paid']);

            $this->auditLogService->log(
                'payment_verified',
                "Officer {$officer->email} verified payment #{$payment->id} ({$transaction->transaction_id})",
                $officer->id,
                'Payment',
                $payment->id,
                ['transaction_id' => $transaction->transaction_id]
            );

            return $transaction;
        });

        // Submit to Python blockchain service OUTSIDE the DB transaction so blockchain failure
        // never rolls back the confirmed payment or transaction record.
        $this->blockchainService->submitTransaction($transaction, $officer->id);

        return $payment->fresh(['user', 'fee', 'verifier', 'transaction.blockchainRecord', 'receipt']);
    }

    /**
     * Reject a pending payment as an SSC officer/admin.
     */
    public function rejectPayment(Payment $payment, User $officer, ?string $reason = null): Payment
    {
        if (in_array($payment->status, ['confirmed', 'completed'], true)) {
            throw ValidationException::withMessages([
                'status' => ['A confirmed payment cannot be rejected.'],
            ]);
        }

        return DB::transaction(function () use ($payment, $officer, $reason) {
            $payment->update([
                'status' => 'rejected',
                'rejection_reason' => $reason ?? 'Payment reference or proof could not be verified.',
                'verified_at' => now(),
                'verified_by' => $officer->id,
            ]);

            if ($payment->transaction) {
                $payment->transaction->update([
                    'status' => 'rejected',
                ]);
            }

            if ($payment->receipt) {
                $payment->receipt->update([
                    'status' => 'voided',
                ]);
            }

            FeeAssignment::where('fee_id', $payment->fee_id)
                ->where('user_id', $payment->user_id)
                ->update(['status' => 'unpaid']);

            $this->auditLogService->log(
                'payment_rejected',
                "Officer {$officer->email} rejected payment #{$payment->id}",
                $officer->id,
                'Payment',
                $payment->id,
                ['reason' => $payment->rejection_reason]
            );

            return $payment->fresh(['user', 'fee', 'verifier', 'transaction.blockchainRecord', 'receipt']);
        });
    }

    public function generateUniqueTransactionId(): string
    {
        $year = now()->format('Y');
        $sequence = Transaction::count() + 1;

        do {
            $txId = sprintf('SSC-%s-%06d', $year, $sequence);
            $exists = Transaction::where('transaction_id', $txId)->exists();
            $sequence++;
        } while ($exists);

        return $txId;
    }
}
