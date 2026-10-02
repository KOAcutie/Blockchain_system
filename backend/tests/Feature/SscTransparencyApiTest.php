<?php

namespace Tests\Feature;

use App\Models\Fee;
use App\Models\FeeAssignment;
use App\Models\FundUsageRecord;
use App\Models\Payment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SscTransparencyApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $student;
    protected User $officer;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $studentRole = Role::create(['name' => 'student', 'label' => 'Student']);
        $officerRole = Role::create(['name' => 'officer', 'label' => 'SSC Officer']);
        $adminRole = Role::create(['name' => 'admin', 'label' => 'System Admin']);

        $this->student = User::create([
            'name' => 'Demo Student',
            'email' => 'student@example.test',
            'student_id' => 'STU-2026-001',
            'password' => 'password',
            'role_id' => $studentRole->id,
            'status' => 'active',
        ]);

        $this->officer = User::create([
            'name' => 'SSC Officer',
            'email' => 'officer@example.test',
            'student_id' => null,
            'password' => 'password',
            'role_id' => $officerRole->id,
            'status' => 'active',
        ]);

        $this->admin = User::create([
            'name' => 'System Admin',
            'email' => 'admin@example.test',
            'student_id' => null,
            'password' => 'password',
            'role_id' => $adminRole->id,
            'status' => 'active',
        ]);
    }

    public function test_authentication_login_logout_and_protection(): void
    {
        // 1. Valid login succeeds and never returns password
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'student@example.test',
            'password' => 'password',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'student@example.test')
            ->assertJsonPath('data.user.role', 'student')
            ->assertJsonMissingPath('data.user.password');

        $token = $loginResponse->json('data.token');
        $this->assertNotEmpty($token);

        // 2. Invalid login fails with 401
        $this->postJson('/api/auth/login', [
            'email' => 'student@example.test',
            'password' => 'wrong-password',
        ])->assertStatus(401)
            ->assertJsonPath('success', false);

        // 3. Protected endpoint works with token
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('data.user.student_id', 'STU-2026-001');

        // 4. Logout works
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // 5. Protected endpoint without authentication returns 401
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/student/fees')
            ->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_role_based_authorization_enforcement(): void
    {
        // Student cannot access officer endpoints
        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/officer/payments')
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        // Officer can access officer endpoints
        $this->actingAs($this->officer, 'sanctum')
            ->getJson('/api/officer/payments')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // Officer cannot access admin-only endpoints
        $this->actingAs($this->officer, 'sanctum')
            ->getJson('/api/admin/audit-logs')
            ->assertStatus(403);

        // Admin can access admin endpoints
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/audit-logs')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_fee_creation_assignment_and_authorization(): void
    {
        // Officer creates fee (assigned to all students by default)
        $createResponse = $this->actingAs($this->officer, 'sanctum')
            ->postJson('/api/fees', [
                'code' => 'SSC-TEST-26',
                'name' => 'SSC Membership Fee',
                'purpose' => 'Student Council Welfare Fund',
                'amount' => 150.00,
                'due_date' => '2026-10-15',
                'status' => 'active',
            ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'SSC-TEST-26');

        $feeId = $createResponse->json('data.id');

        // Student can view assigned fee
        $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/student/fees/{$feeId}")
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'SSC Membership Fee');

        // Unauthorized student cannot modify fee
        $this->actingAs($this->student, 'sanctum')
            ->putJson("/api/fees/{$feeId}", [
                'name' => 'Tampered Fee Name',
                'amount' => 1.00,
            ])
            ->assertStatus(403);
    }

    public function test_payment_recording_validation_duplicate_prevention_and_rejection(): void
    {
        Storage::fake('local');

        $fee = Fee::create([
            'code' => 'SSC-GEN-26A',
            'name' => 'SSC General Membership Fee',
            'purpose' => 'Council Operations',
            'amount' => 150.00,
            'due_date' => '2026-10-15',
            'status' => 'active',
            'created_by' => $this->officer->id,
        ]);

        FeeAssignment::create([
            'fee_id' => $fee->id,
            'user_id' => $this->student->id,
            'status' => 'unpaid',
        ]);

        // Mismatched amount fails with 422
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'fee_id' => $fee->id,
                'amount' => 50.00,
                'payment_method' => 'ewallet',
                'reference_number' => 'REF-WRONG-AMT',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        // Valid payment succeeds and generates transaction ID + digital receipt
        $proofFile = UploadedFile::fake()->create('receipt.pdf', 120, 'application/pdf');
        $paymentResponse = $this->actingAs($this->student, 'sanctum')
            ->post('/api/student/payments', [
                'fee_id' => $fee->id,
                'amount' => 150.00,
                'payment_method' => 'ewallet',
                'reference_number' => 'REF-VALID-001',
                'proof' => $proofFile,
            ], ['Accept' => 'application/json']);

        $paymentResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending');

        $paymentId = $paymentResponse->json('data.id');
        $txId = $paymentResponse->json('data.transaction_id');
        $receiptNumber = $paymentResponse->json('data.receipt_number');

        $this->assertStringStartsWith('SSC-', $txId);
        $this->assertStringStartsWith('SSC-RCP-', $receiptNumber);

        // Duplicate payment for the same fee is rejected
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'fee_id' => $fee->id,
                'amount' => 150.00,
                'payment_method' => 'cash',
                'reference_number' => 'REF-DUPLICATE-002',
            ])
            ->assertStatus(422);

        // Officer can reject a pending payment
        $this->actingAs($this->officer, 'sanctum')
            ->postJson("/api/officer/payments/{$paymentId}/reject", [
                'reason' => 'Reference number unreadable',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected');
    }

    public function test_fund_usage_creation_and_privacy_safe_transparency_publishing(): void
    {
        // Officer creates draft fund usage record
        $createRes = $this->actingAs($this->officer, 'sanctum')
            ->postJson('/api/officer/funds', [
                'purpose' => 'Student Medical Assistance Grant',
                'description' => 'Emergency hospitalization support for students',
                'category' => 'Student Welfare',
                'amount' => 5000.00,
                'date' => '2026-09-20',
                'approval_reference' => 'SSC-RES-2026-099',
                'status' => 'draft',
            ]);

        $createRes->assertStatus(201);
        $fundId = $createRes->json('data.id');

        // Draft record does NOT appear in public transparency endpoint
        $this->getJson('/api/transparency/funds')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');

        // Officer publishes the record
        $this->actingAs($this->officer, 'sanctum')
            ->postJson("/api/officer/funds/{$fundId}/publish")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'published');

        // Published record appears in public transparency endpoint without student PII
        $transparencyRes = $this->getJson('/api/transparency');
        $transparencyRes->assertStatus(200)
            ->assertJsonPath('data.summary.total_expenses', 5000)
            ->assertJsonMissing(['student@example.test', 'STU-2026-001']);
    }

    public function test_blockchain_success_failure_resilience_and_verification_flows(): void
    {
        $fee = Fee::create([
            'code' => 'SSC-BC-26',
            'name' => 'SSC Blockchain Test Fee',
            'purpose' => 'Verification Flow Test',
            'amount' => 100.00,
            'due_date' => '2026-10-30',
            'status' => 'active',
            'created_by' => $this->officer->id,
        ]);

        FeeAssignment::create([
            'fee_id' => $fee->id,
            'user_id' => $this->student->id,
            'status' => 'unpaid',
        ]);

        // Record payment
        $res = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'fee_id' => $fee->id,
                'amount' => 100.00,
                'payment_method' => 'bank_transfer',
                'reference_number' => 'REF-BC-001',
            ]);
        $paymentId = $res->json('data.id');
        $txCode = $res->json('data.transaction_id');

        Http::fake([
            '*/api/blockchain/transactions' => Http::sequence()
                ->push(['detail' => 'RPC node timeout'], 503)
                ->push([
                    'success' => true,
                    'transaction_hash' => '0xabc123def4567890abc123def4567890abc123def4567890abc123def4567890',
                    'contract_address' => '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                    'network' => 'localhost',
                    'block_number' => 42,
                    'status' => 'confirmed',
                ], 200),
            '*/api/blockchain/verify' => Http::sequence()
                ->push([
                    'verified' => true,
                    'record_hash_matches' => true,
                    'transaction_confirmed' => true,
                    'block_number' => 42,
                    'transaction_hash' => '0xabc123def4567890abc123def4567890abc123def4567890abc123def4567890',
                ], 200)
                ->push([
                    'verified' => false,
                    'record_hash_matches' => false,
                    'transaction_confirmed' => true,
                    'block_number' => 42,
                    'transaction_hash' => '0xabc123def4567890abc123def4567890abc123def4567890abc123def4567890',
                ], 200),
        ]);

        // Case 1: Blockchain service fails (HTTP 503) -> Payment & Transaction remain confirmed, blockchain status = failed
        $verifyFailRes = $this->actingAs($this->officer, 'sanctum')
            ->postJson("/api/officer/payments/{$paymentId}/verify");

        $verifyFailRes->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.blockchain.status', 'failed');

        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'status' => 'confirmed']);
        $this->assertDatabaseHas('transactions', ['transaction_id' => $txCode, 'status' => 'confirmed']);

        // Case 2: Retry blockchain submission when Python service succeeds -> status = confirmed

        $retryRes = $this->actingAs($this->officer, 'sanctum')
            ->postJson('/api/blockchain/transactions', ['transaction_id' => $txCode]);

        $retryRes->assertStatus(200)
            ->assertJsonPath('data.blockchain.status', 'confirmed')
            ->assertJsonPath('data.blockchain.block_number', 42);

        // Case 3: Verification success
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/blockchain/verify', ['transaction_id' => $txCode])
            ->assertStatus(200)
            ->assertJsonPath('data.verified', true)
            ->assertJsonPath('data.record_hash_matches', true);

        // Case 4: Verification mismatch
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/blockchain/verify', ['transaction_id' => $txCode])
            ->assertStatus(200)
            ->assertJsonPath('data.verified', false)
            ->assertJsonPath('data.record_hash_matches', false);
    }
}
