<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Usage: middleware('role:officer,admin') or middleware('role:admin')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'errors' => ['auth' => ['Authentication is required.']],
            ], 401);
        }

        $user->loadMissing('role');
        $userRole = $user->role?->name;

        if (! $userRole || ! in_array($userRole, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Insufficient role permissions.',
                'errors' => ['authorization' => ['You are not authorized to access this resource.']],
            ], 403);
        }

        return $next($request);
    }
}
