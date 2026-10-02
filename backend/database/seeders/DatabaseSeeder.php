<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\BlockchainRecord;
use App\Models\Fee;
use App\Models\FeeAssignment;
use App\Models\FundUsageRecord;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\TransparencyRecord;
use App\Models\User;
use App\Services\BlockchainService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Roles
        $studentRole = Role::updateOrCreate(
            ['name' => 'student'],
            ['label' => 'Student', 'description' => 'Enrolled University Student']
        );
        $officerRole = Role::updateOrCreate(
            ['name' => 'officer'],
            ['label' => 'SSC Officer', 'description' => 'Supreme Student Council Finance & Audit Officer']
        );
        $adminRole = Role::updateOrCreate(
            ['name' => 'admin'],
            ['label' => 'System Admin', 'description' => 'SSC Transparency System Administrator']
        );

        // 2. Seed Official Institutional Accounts
        $demoStudent = User::updateOrCreate(
            ['email' => 'student@example.test'],
            [
                'name' => 'Maria Clara Santos',
                'student_id' => 'STU-2026-001',
                'password' => Hash::make('password'),
                'role_id' => $studentRole->id,
                'status' => 'active',
                'college' => 'College of Computer and Information Sciences',
                'program' => 'BS Computer Science',
                'year_level' => '3rd Year',
            ]
        );

        $secondStudent = User::updateOrCreate(
            ['email' => 'student2@example.test'],
            [
                'name' => 'Jose Protacio Rizal',
                'student_id' => 'STU-2026-002',
                'password' => Hash::make('password'),
                'role_id' => $studentRole->id,
                'status' => 'active',
                'college' => 'College of Engineering',
                'program' => 'BS Civil Engineering',
                'year_level' => '2nd Year',
            ]
        );

        $demoOfficer = User::updateOrCreate(
            ['email' => 'officer@example.test'],
            [
                'name' => 'Juan Miguel Dela Cruz',
                'student_id' => null,
                'password' => Hash::make('password'),
                'role_id' => $officerRole->id,
                'status' => 'active',
                'position' => 'SSC Vice President for Finance & Audit',
            ]
        );

        $demoAdmin = User::updateOrCreate(
            ['email' => 'admin@example.test'],
            [
                'name' => 'Dr. Elena V. Magbanua',
                'student_id' => null,
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'status' => 'active',
                'position' => 'SSC System Administrator',
            ]
        );

        // 3. Seed SSC Fees
        $feesData = [
            [
                'code' => 'SSC-GEN-26A',
                'name' => 'Supreme Student Council General Membership & Welfare Fee',
                'purpose' => 'Student Rights, Welfare & Council Operations',
                'description' => 'Standard semester membership fee supporting student representation, legal and medical assistance funds, academic competitions, and student rights welfare programs.',
                'category' => 'Mandatory Council Fee',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-004',
                'allocated_departments' => [
                    'Student Welfare & Assistance (40%)',
                    'Academic & Leadership Programs (30%)',
                    'General Assembly & Council Operations (20%)',
                    'Audit & Transparency Systems (10%)',
                ],
                'amount' => 150.00,
                'due_date' => '2026-10-15',
                'status' => 'active',
            ],
            [
                'code' => 'SSC-PUB-26A',
                'name' => 'Official Student Publication & Campus Press Levy',
                'purpose' => 'Campus Broadsheet & Annual Transparency Supplement',
                'description' => 'Supports printing, investigative reporting, and digital publishing of the official university student newspaper and annual transparency journal.',
                'category' => 'Student Publication',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-005',
                'allocated_departments' => [
                    'Print & Digital Broadsheet Production (65%)',
                    'Campus Journalism Training & Press Freedom Fund (25%)',
                    'Annual Financial Transparency Supplement (10%)',
                ],
                'amount' => 75.00,
                'due_date' => '2026-10-15',
                'status' => 'active',
            ],
            [
                'code' => 'SSC-UNI-26A',
                'name' => 'University Foundation Week & Inter-College Cultural Fund',
                'purpose' => 'Academic Symposia & Inter-College Student Delegations',
                'description' => 'Dedicated contribution for student-led academic symposia, inter-college sports and cultural delegations, and university-wide student assemblies.',
                'category' => 'Campus Event Fund',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-009',
                'allocated_departments' => [
                    'Inter-College Academic & Cultural Competitions (50%)',
                    'Student Organizations Grant Pool (35%)',
                    'Venue, Safety & Medical Standby Logistics (15%)',
                ],
                'amount' => 120.00,
                'due_date' => '2026-11-05',
                'status' => 'active',
            ],
            [
                'code' => 'SSC-COM-26A',
                'name' => 'SSC Community Extension & Disaster Relief Reserve',
                'purpose' => 'Student Calamity Relief & Community Outreach',
                'description' => 'Student-governed emergency relief and community literacy outreach fund audited jointly by the SSC Finance Committee and Student COA.',
                'category' => 'Community Outreach',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-011',
                'allocated_departments' => [
                    'Student Emergency Calamity Assistance (60%)',
                    'Partner Community Literacy & Health Drives (40%)',
                ],
                'amount' => 50.00,
                'due_date' => '2026-11-20',
                'status' => 'active',
            ],
        ];

        $fees = [];
        foreach ($feesData as $data) {
            $fees[$data['code']] = Fee::updateOrCreate(
                ['code' => $data['code']],
                array_merge($data, ['created_by' => $demoOfficer->id])
            );
        }

        // 4. Seed Fee Assignments for both students
        foreach ([$demoStudent, $secondStudent] as $student) {
            foreach ($fees as $code => $fee) {
                $status = 'unpaid';
                if ($student->id === $demoStudent->id && in_array($code, ['SSC-GEN-26A', 'SSC-PUB-26A'], true)) {
                    $status = 'paid';
                } elseif ($student->id === $secondStudent->id && $code === 'SSC-UNI-26A') {
                    $status = 'pending_verification';
                }

                FeeAssignment::updateOrCreate(
                    ['fee_id' => $fee->id, 'user_id' => $student->id],
                    ['status' => $status]
                );
            }
        }

        $blockchainService = app(BlockchainService::class);
        $contractAddr = config('services.blockchain.contract_address')
            ?: env('BLOCKCHAIN_CONTRACT_ADDRESS', '0x5FbDB2315678afecb367f032d93F642f64180aa3');

        // 5. Seed Payments, Transactions, Receipts, and Blockchain Records
        // Payment 1: Demo Student -> SSC-GEN-26A (Confirmed)
        $payment1 = Payment::updateOrCreate(
            ['reference_number' => 'SSC-OR-2026-00981'],
            [
                'user_id' => $demoStudent->id,
                'fee_id' => $fees['SSC-GEN-26A']->id,
                'amount' => 150.00,
                'payment_method' => 'bank_transfer',
                'status' => 'confirmed',
                'notes' => 'University Cashier / LandBank Portal Settlement',
                'recorded_at' => now()->subDays(5),
                'verified_at' => now()->subDays(5)->addMinutes(20),
                'verified_by' => $demoOfficer->id,
            ]
        );

        $tx1 = Transaction::updateOrCreate(
            ['payment_id' => $payment1->id],
            [
                'transaction_id' => 'SSC-2026-000001',
                'amount' => 150.00,
                'status' => 'confirmed',
                'confirmed_at' => $payment1->verified_at,
            ]
        );

        Receipt::updateOrCreate(
            ['payment_id' => $payment1->id],
            [
                'receipt_number' => 'SSC-RCP-2026-000001',
                'issued_at' => $payment1->recorded_at,
                'status' => 'issued',
            ]
        );

        $hash1 = $blockchainService->generateRecordHash($tx1);
        BlockchainRecord::updateOrCreate(
            ['transaction_id' => $tx1->id],
            [
                'network' => 'localhost',
                'contract_address' => $contractAddr,
                'blockchain_transaction_hash' => '0x' . substr(hash('sha256', 'tx-hash-1:' . $hash1), 0, 64),
                'block_number' => 1,
                'record_hash' => $hash1,
                'status' => 'confirmed',
                'confirmed_at' => $payment1->verified_at,
                'error_message' => null,
            ]
        );

        // Payment 2: Demo Student -> SSC-PUB-26A (Confirmed)
        $payment2 = Payment::updateOrCreate(
            ['reference_number' => 'SSC-OR-2026-00944'],
            [
                'user_id' => $demoStudent->id,
                'fee_id' => $fees['SSC-PUB-26A']->id,
                'amount' => 75.00,
                'payment_method' => 'ewallet',
                'status' => 'confirmed',
                'notes' => 'GCash Institutional Merchant Settlement',
                'recorded_at' => now()->subDays(8),
                'verified_at' => now()->subDays(8)->addMinutes(15),
                'verified_by' => $demoOfficer->id,
            ]
        );

        $tx2 = Transaction::updateOrCreate(
            ['payment_id' => $payment2->id],
            [
                'transaction_id' => 'SSC-2026-000002',
                'amount' => 75.00,
                'status' => 'confirmed',
                'confirmed_at' => $payment2->verified_at,
            ]
        );

        Receipt::updateOrCreate(
            ['payment_id' => $payment2->id],
            [
                'receipt_number' => 'SSC-RCP-2026-000002',
                'issued_at' => $payment2->recorded_at,
                'status' => 'issued',
            ]
        );

        $hash2 = $blockchainService->generateRecordHash($tx2);
        BlockchainRecord::updateOrCreate(
            ['transaction_id' => $tx2->id],
            [
                'network' => 'localhost',
                'contract_address' => $contractAddr,
                'blockchain_transaction_hash' => '0x' . substr(hash('sha256', 'tx-hash-2:' . $hash2), 0, 64),
                'block_number' => 2,
                'record_hash' => $hash2,
                'status' => 'confirmed',
                'confirmed_at' => $payment2->verified_at,
                'error_message' => null,
            ]
        );

        // Payment 3: Demo Student Two -> SSC-UNI-26A (Pending Verification)
        $payment3 = Payment::updateOrCreate(
            ['reference_number' => 'SSC-OR-2026-01012'],
            [
                'user_id' => $secondStudent->id,
                'fee_id' => $fees['SSC-UNI-26A']->id,
                'amount' => 120.00,
                'payment_method' => 'ewallet',
                'status' => 'pending',
                'notes' => 'Maya / QR Ph Payment Submission',
                'recorded_at' => now()->subDay(),
                'verified_at' => null,
                'verified_by' => null,
            ]
        );

        $tx3 = Transaction::updateOrCreate(
            ['payment_id' => $payment3->id],
            [
                'transaction_id' => 'SSC-2026-000003',
                'amount' => 120.00,
                'status' => 'pending',
                'confirmed_at' => null,
            ]
        );

        Receipt::updateOrCreate(
            ['payment_id' => $payment3->id],
            [
                'receipt_number' => 'SSC-RCP-2026-000003',
                'issued_at' => $payment3->recorded_at,
                'status' => 'issued',
            ]
        );

        $hash3 = $blockchainService->generateRecordHash($tx3);
        BlockchainRecord::updateOrCreate(
            ['transaction_id' => $tx3->id],
            [
                'network' => 'localhost',
                'contract_address' => null,
                'blockchain_transaction_hash' => null,
                'block_number' => null,
                'record_hash' => $hash3,
                'status' => 'pending',
                'confirmed_at' => null,
                'error_message' => null,
            ]
        );

        // 6. Seed Fund Usage & Transparency Records
        $fundsData = [
            [
                'approval_reference' => 'SSC Appropriation Act No. 2026-012',
                'purpose' => 'Student Emergency Medical & Hospitalization Assistance Batch 1',
                'description' => 'Emergency medical grants and hospital bill assistance for verified student applicants across 8 colleges.',
                'category' => 'Student Welfare',
                'amount' => 85.00,
                'approved_budget' => 100.00,
                'date' => '2026-09-12',
                'committee' => 'Student Rights & Welfare Committee',
                'beneficiaries' => '42 Verified Student Grantees across 8 Colleges',
                'notes' => 'Audited by Student COA with complete liquidation vouchers.',
                'status' => 'published',
                'published_at' => now()->subDays(10),
            ],
            [
                'approval_reference' => 'SSC Appropriation Act No. 2026-015',
                'purpose' => '1st Semester Open-Access Printing & Research Hub Supplies',
                'description' => 'Paper, toner, and maintenance supplies for the free SSC Student Printing & Research Hub.',
                'category' => 'Academic Initiatives',
                'amount' => 60.00,
                'approved_budget' => 75.00,
                'date' => '2026-09-18',
                'committee' => 'Academic Affairs & Research Committee',
                'beneficiaries' => 'Free printing service for 3,100+ students at SSC Study Hub',
                'notes' => 'Verified against official supplier invoices.',
                'status' => 'published',
                'published_at' => now()->subDays(6),
            ],
            [
                'approval_reference' => 'SSC Appropriation Act No. 2026-022',
                'purpose' => 'Independent Student Commission on Audit (SCOA) Digital Archiving',
                'description' => 'Archival binders, scanner maintenance, and digital audit ledger verification materials.',
                'category' => 'Operations & Audit',
                'amount' => 30.00,
                'approved_budget' => 45.00,
                'date' => '2026-09-26',
                'committee' => 'Finance & Transparency Oversight',
                'beneficiaries' => 'University-wide Public Financial Transparency Registry',
                'notes' => 'Currently under SCOA pre-publication review.',
                'status' => 'draft',
                'published_at' => null,
            ],
        ];

        foreach ($fundsData as $fData) {
            $recordHash = '0x' . hash('sha256', json_encode([
                'approval_reference' => $fData['approval_reference'],
                'amount' => number_format((float) $fData['amount'], 2, '.', ''),
                'category' => $fData['category'],
                'date' => $fData['date'],
                'purpose' => $fData['purpose'],
            ]));

            $fundRecord = FundUsageRecord::updateOrCreate(
                ['approval_reference' => $fData['approval_reference']],
                array_merge($fData, [
                    'created_by' => $demoOfficer->id,
                    'record_hash' => $recordHash,
                ])
            );

            if ($fundRecord->status === 'published') {
                TransparencyRecord::updateOrCreate(
                    ['fund_usage_record_id' => $fundRecord->id],
                    [
                        'title' => $fundRecord->purpose,
                        'record_type' => 'fund_usage',
                        'reference_code' => sprintf('SSC-TRN-2026-%04d', $fundRecord->id),
                        'period' => '1st Semester, AY 2026–2027',
                        'total_amount' => $fundRecord->amount,
                        'record_hash' => $fundRecord->record_hash,
                        'status' => 'published',
                        'published_by' => $demoOfficer->id,
                        'published_at' => $fundRecord->published_at,
                        'summary_payload' => [
                            'category' => $fundRecord->category,
                            'approval_reference' => $fundRecord->approval_reference,
                            'committee' => $fundRecord->committee,
                            'beneficiaries' => $fundRecord->beneficiaries,
                        ],
                    ]
                );
            }
        }

        // 7. Initial Audit Log Entry
        AuditLog::firstOrCreate(
            ['action' => 'system_seeded', 'entity_type' => 'System'],
            [
                'user_id' => $demoAdmin->id,
                'entity_id' => '1',
                'description' => 'SSC Transparency initial roles, demo accounts, fees, transactions, and transparency records seeded.',
                'ip_address' => '127.0.0.1',
                'metadata' => ['environment' => app()->environment()],
                'created_at' => now(),
            ]
        );
    }
}
