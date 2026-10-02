<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogService
{
    public function log(
        string $action,
        string $description,
        ?int $userId = null,
        ?string $entityType = null,
        string|int|null $entityId = null,
        array $metadata = [],
        ?Request $request = null
    ): AuditLog {
        // Ensure sensitive keys are never stored in metadata
        $sanitizedMetadata = collect($metadata)
            ->except(['password', 'password_confirmation', 'token', 'private_key', 'service_key'])
            ->toArray();

        $ipAddress = $request?->ip() ?? request()?->ip() ?? '127.0.0.1';

        return AuditLog::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId !== null ? (string) $entityId : null,
            'description' => $description,
            'ip_address' => $ipAddress,
            'metadata' => $sanitizedMetadata,
            'created_at' => now(),
        ]);
    }
}
