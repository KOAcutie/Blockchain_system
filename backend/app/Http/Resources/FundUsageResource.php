<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FundUsageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purpose' => $this->purpose,
            'title' => $this->purpose,
            'description' => $this->description,
            'category' => $this->category,
            'amount' => (float) $this->amount,
            'approved_budget' => (float) ($this->approved_budget ?? $this->amount),
            'date' => $this->date?->format('Y-m-d'),
            'approval_reference' => $this->approval_reference,
            'committee' => $this->committee ?? 'SSC Finance & Audit Committee',
            'beneficiaries' => $this->beneficiaries ?? 'University Student Body',
            'notes' => $this->notes,
            'status' => $this->status,
            'record_hash' => $this->record_hash,
            'published_at' => $this->published_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
