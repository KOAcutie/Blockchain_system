<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'student_id' => $this->student_id,
            'role' => $this->role?->name ?? 'student',
            'role_label' => $this->role?->label ?? 'Student',
            'status' => $this->status,
            'college' => $this->college,
            'program' => $this->program,
            'year_level' => $this->year_level,
            'position' => $this->position,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
