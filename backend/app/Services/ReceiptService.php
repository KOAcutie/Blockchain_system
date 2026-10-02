<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Receipt;

class ReceiptService
{
    public function createForPayment(Payment $payment): Receipt
    {
        $existing = Receipt::where('payment_id', $payment->id)->first();
        if ($existing) {
            return $existing;
        }

        $year = now()->format('Y');
        $sequence = Receipt::count() + 1;

        do {
            $receiptNumber = sprintf('SSC-RCP-%s-%06d', $year, $sequence);
            $exists = Receipt::where('receipt_number', $receiptNumber)->exists();
            $sequence++;
        } while ($exists);

        return Receipt::create([
            'payment_id' => $payment->id,
            'receipt_number' => $receiptNumber,
            'issued_at' => now(),
            'status' => 'issued',
        ]);
    }
}
