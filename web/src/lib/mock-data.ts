export interface FeeItem {
  id: string;
  code: string;
  title: string;
  semester: string;
  academicYear: string;
  amount: number;
  dueDate: string;
  category: "Mandatory Council Fee" | "Student Publication" | "Campus Event Fund" | "Community Outreach";
  status: "Paid" | "Unpaid" | "Partial" | "Pending Verification";
  description: string;
  resolutionNo: string;
  allocatedDepartments: string[];
  collectedCount?: number;
  totalStudents?: number;
  ledgerRecordHash: string;
}

export interface TransactionItem {
  id: string;
  receiptId: string;
  referenceNo: string;
  studentName: string;
  studentId: string;
  college: string;
  feeId: string;
  feeTitle: string;
  amount: number;
  date: string;
  paymentChannel: string;
  status: "Verified" | "Pending Review" | "Flagged";
  verificationHash: string;
  blockReference: string;
  verifiedBy: string;
}

export interface FundUsageItem {
  id: string;
  resolutionNo: string;
  title: string;
  category: "Academic Initiatives" | "Student Welfare" | "Campus Events" | "Operations & Audit";
  amountApproved: number;
  amountUtilized: number;
  dateApproved: string;
  committee: string;
  status: "Verified & Published" | "Disbursed" | "Under Audit";
  verificationHash: string;
  beneficiaries: string;
  attachmentsCount: number;
}

export const MOCK_STUDENT_PROFILE = {
  name: "Maria Clara Santos",
  studentId: "2023-01482-MN-0",
  program: "BS Computer Science",
  college: "College of Computer and Information Sciences",
  yearLevel: "3rd Year",
  semester: "1st Semester, AY 2026–2027",
  email: "mcsantos@student.university.edu.ph",
};

export const MOCK_OFFICER_PROFILE = {
  name: "Juan Miguel Dela Cruz",
  position: "SSC Vice President for Finance & Audit",
  term: "AY 2026–2027 Executive Term",
  office: "Office of the Supreme Student Council, Student Union Bldg. Rm 204",
  email: "finance.ssc@university.edu.ph",
};

export const MOCK_FEES: FeeItem[] = [
  {
    id: "1",
    code: "SSC-GEN-26A",
    title: "Supreme Student Council General Membership & Welfare Fee",
    semester: "1st Semester",
    academicYear: "AY 2026–2027",
    amount: 150.0,
    dueDate: "October 15, 2026",
    category: "Mandatory Council Fee",
    status: "Paid",
    description:
      "Standard semester membership fee supporting student representation, legal and medical assistance funds, academic competitions, and student rights welfare programs.",
    resolutionNo: "SSC Resolution No. 2026-004",
    allocatedDepartments: [
      "Student Welfare & Assistance (40%)",
      "Academic & Leadership Programs (30%)",
      "General Assembly & Council Operations (20%)",
      "Audit & Transparency Systems (10%)",
    ],
    collectedCount: 8420,
    totalStudents: 10250,
    ledgerRecordHash: "0x8f4e2c9a1b7d3e5f6a0c2d4e8b9a1c3f5e7d9b2a4c6e8f0a1b2c3d4e5f6a7b8c",
  },
  {
    id: "2",
    code: "SSC-PUB-26A",
    title: "Official Student Publication & Campus Press Levy",
    semester: "1st Semester",
    academicYear: "AY 2026–2027",
    amount: 75.0,
    dueDate: "October 15, 2026",
    category: "Student Publication",
    status: "Paid",
    description:
      "Supports printing, investigative reporting, and digital publishing of the official university student newspaper and annual transparency journal.",
    resolutionNo: "SSC Resolution No. 2026-005",
    allocatedDepartments: [
      "Print & Digital Broadsheet Production (65%)",
      "Campus Journalism Training & Press Freedom Fund (25%)",
      "Annual Financial Transparency Supplement (10%)",
    ],
    collectedCount: 8190,
    totalStudents: 10250,
    ledgerRecordHash: "0x3c7a9e1f4b8d2c6a0e5f9b3d7a1c5e8f2b4d6a0c9e3f7b1d5a8c2e4f6a9b0c1d",
  },
  {
    id: "3",
    code: "SSC-UNI-26A",
    title: "University Foundation Week & Inter-College Cultural Fund",
    semester: "1st Semester",
    academicYear: "AY 2026–2027",
    amount: 120.0,
    dueDate: "November 05, 2026",
    category: "Campus Event Fund",
    status: "Unpaid",
    description:
      "Dedicated contribution for student-led academic symposia, inter-college sports and cultural delegations, and university-wide student assemblies.",
    resolutionNo: "SSC Resolution No. 2026-009",
    allocatedDepartments: [
      "Inter-College Academic & Cultural Competitions (50%)",
      "Student Organizations Grant Pool (35%)",
      "Venue, Safety & Medical Standby Logistics (15%)",
    ],
    collectedCount: 5640,
    totalStudents: 10250,
    ledgerRecordHash: "0x9d2b5e8a1c4f7b0d3e6a9c2f5b8e1a4d7c0f3b6e9a2d5c8f1b4e7a0d3c6f9b2e",
  },
  {
    id: "4",
    code: "SSC-COM-26A",
    title: "SSC Community Extension & Disaster Relief Reserve",
    semester: "1st Semester",
    academicYear: "AY 2026–2027",
    amount: 50.0,
    dueDate: "November 20, 2026",
    category: "Community Outreach",
    status: "Unpaid",
    description:
      "Student-governed emergency relief and community literacy outreach fund audited jointly by the SSC Finance Committee and Student COA.",
    resolutionNo: "SSC Resolution No. 2026-011",
    allocatedDepartments: [
      "Student Emergency Calamity Assistance (60%)",
      "Partner Community Literacy & Health Drives (40%)",
    ],
    collectedCount: 4910,
    totalStudents: 10250,
    ledgerRecordHash: "0x1a5c9e3b7d2f6a8c4e0b9d3f7a1c5e9b2d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c",
  },
];

