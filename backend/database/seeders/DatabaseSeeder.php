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
                'student_id' => '21-29199',
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
                'student_id' => '22-30142',
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

        // 3. Seed Student Organization Fees
        $feesData = [
            [
                'code' => 'SSC-FEE-26A',
                'name' => 'Supreme Student Council (SSC) Membership Fee',
                'purpose' => 'Student Representation, Welfare & Council Operations',
                'description' => 'Standard semester membership fee supporting student council representation, student welfare assistance, leadership programs, and public financial transparency systems.',
                'category' => 'Mandatory Council Fee',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-001',
                'allocated_departments' => [
                    'Student Rights & Welfare (40%)',
                    'Academic & Leadership Programs (30%)',
                    'General Assembly & Council Operations (20%)',
                    'Audit & Transparency Registry (10%)',
                ],
                'amount' => 100.00,
                'due_date' => '2026-10-15',
                'status' => 'active',
            ],
            [
                'code' => 'KAW-PUB-26A',
                'name' => 'Kawasa Official Student Publication Fee',
                'purpose' => 'Campus Press Freedom, Editorial Printing & Digital Journal',
                'description' => 'Official student publication levy supporting investigative journalism, broadsheet printing, literary folios, and online newsletter production by Kawasa.',
                'category' => 'Student Publication',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-002',
                'allocated_departments' => [
                    'Broadsheet & Literary Folio Printing (60%)',
                    'Digital Publishing & Investigative Equipment (25%)',
                    'Press Freedom & Journalism Seminars (15%)',
                ],
                'amount' => 75.00,
                'due_date' => '2026-10-15',
                'status' => 'active',
            ],
            [
                'code' => 'INS-SAF-26A',
                'name' => 'Student Accident & Health Insurance Fee',
                'purpose' => '24/7 Comprehensive Student Accident & Medical Coverage',
                'description' => 'Mandatory group accident and emergency hospitalization insurance coverage for students both on-campus and during official off-campus school activities.',
                'category' => 'Student Insurance',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-003',
                'allocated_departments' => [
                    'Accident & Medical Reimbursement Claims (70%)',
                    'Emergency Hospitalization Assistance (20%)',
                    'Insurance Policy Claims Administration (10%)',
                ],
                'amount' => 50.00,
                'due_date' => '2026-10-31',
                'status' => 'active',
            ],
            [
                'code' => 'RCY-HLT-26A',
                'name' => 'Red Cross Youth (RCY) & Health Services Fee',
                'purpose' => 'Campus Emergency First-Aid, Health Safety & Disaster Readiness',
                'description' => 'Dedicated fund for Red Cross Youth campus emergency response, first aid station supplies, student disaster risk management, and annual voluntary blood donation drives.',
                'category' => 'Health & Community Extension',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-004',
                'allocated_departments' => [
                    'First Aid Equipment & Health Supplies (50%)',
                    'Emergency Response & Life Support Training (30%)',
                    'Voluntary Blood Donation & Outreach Drives (20%)',
                ],
                'amount' => 50.00,
                'due_date' => '2026-11-15',
                'status' => 'active',
            ],
            [
                'code' => 'DEP-COL-26A',
                'name' => 'Department & College Student Council Fee',
                'purpose' => 'College Academic Symposia, Department Projects & Assembly',
                'description' => 'Departmental and collegiate student council fee supporting college-level academic conferences, specialized lab tools, research mentorship, and departmental general assemblies.',
                'category' => 'Departmental Fee',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-005',
                'allocated_departments' => [
                    'College Symposia & Academic Competitions (45%)',
                    'Departmental Student Assembly & Mentorship (35%)',
                    'Specialized Lab Enhancement & Student Projects (20%)',
                ],
                'amount' => 100.00,
                'due_date' => '2026-11-30',
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
                if ($student->id === $demoStudent->id && in_array($code, ['SSC-FEE-26A', 'KAW-PUB-26A'], true)) {
                    $status = 'paid';
                } elseif ($student->id === $secondStudent->id && $code === 'INS-SAF-26A') {
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
            ?: env('BLOCKCHAIN_CONTRACT_ADDRESS', '0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856');

        // 5. Seed Payments, Transactions, Receipts, and Blockchain Records
        // Payment 1: Demo Student -> SSC-FEE-26A (Confirmed)
        $payment1 = Payment::updateOrCreate(
            ['reference_number' => 'SSC-OR-2026-00981'],
            [
                'user_id' => $demoStudent->id,
                'fee_id' => $fees['SSC-FEE-26A']->id,
                'amount' => 100.00,
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
                'amount' => 100.00,
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
                'network' => config('services.blockchain.network', 'sepolia'),
                'contract_address' => $contractAddr,
                'blockchain_transaction_hash' => '0x4b6bb4f71a1a17405ad738b51ed3ec7c47b422f615865f8dc9a41fce73c2b5ff',
                'block_number' => 11832631,
                'record_hash' => $hash1,
                'status' => 'confirmed',
                'confirmed_at' => $payment1->verified_at,
                'error_message' => null,
            ]
        );

        // Payment 2: Demo Student -> KAW-PUB-26A (Confirmed)
        $payment2 = Payment::updateOrCreate(
            ['reference_number' => 'SSC-OR-2026-00944'],
            [
                'user_id' => $demoStudent->id,
                'fee_id' => $fees['KAW-PUB-26A']->id,
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
                'network' => config('services.blockchain.network', 'sepolia'),
                'contract_address' => $contractAddr,
                'blockchain_transaction_hash' => '0xa767f2cc04c4b9ae965992263169df07d78518506cbe352463faad2698803aff',
                'block_number' => 11832000,
                'record_hash' => $hash2,
                'status' => 'confirmed',
                'confirmed_at' => $payment2->verified_at,
                'error_message' => null,
            ]
        );

        // Payment 3: Demo Student Two -> INS-SAF-26A (Pending Verification)
        $payment3 = Payment::updateOrCreate(
            ['reference_number' => 'SSC-OR-2026-01012'],
            [
                'user_id' => $secondStudent->id,
                'fee_id' => $fees['INS-SAF-26A']->id,
                'amount' => 50.00,
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
                'amount' => 50.00,
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
