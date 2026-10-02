<?php

namespace App\Http\Controllers;

use App\Http\Resources\FundUsageResource;
use App\Http\Resources\TransactionResource;
use App\Models\BlockchainRecord;
use App\Models\Fee;
use App\Models\FundUsageRecord;
use App\Models\Payment;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * GET /api/officer/reports/summary
     */
    public function summary(Request $request): JsonResponse
    {
        $paymentsQuery = Payment::query();
        $fundsQuery = FundUsageRecord::query();

        if ($request->filled('from')) {
            $paymentsQuery->whereDate('recorded_at', '>=', $request->query('from'));
            $fundsQuery->whereDate('date', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $paymentsQuery->whereDate('recorded_at', '<=', $request->query('to'));
            $fundsQuery->whereDate('date', '<=', $request->query('to'));
        }
        if ($request->filled('fee_id')) {
            $paymentsQuery->where('fee_id', $request->query('fee_id'));
        }
        if ($request->filled('category')) {
            $fundsQuery->where('category', $request->query('category'));
        }

        $confirmedCollections = (float) (clone $paymentsQuery)
            ->whereIn('status', ['confirmed', 'completed'])
            ->sum('amount');

        $pendingCollections = (float) (clone $paymentsQuery)
            ->where('status', 'pending')
            ->sum('amount');

        $totalExpenses = (float) (clone $fundsQuery)
            ->whereIn('status', ['approved', 'published'])
            ->sum('amount');

        $confirmedTxCount = Transaction::where('status', 'confirmed')->count();
        $blockchainConfirmedCount = BlockchainRecord::where('status', 'confirmed')->count();
        $blockchainPendingCount = BlockchainRecord::whereIn('status', ['pending', 'submitted'])->count();
        $blockchainFailedCount = BlockchainRecord::where('status', 'failed')->count();

        return $this->successResponse([
            'total_collections' => round($confirmedCollections, 2),
            'pending_collections' => round($pendingCollections, 2),
            'total_expenses' => round($totalExpenses, 2),
            'net_balance' => round($confirmedCollections - $totalExpenses, 2),
            'confirmed_transactions_count' => $confirmedTxCount,
            'blockchain_metrics' => [
                'confirmed' => $blockchainConfirmedCount,
                'pending' => $blockchainPendingCount,
                'failed' => $blockchainFailedCount,
            ],
        ], 'Officer report summary retrieved successfully');
    }

    /**
     * GET /api/officer/reports/collections
     */
    public function collections(Request $request): JsonResponse
    {
        $feesQuery = Fee::query();
        if ($request->filled('fee_id')) {
            $feesQuery->where('id', $request->query('fee_id'));
        }
        if ($request->filled('category')) {
            $feesQuery->where('category', $request->query('category'));
        }

        $fees = $feesQuery->get();

        $breakdown = $fees->map(function (Fee $fee) use ($request) {
            $payments = Payment::where('fee_id', $fee->id);

            if ($request->filled('from')) {
                $payments->whereDate('recorded_at', '>=', $request->query('from'));
            }
            if ($request->filled('to')) {
                $payments->whereDate('recorded_at', '<=', $request->query('to'));
            }
            if ($request->filled('status')) {
                $payments->where('status', $request->query('status'));
            } else {
                $payments->whereIn('status', ['confirmed', 'completed']);
            }

            $collectedAmount = (float) $payments->sum('amount');
            $paymentsCount = (int) $payments->count();
            $assignedStudents = (int) $fee->assignments()->count();
            $targetAmount = round(((float) $fee->amount) * max($assignedStudents, 1), 2);

            return [
                'fee_id' => $fee->id,
                'code' => $fee->code,
                'name' => $fee->name,
                'category' => $fee->category,
                'unit_amount' => (float) $fee->amount,
                'payments_count' => $paymentsCount,
                'assigned_students' => $assignedStudents,
                'collected_amount' => round($collectedAmount, 2),
                'target_amount' => $targetAmount,
                'collection_rate' => $targetAmount > 0 ? round(($collectedAmount / $targetAmount) * 100, 1) : 0,
            ];
        })->values();

        return $this->successResponse([
            'filters' => $request->only(['from', 'to', 'status', 'fee_id', 'category']),
            'total_collected' => round((float) $breakdown->sum('collected_amount'), 2),
            'items' => $breakdown,
        ], 'Officer collections report retrieved successfully');
    }

    /**
     * GET /api/officer/reports/transactions
     */
    public function transactions(Request $request): JsonResponse
    {
        $query = Transaction::with(['payment.user', 'payment.fee', 'payment.verifier', 'payment.receipt', 'blockchainRecord'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('fee_id')) {
            $query->whereHas('payment', fn ($q) => $q->where('fee_id', $request->query('fee_id')));
        }
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->query('to'));
        }

        $transactions = $query->get();

        return $this->successResponse([
            'filters' => $request->only(['from', 'to', 'status', 'fee_id']),
            'count' => $transactions->count(),
            'total_amount' => round((float) $transactions->sum('amount'), 2),
            'items' => TransactionResource::collection($transactions)->resolve($request),
        ], 'Officer transactions report retrieved successfully');
    }

    /**
     * GET /api/officer/reports/funds
     */
    public function funds(Request $request): JsonResponse
    {
        $query = FundUsageRecord::query()->orderByDesc('date');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }
        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->query('to'));
        }

        $records = $query->get();

        $byCategory = $records->groupBy('category')->map(fn ($group, $cat) => [
            'category' => $cat,
            'count' => $group->count(),
            'total_amount' => round((float) $group->sum('amount'), 2),
            'approved_budget' => round((float) $group->sum('approved_budget'), 2),
        ])->values();

        return $this->successResponse([
            'filters' => $request->only(['from', 'to', 'status', 'category']),
            'count' => $records->count(),
            'total_amount' => round((float) $records->sum('amount'), 2),
            'by_category' => $byCategory,
            'items' => FundUsageResource::collection($records)->resolve($request),
        ], 'Officer fund usage report retrieved successfully');
    }
}
