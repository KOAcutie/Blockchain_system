<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockchainRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'network',
        'contract_address',
        'blockchain_transaction_hash',
        'block_number',
        'record_hash',
        'status',
        'confirmed_at',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'block_number' => 'integer',
            'confirmed_at' => 'datetime',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
