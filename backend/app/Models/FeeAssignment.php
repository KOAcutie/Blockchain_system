<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeeAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'fee_id',
        'user_id',
        'status',
    ];

    public function fee(): BelongsTo
    {
        return $this->belongsTo(Fee::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
