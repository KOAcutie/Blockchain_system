<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransparencyRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'record_type',
        'reference_code',
        'fund_usage_record_id',
        'fee_id',
        'period',
        'total_amount',
        'record_hash',
        'status',
        'published_by',
        'published_at',
        'summary_payload',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'published_at' => 'datetime',
            'summary_payload' => 'array',
        ];
    }

    public function fundUsageRecord(): BelongsTo
    {
        return $this->belongsTo(FundUsageRecord::class);
    }

    public function fee(): BelongsTo
    {
        return $this->belongsTo(Fee::class);
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