export const MOCK_TRANSACTIONS: TransactionItem[] = [
  {
    id: "SSC-2026-000001",
    receiptId: "SSC-RCP-2026-000001",
    referenceNo: "SSC-OR-2026-00981",
    studentName: "Maria Clara Santos",
    studentId: "2023-01482-MN-0",
    college: "CCIS",
    feeId: "1",
    feeTitle: "SSC General Membership & Welfare Fee",
    amount: 150.0,
    date: "September 24, 2026 • 10:14 AM",
    paymentChannel: "University Cashier / LandBank Portal",
    status: "Verified",
    verificationHash: "0x7f9c2e4a8b1d6f3c5a9e0b2d4f8a1c7e3b9d5f1a6c2e8b4d0f7a3c9e5b1d8f4a",
    blockReference: "Block #148,920 • Institutional Audit Ledger",
    verifiedBy: "SSC Finance Committee Automated Attestation",
  },
  {
    id: "SSC-2026-000002",
    receiptId: "SSC-RCP-2026-000002",
    referenceNo: "SSC-OR-2026-00944",
    studentName: "Maria Clara Santos",
    studentId: "2023-01482-MN-0",
    college: "CCIS",
    feeId: "2",
    feeTitle: "Official Student Publication & Campus Press Levy",
    amount: 75.0,
    date: "September 20, 2026 • 02:45 PM",
    paymentChannel: "GCash Institutional Merchant",
    status: "Verified",
    verificationHash: "0x4b8d1f6a3c9e2b7d5f0a8c4e1b9d6f2a7c3e8b5d1f9a4c6e0b2d8f3a7c1e5b9d",
    blockReference: "Block #148,412 • Institutional Audit Ledger",
    verifiedBy: "SSC Finance Committee Automated Attestation",
  },
  {
    id: "SSC-2026-000003",
    receiptId: "SSC-RCP-2026-000003",
    referenceNo: "SSC-OR-2026-01012",
    studentName: "Jose Protacio Rizal",
    studentId: "2026-0002",
    college: "College of Engineering",
    feeId: "3",
    feeTitle: "University Foundation Week & Cultural Fund",
    amount: 120.0,
    date: "September 28, 2026 • 04:10 PM",
    paymentChannel: "Maya / QR Ph",
    status: "Pending Review",
    verificationHash: "0x9e3a7c1f5b8d2e6a4c0f9b3d7e1a5c8f2b6d0e4a8c2f6b0d4e8a2c6f0b4d8e2a",
    blockReference: "Pending Ledger Anchoring",
    verifiedBy: "Awaiting Officer Counter-Signature",
  },
];

export const MOCK_FUND_USAGES: FundUsageItem[] = [
  {
    id: "1",
    resolutionNo: "SSC Appropriation Act No. 2026-012",
    title: "Student Emergency Medical & Hospitalization Assistance Batch 1",
    category: "Student Welfare",
    amountApproved: 320000.0,
    amountUtilized: 285400.0,
    dateApproved: "September 12, 2026",
    committee: "Student Rights & Welfare Committee",
    status: "Verified & Published",
    verificationHash: "0x6a1c5e9b3d7f2a4c8e0b6d2f8a4c0e6b2d8f4a0c6e2b8d4f0a6c2e8b4d0f6a2c",
    beneficiaries: "42 Verified Student Grantees across 8 Colleges",
    attachmentsCount: 6,
  },
  {
    id: "fund-2026-02",
    resolutionNo: "SSC Appropriation Act No. 2026-015",
    title: "1st Semester Open-Access Printing & Research Hub Supplies",
    category: "Academic Initiatives",
    amountApproved: 180000.0,
    amountUtilized: 174250.0,
    dateApproved: "September 18, 2026",
    committee: "Academic Affairs & Research Committee",
    status: "Verified & Published",
    verificationHash: "0x5e9b3d7f1a4c8e2b6d0f5a9c3e7b1d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c6e0b",
    beneficiaries: "Free printing service for 3,100+ students at SSC Study Hub",
    attachmentsCount: 9,
  },
  {
    id: "fund-2026-03",
    resolutionNo: "SSC Appropriation Act No. 2026-019",
    title: "Freshmen Orientation & Student Organizations Fair 2026",
    category: "Campus Events",
    amountApproved: 210000.0,
    amountUtilized: 198600.0,
    dateApproved: "September 22, 2026",
    committee: "Campus Activities & Secretariat",
    status: "Disbursed",
    verificationHash: "0x8c2e6b0d4f8a1c5e9b3d7f2a6c0e4b8d2f6a0c4e8b2d6f0a4c8e2b6d0f4a8c2e",
    beneficiaries: "3,400 First-Year Students & 64 Accredited Student Orgs",
    attachmentsCount: 11,
  },
  {
    id: "fund-2026-04",
    resolutionNo: "SSC Appropriation Act No. 2026-022",
    title: "Independent Student Commission on Audit (SCOA) Digital Archiving",
    category: "Operations & Audit",
    amountApproved: 65000.0,
    amountUtilized: 42000.0,
    dateApproved: "September 26, 2026",
    committee: "Finance & Transparency Oversight",
    status: "Under Audit",
    verificationHash: "0x1f5a9c3e7b2d6f0a4c8e1b5d9f3a7c1e5b9d3f7a1c5e9b3d7f1a5c9e3b7d1f5a",
    beneficiaries: "University-wide Public Financial Transparency Registry",
    attachmentsCount: 4,
  },
];
