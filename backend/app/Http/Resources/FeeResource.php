<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $assignmentStatus = null;

        if ($user && $user->hasRole('student')) {
            $assignment = $this->relationLoaded('assignments')
                ? $this->assignments->firstWhere('user_id', $user->id)
                : $this->assignments()->where('user_id', $user->id)->first();
            $assignmentStatus = $assignment?->status ?? 'unpaid';
        }

        $totalAssigned = $this->assignments_count ?? $this->assignments()->count();
        $paidCount = $this->paid_assignments_count ?? $this->assignments()->where('status', 'paid')->count();

        return [
            'id' => $this->id,
            'code' => $this->code ?? sprintf('SSC-FEE-%03d', $this->id),
            'name' => $this->name,
            'title' => $this->name,
            'purpose' => $this->purpose,
            'description' => $this->description,
            'category' => $this->category ?? 'Mandatory Council Fee',
            'semester' => $this->semester ?? '1st Semester',
            'academic_year' => $this->academic_year ?? 'AY 2026–2027',
            'resolution_no' => $this->resolution_no ?? 'SSC Resolution No. 2026-004',
            'allocated_departments' => $this->allocated_departments ?? [
                'Student Welfare & Assistance (40%)',
                'Academic & Leadership Programs (30%)',
                'General Assembly & Council Operations (20%)',
                'Audit & Transparency Systems (10%)',
            ],
            'amount' => (float) $this->amount,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'status' => $this->status,
            'assignment_status' => $assignmentStatus,
            'collected_count' => (int) $paidCount,
            'total_students' => (int) max($totalAssigned, 1),
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
