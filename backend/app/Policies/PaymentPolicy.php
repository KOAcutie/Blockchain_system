<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Payment $payment): bool
    {
        if ($user->hasRole('officer', 'admin')) {
            return true;
        }

        return (int) $payment->user_id === (int) $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('student');
    }

    public function verify(User $user, Payment $payment): bool
    {
        return $user->hasRole('officer', 'admin');
    }

    public function reject(User $user, Payment $payment): bool
    {
        return $user->hasRole('officer', 'admin');
    }

    public function viewProof(User $user, Payment $payment): bool
    {
        return $user->hasRole('officer', 'admin') || (int) $payment->user_id === (int) $user->id;
    }
}
