<?php

namespace App\Policies;

use App\Models\Fee;
use App\Models\User;

class FeePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Fee $fee): bool
    {
        if ($user->hasRole('officer', 'admin')) {
            return true;
        }

        return $fee->assignments()->where('user_id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasRole('officer', 'admin');
    }

    public function update(User $user, Fee $fee): bool
    {
        return $user->hasRole('officer', 'admin');
    }

    public function delete(User $user, Fee $fee): bool
    {
        return $user->hasRole('officer', 'admin');
    }
}
