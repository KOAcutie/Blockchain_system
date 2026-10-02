<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * GET /api/student/payments
     */
    public function studentIndex(Request $request): JsonResponse
    {
        $payments = Payment::with(['user', 'fee', 'verifier', 'transaction.blockchainRecord', 'receipt'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('recorded_at')
            ->get();

        return $this->successResponse(
            PaymentResource::collection($payments)->resolve($request),
            'Student payments retrieved successfully'
        );
    }

    /**
     * GET /api/student/payments/{id}
     */
    public function studentShow(Request $request, int $id): JsonResponse
    {
        $payment = Payment::with(['user', 'fee', 'verifier', 'transaction.blockchainRecord', 'receipt'])
            ->find($id);

        if (! $payment) {
            return $this->errorResponse('Payment not found.', ['payment' => ['Payment record does not exist.']], 404);
        }

        if ((int) $payment->user_id !== (int) $request->user()->id) {
            return $this->errorResponse('Forbidden.', ['authorization' => ['You can only view your own payment records.']], 403);
        }

        return $this->successResponse(
            (new PaymentResource($payment))->resolve($request),
            'Payment details retrieved successfully'
        );
    }

    /**
     * POST /api/student/payments
     */
    public function store(PaymentRequest $request): JsonResponse
    {
        $payment = $this->paymentService->recordPayment(
            $request->user(),
            $request->validated(),
            $request->file('proof')
        );

        return $this->successResponse(
            (new PaymentResource($payment))->resolve($request),
            'Payment recorded successfully and queued for SSC verification',
            201
        );
    }

    /**
     * GET /api/officer/payments
     */
    public function officerIndex(Request $request): JsonResponse
    {
        $query = Payment::with(['user', 'fee', 'verifier', 'transaction.blockchainRecord', 'receipt'])
            ->orderByDesc('recorded_at');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('fee_id')) {
            $query->where('fee_id', $request->query('fee_id'));
        }

        $payments = $query->get();

        return $this->successResponse(
            PaymentResource::collection($payments)->resolve($request),
            'Officer payment queue retrieved successfully'
        );
    }

    /**
     * GET /api/officer/payments/{id}
     */
    public function officerShow(Request $request, int $id): JsonResponse
    {
        $payment = Payment::with(['user', 'fee', 'verifier', 'transaction.blockchainRecord', 'receipt'])
            ->find($id);

        if (! $payment) {
            return $this->errorResponse('Payment not found.', ['payment' => ['Payment record does not exist.']], 404);
        }

        return $this->successResponse(
            (new PaymentResource($payment))->resolve($request),
            'Officer payment details retrieved successfully'
        );
    }

    /**
     * POST /api/officer/payments/{id}/verify
     */
    public function verify(Request $request, int $id): JsonResponse
    {
        $payment = Payment::with(['user', 'fee', 'transaction.blockchainRecord', 'receipt'])->find($id);

        if (! $payment) {
            return $this->errorResponse('Payment not found.', ['payment' => ['Payment record does not exist.']], 404);
        }

        $verifiedPayment = $this->paymentService->verifyPayment($payment, $request->user());
        $tx = $verifiedPayment->transaction;
        $bc = $tx?->blockchainRecord;

        return $this->successResponse([
            'payment' => (new PaymentResource($verifiedPayment))->resolve($request),
            'transaction_id' => $tx?->transaction_id,
            'status' => $tx?->status ?? 'confirmed',
            'blockchain' => [
                'status' => $bc?->status ?? 'pending',
                'transaction_hash' => $bc?->blockchain_transaction_hash,
                'record_hash' => $bc?->record_hash,
                'contract_address' => $bc?->contract_address,
                'block_number' => $bc?->block_number,
                'error_message' => $bc?->error_message,
            ],
        ], 'Payment verified and processed for blockchain attestation');
    }

    /**
     * POST /api/officer/payments/{id}/reject
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $payment = Payment::with(['user', 'fee', 'transaction.blockchainRecord', 'receipt'])->find($id);

        if (! $payment) {
            return $this->errorResponse('Payment not found.', ['payment' => ['Payment record does not exist.']], 404);
        }

        $rejectedPayment = $this->paymentService->rejectPayment(
            $payment,
            $request->user(),
            $request->input('reason')
        );

        return $this->successResponse(
            (new PaymentResource($rejectedPayment))->resolve($request),
            'Payment rejected'
        );
    }

    /**
     * GET /api/officer/payments/{id}/proof
     * Authenticated private file viewing endpoint for authorized officers (or owning student).
     */
    public function viewProof(Request $request, int $id): StreamedResponse|JsonResponse
    {
        $payment = Payment::find($id);
        if (! $payment || ! $payment->proof_path) {
            return $this->errorResponse('Payment proof not found.', ['proof' => ['No payment proof file is attached.']], 404);
        }

        $user = $request->user();
        if (! $user->hasRole('officer', 'admin') && (int) $payment->user_id !== (int) $user->id) {
            return $this->errorResponse('Forbidden.', ['authorization' => ['Not authorized to view this payment proof.']], 403);
        }

        if (! Storage::disk('local')->exists($payment->proof_path)) {
            return $this->errorResponse('Proof file missing from private storage.', ['proof' => ['File not found.']], 404);
        }

        return Storage::disk('local')->response($payment->proof_path);
    }
}
