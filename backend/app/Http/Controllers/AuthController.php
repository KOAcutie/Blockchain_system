<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\Fee;
use App\Models\FeeAssignment;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $throttleKey = 'login:' . strtolower((string) $request->input('email')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return $this->errorResponse(
                'Too many login attempts. Please try again later.',
                ['email' => ["Too many login attempts. Retry in {$seconds} seconds."]],
                429
            );
        }

        $user = User::with('role')
            ->where('email', $request->input('email'))
            ->first();

        if (! $user || ! Hash::check((string) $request->input('password'), $user->password)) {
            RateLimiter::hit($throttleKey, 60);
            return $this->errorResponse(
                'Invalid email or password.',
                ['credentials' => ['The provided credentials do not match our records.']],
                401
            );
        }

        if ($user->status !== 'active') {
            return $this->errorResponse(
                'Account is inactive or suspended.',
                ['account' => ['Your institutional account is not currently active.']],
                403
            );
        }

        RateLimiter::clear($throttleKey);

        $token = $user->createToken('ssc-portal-token', [$user->role?->name ?? 'student'])->plainTextToken;

        $this->auditLogService->log(
            'login',
            "User {$user->email} ({$user->role?->name}) logged in",
            $user->id,
            'User',
            $user->id,
            ['role' => $user->role?->name],
            $request
        );

        return $this->successResponse([
            'user' => (new UserResource($user))->resolve(),
            'token' => $token,
        ], 'Login successful');
    }

    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'student_id' => ['required', 'string', 'max:64', 'unique:users,student_id'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'college' => ['nullable', 'string', 'max:150'],
            'program' => ['nullable', 'string', 'max:150'],
            'year_level' => ['nullable', 'string', 'max:50'],
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', $validator->errors(), 422);
        }

        // Public registration ALWAYS creates a student role — never officer or admin
        $studentRole = Role::firstOrCreate(
            ['name' => 'student'],
            ['label' => 'Student', 'description' => 'Enrolled University Student']
        );

        $user = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'student_id' => $request->input('student_id'),
            'password' => $request->input('password'),
            'role_id' => $studentRole->id,
            'status' => 'active',
            'college' => $request->input('college', 'College of Computer and Information Sciences'),
            'program' => $request->input('program', 'BS Computer Science'),
            'year_level' => $request->input('year_level', '1st Year'),
        ]);

        // Automatically assign active semester fees to newly registered student
        $activeFees = Fee::where('status', 'active')->get();
        foreach ($activeFees as $fee) {
            FeeAssignment::firstOrCreate([
                'fee_id' => $fee->id,
                'user_id' => $user->id,
            ], [
                'status' => 'unpaid',
            ]);
        }

        $user->load('role');
        $token = $user->createToken('ssc-portal-token', ['student'])->plainTextToken;

        return $this->successResponse([
            'user' => (new UserResource($user))->resolve(),
            'token' => $token,
        ], 'Student registration successful', 201);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        return $this->successResponse([
            'user' => (new UserResource($user))->resolve(),
        ], 'Authenticated user profile retrieved');
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return $this->successResponse([], 'Logout successful');
    }
}
