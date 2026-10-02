<?php

namespace App\Http\Controllers;

use App\Http\Requests\FundUsageRequest;
use App\Http\Resources\FundUsageResource;
use App\Models\FundUsageRecord;
use App\Models\TransparencyRecord;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FundUsageController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    /**
     * GET /api/officer/funds
     */
    public function index(Request $request): JsonResponse
    {
        $query = FundUsageRecord::query()->orderByDesc('date')->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        $records = $query->get();

        return $this->successResponse(
            FundUsageResource::collection($records)->resolve($request),
            'Fund usage records retrieved successfully'
        );
    }

    /**
     * POST /api/officer/funds
     */
    public function store(FundUsageRequest $request): JsonResponse
    {
        $user = $request->user();
        $status = $request->input('status', 'draft');
        $publishedAt = $status === 'published' ? now() : null;

        $canonical = json_encode([
            'approval_reference' => $request->input('approval_reference'),
            'amount' => number_format((float) $request->input('amount'), 2, '.', ''),
            'category' => $request->input('category'),
            'date' => $request->input('date'),
            'purpose' => $request->input('purpose'),
        ]);
        $recordHash = '0x' . hash('sha256', (string) $canonical);

        $record = FundUsageRecord::create([
            'purpose' => $request->input('purpose'),
            'description' => $request->input('description'),
            'category' => $request->input('category'),
            'amount' => $request->input('amount'),
            'approved_budget' => $request->input('approved_budget', $request->input('amount')),
            'date' => $request->input('date'),
            'approval_reference' => $request->input('approval_reference'),
            'committee' => $request->input('committee', 'SSC Finance & Audit Committee'),
            'beneficiaries' => $request->input('beneficiaries', 'University Student Body'),
            'notes' => $request->input('notes'),
            'status' => $status,
            'created_by' => $user->id,
            'published_at' => $publishedAt,
            'record_hash' => $recordHash,
        ]);

        if ($status === 'published') {
            $this->syncTransparencyRecord($record, $user->id);
        }

        $this->auditLogService->log(
            'fund_usage_created',
            "Officer {$user->email} recorded fund usage '{$record->purpose}'",
            $user->id,
            'FundUsageRecord',
            $record->id,
            ['amount' => (float) $record->amount, 'status' => $record->status],
            $request
        );

        return $this->successResponse(
            (new FundUsageResource($record))->resolve($request),
            'Fund usage record created successfully',
            201
        );
    }

    /**
     * GET /api/officer/funds/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $record = FundUsageRecord::find($id);
        if (! $record) {
            return $this->errorResponse('Fund usage record not found.', ['fund' => ['Record does not exist.']], 404);
        }

        return $this->successResponse(
            (new FundUsageResource($record))->resolve($request),
            'Fund usage record retrieved successfully'
        );
    }

    /**
     * PUT /api/officer/funds/{id}
     */
    public function update(FundUsageRequest $request, int $id): JsonResponse
    {
        $record = FundUsageRecord::find($id);
        if (! $record) {
            return $this->errorResponse('Fund usage record not found.', ['fund' => ['Record does not exist.']], 404);
        }

        $record->update($request->only([
            'purpose',
            'description',
            'category',
            'amount',
            'approved_budget',
            'date',
            'approval_reference',
            'committee',
            'beneficiaries',
            'notes',
            'status',
        ]));

        if ($record->status === 'published' && ! $record->published_at) {
            $record->update(['published_at' => now()]);
            $this->syncTransparencyRecord($record, $request->user()->id);
        }

        $this->auditLogService->log(
            'fund_usage_updated',
            "Officer {$request->user()->email} updated fund usage '{$record->purpose}'",
            $request->user()->id,
            'FundUsageRecord',
            $record->id,
            ['amount' => (float) $record->amount, 'status' => $record->status],
            $request
        );

        return $this->successResponse(
            (new FundUsageResource($record->fresh()))->resolve($request),
            'Fund usage record updated successfully'
        );
    }

    /**
     * POST /api/officer/funds/{id}/publish
     */
    public function publish(Request $request, int $id): JsonResponse
    {
        $record = FundUsageRecord::find($id);
        if (! $record) {
            return $this->errorResponse('Fund usage record not found.', ['fund' => ['Record does not exist.']], 404);
        }

        $canonical = json_encode([
            'approval_reference' => $record->approval_reference,
            'amount' => number_format((float) $record->amount, 2, '.', ''),
            'category' => $record->category,
            'date' => $record->date?->format('Y-m-d'),
            'purpose' => $record->purpose,
        ]);

        $record->update([
            'status' => 'published',
            'published_at' => $record->published_at ?? now(),
            'record_hash' => $record->record_hash ?: ('0x' . hash('sha256', (string) $canonical)),
        ]);

        $this->syncTransparencyRecord($record, $request->user()->id);

        $this->auditLogService->log(
            'fund_usage_published',
            "Officer {$request->user()->email} published fund usage '{$record->purpose}' to Transparency Portal",
            $request->user()->id,
            'FundUsageRecord',
            $record->id,
            ['approval_reference' => $record->approval_reference, 'amount' => (float) $record->amount],
            $request
        );

        return $this->successResponse(
            (new FundUsageResource($record->fresh()))->resolve($request),
            'Fund usage record published to public transparency portal'
        );
    }

    protected function syncTransparencyRecord(FundUsageRecord $record, int $userId): TransparencyRecord
    {
        return TransparencyRecord::updateOrCreate(
            ['fund_usage_record_id' => $record->id],
            [
                'title' => $record->purpose,
                'record_type' => 'fund_usage',
                'reference_code' => sprintf('SSC-TRN-%s-%04d', now()->format('Y'), $record->id),
                'period' => '1st Semester, AY 2026–2027',
                'total_amount' => $record->amount,
                'record_hash' => $record->record_hash,
                'status' => 'published',
                'published_by' => $userId,
                'published_at' => $record->published_at ?? now(),
                'summary_payload' => [
                    'category' => $record->category,
                    'approval_reference' => $record->approval_reference,
                    'committee' => $record->committee,
                    'beneficiaries' => $record->beneficiaries,
                ],
            ]
        );
    }
}
