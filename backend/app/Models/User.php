<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'student_id',
        'password',
        'role_id',
        'status',
        'college',
        'program',
        'year_level',
        'position',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function feeAssignments(): HasMany
    {
        return $this->hasMany(FeeAssignment::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function hasRole(string ...$roles): bool
    {
        $roleName = $this->role?->name;

        return $roleName !== null && in_array($roleName, $roles, true);
    }

    public function isStudent(): bool
    {
        return $this->hasRole('student');
    }

    public function isOfficer(): bool
    {
        return $this->hasRole('officer', 'admin');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }
}
