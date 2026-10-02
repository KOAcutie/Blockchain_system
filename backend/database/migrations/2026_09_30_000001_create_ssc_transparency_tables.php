<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fees', function (Blueprint $table) {
            $table->id();
            $table->string('code')->nullable()->index();
            $table->string('name');
            $table->string('purpose');
            $table->text('description')->nullable();
            $table->string('category')->default('Mandatory Council Fee');
            $table->string('semester')->default('1st Semester');
            $table->string('academic_year')->default('AY 2026–2027');
            $table->string('resolution_no')->nullable();
            $table->json('allocated_departments')->nullable();
            $table->decimal('amount', 12, 2);
            $table->date('due_date');
            $table->string('status')->default('active'); // draft, active, closed, archived
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('fee_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_id')->constrained('fees')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('unpaid'); // unpaid, pending_verification, paid, partial, waived
            $table->timestamps();

            $table->unique(['fee_id', 'user_id']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('fee_id')->constrained('fees')->restrictOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method'); // ewallet, bank_transfer, cash, other
            $table->string('reference_number');
            $table->string('proof_path')->nullable();
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('status')->default('pending'); // pending, confirmed, failed, completed, rejected
            $table->timestamp('recorded_at');
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'fee_id', 'status']);
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->unique()->constrained('payments')->cascadeOnDelete();
            $table->string('transaction_id')->unique(); // SSC-2026-000001
            $table->decimal('amount', 12, 2);
            $table->string('status')->default('pending'); // pending, confirmed, failed, rejected
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->unique()->constrained('payments')->cascadeOnDelete();
            $table->string('receipt_number')->unique(); // SSC-RCP-2026-000001
            $table->timestamp('issued_at');
            $table->string('status')->default('issued'); // issued, voided
            $table->timestamps();
        });

        Schema::create('blockchain_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->unique()->constrained('transactions')->cascadeOnDelete();
            $table->string('network')->default('localhost');
            $table->string('contract_address')->nullable();
            $table->string('blockchain_transaction_hash')->nullable()->index();
            $table->unsignedBigInteger('block_number')->nullable();
            $table->string('record_hash')->index();
            $table->string('status')->default('pending'); // pending, submitted, confirmed, failed
            $table->timestamp('confirmed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });

        Schema::create('fund_usage_records', function (Blueprint $table) {
            $table->id();
            $table->string('purpose');
            $table->text('description');
            $table->string('category');
            $table->decimal('amount', 12, 2);
            $table->decimal('approved_budget', 12, 2)->nullable();
            $table->date('date');
            $table->string('approval_reference');
            $table->string('committee')->nullable();
            $table->string('beneficiaries')->nullable();
            $table->string('attachment_path')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('draft'); // draft, approved, published, archived
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->string('record_hash')->nullable();
            $table->timestamps();
        });

        Schema::create('transparency_records', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('record_type'); // collection_summary, fund_usage, audit_statement
            $table->string('reference_code')->unique();
            $table->foreignId('fund_usage_record_id')->nullable()->constrained('fund_usage_records')->nullOnDelete();
            $table->foreignId('fee_id')->nullable()->constrained('fees')->nullOnDelete();
            $table->string('period')->default('1st Semester, AY 2026–2027');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->string('record_hash')->nullable();
            $table->string('status')->default('published'); // draft, published, archived
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->json('summary_payload')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action')->index();
            $table->string('entity_type')->nullable();
            $table->string('entity_id')->nullable();
            $table->text('description');
            $table->string('ip_address', 45)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('transparency_records');
        Schema::dropIfExists('fund_usage_records');
        Schema::dropIfExists('blockchain_records');
        Schema::dropIfExists('receipts');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('fee_assignments');
        Schema::dropIfExists('fees');
    }
};
