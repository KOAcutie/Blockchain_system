<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class FundUsageRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'purpose',
        'description',
        'category',
        'amount',
        'approved_budget',
        'date',
        'approval_reference',
        'committee',
        'beneficiaries',
        'attachment_path',
        'notes',
        'status',
        'created_by',
        'published_at',
        'record_hash',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'approved_budget' => 'decimal:2',
            'date' => 'date',
            'published_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function transparencyRecord(): HasOne
    {
        return $this->hasOne(TransparencyRecord::class);
    }
}
