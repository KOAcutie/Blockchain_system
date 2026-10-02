<?php

namespace App\Policies;

use App\Models\FundUsageRecord;
use App\Models\User;

class FundUsagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('officer', 'admin');
    }

    public function view(User $user, FundUsageRecord $record): bool
    {
        if ($user->hasRole('officer', 'admin')) {
            return true;
        }

        return in_array($record->status, ['approved', 'published'], true);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('officer', 'admin');
    }

    public function update(User $user, FundUsageRecord $record): bool
    {
        return $user->hasRole('officer', 'admin');
    }

    public function publish(User $user, FundUsageRecord $record): bool
    {
        return $user->hasRole('officer', 'admin');
    }
}
