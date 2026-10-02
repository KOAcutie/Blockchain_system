<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateFeeRequest;
use App\Http\Resources\FeeResource;
use App\Models\Fee;
use App\Models\FeeAssignment;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeeController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    /**
     * GET /api/fees (Officer/Admin or general authenticated fee listing)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Fee::query()
            ->withCount([
                'assignments',
                'assignments as paid_assignments_count' => fn ($q) => $q->where('status', 'paid'),
            ])
            ->orderBy('due_date')
            ->orderBy('id');

        if ($user && $user->hasRole('student')) {
            $query->whereHas('assignments', fn ($q) => $q->where('user_id', $user->id))
                ->with(['assignments' => fn ($q) => $q->where('user_id', $user->id)]);
        }

        $fees = $query->get();

        return $this->successResponse(
            FeeResource::collection($fees)->resolve($request),
            'Fees retrieved successfully'
        );
    }

    /**
     * GET /api/student/fees (Student's assigned fees)
     */
    public function studentIndex(Request $request): JsonResponse
    {
        $user = $request->user();

        $fees = Fee::query()
            ->whereHas('assignments', fn ($q) => $q->where('user_id', $user->id))
            ->with(['assignments' => fn ($q) => $q->where('user_id', $user->id)])
            ->withCount([
                'assignments',
                'assignments as paid_assignments_count' => fn ($q) => $q->where('status', 'paid'),
            ])
            ->orderBy('due_date')
            ->get();

        return $this->successResponse(
            FeeResource::collection($fees)->resolve($request),
            'Assigned student fees retrieved successfully'
        );
    }

    /**
     * GET /api/student/fees/{id}
     */
    public function studentShow(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $fee = Fee::with(['assignments' => fn ($q) => $q->where('user_id', $user->id)])
            ->withCount([
                'assignments',
                'assignments as paid_assignments_count' => fn ($q) => $q->where('status', 'paid'),
            ])
            ->where('id', $id)
            ->orWhere('code', $id)
            ->first();

        if (! $fee) {
            return $this->errorResponse('Fee not found.', ['fee' => ['Requested fee schedule does not exist.']], 404);
        }

        if (! $fee->assignments()->where('user_id', $user->id)->exists()) {
            return $this->errorResponse('Forbidden. Fee is not assigned to this student.', ['authorization' => ['Fee is not assigned to you.']], 403);
        }

        return $this->successResponse(
            (new FeeResource($fee))->resolve($request),
            'Student fee details retrieved successfully'
        );
    }

    /**
     * GET /api/fees/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $fee = Fee::withCount([
            'assignments',
            'assignments as paid_assignments_count' => fn ($q) => $q->where('status', 'paid'),
        ])
            ->where('id', $id)
            ->orWhere('code', $id)
            ->first();

        if (! $fee) {
            return $this->errorResponse('Fee not found.', ['fee' => ['Requested fee schedule does not exist.']], 404);
        }

        $user = $request->user();
        if ($user && $user->hasRole('student') && ! $fee->assignments()->where('user_id', $user->id)->exists()) {
            return $this->errorResponse('Forbidden. Fee is not assigned to this student.', ['authorization' => ['Fee is not assigned to you.']], 403);
        }

        return $this->successResponse(
            (new FeeResource($fee))->resolve($request),
            'Fee details retrieved successfully'
        );
    }

    /**
     * POST /api/fees (Officer/Admin only)
     */
    public function store(CreateFeeRequest $request): JsonResponse
    {
        $user = $request->user();

        $fee = Fee::create([
            'code' => $request->input('code') ?: sprintf('SSC-FEE-%s-%02d', now()->format('y'), Fee::count() + 1),
            'name' => $request->input('name'),
            'purpose' => $request->input('purpose'),
            'description' => $request->input('description'),
            'category' => $request->input('category', 'Mandatory Council Fee'),
            'semester' => $request->input('semester', '1st Semester'),
            'academic_year' => $request->input('academic_year', 'AY 2026–2027'),
            'resolution_no' => $request->input('resolution_no', 'SSC Resolution No. 2026-015'),
            'allocated_departments' => $request->input('allocated_departments'),
            'amount' => $request->input('amount'),
            'due_date' => $request->input('due_date'),
            'status' => $request->input('status', 'active'),
            'created_by' => $user->id,
        ]);

        // Assign to selected students or all students by default
        $studentIds = $request->input('student_ids');
        $assignAll = $request->boolean('assign_to_all_students', empty($studentIds));

        if ($assignAll) {
            $studentUsers = User::whereHas('role', fn ($q) => $q->where('name', 'student'))->pluck('id');
        } else {
            $studentUsers = collect($studentIds);
        }

        foreach ($studentUsers as $studentUserId) {
            FeeAssignment::firstOrCreate([
                'fee_id' => $fee->id,
                'user_id' => $studentUserId,
            ], [
                'status' => 'unpaid',
            ]);
        }

        $this->auditLogService->log(
            'fee_created',
            "Officer {$user->email} created fee '{$fee->name}' ({$fee->code})",
            $user->id,
            'Fee',
            $fee->id,
            ['amount' => (float) $fee->amount, 'status' => $fee->status],
            $request
        );

        return $this->successResponse(
            (new FeeResource($fee->fresh()))->resolve($request),
            'Fee created and assigned successfully',
            201
        );
    }

    /**
     * PUT /api/fees/{id} (Officer/Admin only)
     */
    public function update(CreateFeeRequest $request, string $id): JsonResponse
    {
        $fee = Fee::where('id', $id)->orWhere('code', $id)->first();
        if (! $fee) {
            return $this->errorResponse('Fee not found.', ['fee' => ['Requested fee schedule does not exist.']], 404);
        }

        $fee->update($request->only([
            'code',
            'name',
            'purpose',
            'description',
            'category',
            'semester',
            'academic_year',
            'resolution_no',
            'allocated_departments',
            'amount',
            'due_date',
            'status',
        ]));

        $this->auditLogService->log(
            'fee_updated',
            "Officer {$request->user()->email} updated fee '{$fee->name}'",
            $request->user()->id,
            'Fee',
            $fee->id,
            ['status' => $fee->status, 'amount' => (float) $fee->amount],
            $request
        );

        return $this->successResponse(
            (new FeeResource($fee->fresh()))->resolve($request),
            'Fee updated successfully'
        );
    }

    /**
     * DELETE /api/fees/{id} (Officer/Admin only)
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $fee = Fee::where('id', $id)->orWhere('code', $id)->first();
        if (! $fee) {
            return $this->errorResponse('Fee not found.', ['fee' => ['Requested fee schedule does not exist.']], 404);
        }

        // If payments exist, archive instead of hard-deleting
        if ($fee->payments()->exists()) {
            $fee->update(['status' => 'archived']);
            return $this->successResponse(
                (new FeeResource($fee))->resolve($request),
                'Fee has recorded payments and was archived instead of deleted'
            );
        }

        $fee->delete();

        return $this->successResponse([], 'Fee deleted successfully');
    }
}
