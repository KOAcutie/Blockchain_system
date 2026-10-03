<?php

use App\Models\Fee;
use App\Models\FeeAssignment;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $officer = User::whereHas('role', fn ($q) => $q->where('name', 'officer'))->first()
            ?? User::first();

        if (! $officer) {
            // Fresh database before users are seeded; DatabaseSeeder will populate fees
            return;
        }

        $officerId = $officer->id;

        $targetFees = [
            'SSC-FEE-26A' => [
                'name' => 'Supreme Student Council (SSC) Membership Fee',
                'purpose' => 'Student Representation, Welfare & Council Operations',
                'description' => 'Standard semester membership fee supporting student council representation, student welfare assistance, leadership programs, and public financial transparency systems.',
                'category' => 'Mandatory Council Fee',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-001',
                'allocated_departments' => json_encode([
                    'Student Rights & Welfare (40%)',
                    'Academic & Leadership Programs (30%)',
                    'General Assembly & Council Operations (20%)',
                    'Audit & Transparency Registry (10%)',
                ]),
                'amount' => 100.00,
                'due_date' => '2026-10-15',
                'status' => 'active',
                'created_by' => $officerId,
            ],
            'KAW-PUB-26A' => [
                'name' => 'Kawasa Official Student Publication Fee',
                'purpose' => 'Campus Press Freedom, Editorial Printing & Digital Journal',
                'description' => 'Official student publication levy supporting investigative journalism, broadsheet printing, literary folios, and online newsletter production by Kawasa.',
                'category' => 'Student Publication',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-002',
                'allocated_departments' => json_encode([
                    'Broadsheet & Literary Folio Printing (60%)',
                    'Digital Publishing & Investigative Equipment (25%)',
                    'Press Freedom & Journalism Seminars (15%)',
                ]),
                'amount' => 75.00,
                'due_date' => '2026-10-15',
                'status' => 'active',
                'created_by' => $officerId,
            ],
            'INS-SAF-26A' => [
                'name' => 'Student Accident & Health Insurance Fee',
                'purpose' => '24/7 Comprehensive Student Accident & Medical Coverage',
                'description' => 'Mandatory group accident and emergency hospitalization insurance coverage for students both on-campus and during official off-campus school activities.',
                'category' => 'Student Insurance',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-003',
                'allocated_departments' => json_encode([
                    'Accident & Medical Reimbursement Claims (70%)',
                    'Emergency Hospitalization Assistance (20%)',
                    'Insurance Policy Claims Administration (10%)',
                ]),
                'amount' => 50.00,
                'due_date' => '2026-10-31',
                'status' => 'active',
                'created_by' => $officerId,
            ],
            'RCY-HLT-26A' => [
                'name' => 'Red Cross Youth (RCY) & Health Services Fee',
                'purpose' => 'Campus Emergency First-Aid, Health Safety & Disaster Readiness',
                'description' => 'Dedicated fund for Red Cross Youth campus emergency response, first aid station supplies, student disaster risk management, and annual voluntary blood donation drives.',
                'category' => 'Health & Community Extension',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-004',
                'allocated_departments' => json_encode([
                    'First Aid Equipment & Health Supplies (50%)',
                    'Emergency Response & Life Support Training (30%)',
                    'Voluntary Blood Donation & Outreach Drives (20%)',
                ]),
                'amount' => 50.00,
                'due_date' => '2026-11-15',
                'status' => 'active',
                'created_by' => $officerId,
            ],
            'DEP-COL-26A' => [
                'name' => 'Department & College Student Council Fee',
                'purpose' => 'College Academic Symposia, Department Projects & Assembly',
                'description' => 'Departmental and collegiate student council fee supporting college-level academic conferences, specialized lab tools, research mentorship, and departmental general assemblies.',
                'category' => 'Departmental Fee',
                'semester' => '1st Semester',
                'academic_year' => 'AY 2026–2027',
                'resolution_no' => 'SSC Resolution No. 2026-005',
                'allocated_departments' => json_encode([
                    'College Symposia & Academic Competitions (45%)',
                    'Departmental Student Assembly & Mentorship (35%)',
                    'Specialized Lab Enhancement & Student Projects (20%)',
                ]),
                'amount' => 100.00,
                'due_date' => '2026-11-30',
                'status' => 'active',
                'created_by' => $officerId,
            ],
        ];

        // Map legacy fee codes to new student org fees to preserve foreign keys
        $codeMap = [
            'SSC-GEN-26A' => 'SSC-FEE-26A',
            'SSC-PUB-26A' => 'KAW-PUB-26A',
            'SSC-UNI-26A' => 'INS-SAF-26A',
            'SSC-COM-26A' => 'RCY-HLT-26A',
        ];

        foreach ($codeMap as $oldCode => $newCode) {
            $data = $targetFees[$newCode];
            $existing = Fee::where('code', $oldCode)->first();
            if ($existing) {
                $existing->update([
                    'code' => $newCode,
                    'name' => $data['name'],
                    'purpose' => $data['purpose'],
                    'description' => $data['description'],
                    'category' => $data['category'],
                    'semester' => $data['semester'],
                    'academic_year' => $data['academic_year'],
                    'resolution_no' => $data['resolution_no'],
                    'allocated_departments' => json_decode($data['allocated_departments'], true),
                    'amount' => $data['amount'],
                    'due_date' => $data['due_date'],
                    'status' => $data['status'],
                ]);
            }
        }

        // Insert any missing new fees
        foreach ($targetFees as $code => $data) {
            $exists = Fee::where('code', $code)->first();
            if (! $exists) {
                Fee::create([
                    'code' => $code,
                    'name' => $data['name'],
                    'purpose' => $data['purpose'],
                    'description' => $data['description'],
                    'category' => $data['category'],
                    'semester' => $data['semester'],
                    'academic_year' => $data['academic_year'],
                    'resolution_no' => $data['resolution_no'],
                    'allocated_departments' => json_decode($data['allocated_departments'], true),
                    'amount' => $data['amount'],
                    'due_date' => $data['due_date'],
                    'status' => $data['status'],
                    'created_by' => $officerId,
                ]);
            }
        }

        // Ensure all students have fee assignments for all 5 fees
        $allStudentIds = User::whereHas('role', fn ($q) => $q->where('name', 'student'))->pluck('id');
        $allFees = Fee::whereIn('code', array_keys($targetFees))->get();

        foreach ($allStudentIds as $sId) {
            foreach ($allFees as $feeItem) {
                FeeAssignment::firstOrCreate(
                    ['fee_id' => $feeItem->id, 'user_id' => $sId],
                    ['status' => 'unpaid']
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversible if needed
    }
};
