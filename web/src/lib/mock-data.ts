export interface FeeItem {
  id: string;
  code: string;
  title: string;
  semester: string;
  academicYear: string;
  amount: number;
  dueDate: string;
  category:
    | "Mandatory Council Fee"
    | "Student Publication"
    | "Student Insurance"
    | "Health & Community Extension"
    | "Departmental Fee"
    | "Campus Event Fund"
    | "Community Outreach"
    | string;
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
  studentId: "21-29199",
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
    code: "SSC-FEE-26A",
    title: "Supreme Student Council (SSC) Membership Fee",
    semester: "1st Semester",
    academicYear: "AY 2026–2027",
    amount: 100.0,
    dueDate: "October 15, 2026",
    category: "Mandatory Council Fee",
    status: "Paid",
    description:
      "Standard semester membership fee supporting student council representation, student welfare assistance, leadership programs, and public financial transparency systems.",
    resolutionNo: "SSC Resolution No. 2026-001",
    allocatedDepartments: [
      "Student Rights & Welfare (40%)",
      "Academic & Leadership Programs (30%)",
      "General Assembly & Council Operations (20%)",
      "Audit & Transparency Registry (10%)",
    ],
    collectedCount: 8420,
    totalStudents: 10250,
    ledgerRecordHash: "0x8f4e2c9a1b7d3e5f6a0c2d4e8b9a1c3f5e7d9b2a4c6e8f0a1b2c3d4e5f6a7b8c",
  },
  {
    id: "2",
    code: "KAW-PUB-26A",
    title: "Kawasa Official Student Publication Fee",
    semester: "1st Semester",
    academicYear: "AY 2026–2027",
    amount: 75.0,
    dueDate: "October 15, 2026",
    category: "Student Publication",
    status: "Paid",
    description:
      "Official student publication levy supporting investigative journalism, broadsheet printing, literary folios, and online newsletter production by Kawasa.",
    resolutionNo: "SSC Resolution No. 2026-002",
    allocatedDepartments: [
      "Broadsheet & Literary Folio Printing (60%)",
      "Digital Publishing & Investigative Equipment (25%)",
      "Press Freedom & Journalism Seminars (15%)",
    ],
    collectedCount: 8190,
    totalStudents: 10250,
    ledgerRecordHash: "0x3c7a9e1f4b8d2c6a0e5f9b3d7a1c5e8f2b4d6a0c9e3f7b1d5a8c2e4f6a9b0c1d",
  },
  {
    id: "3",
    code: "INS-SAF-26A",
    title: "Student Accident & Health Insurance Fee",
    semester: "1st Semester",
    academicYear: "AY 2026–2027",
    amount: 50.0,
    dueDate: "October 31, 2026",
    category: "Student Insurance",
    status: "Unpaid",
    description:
      "Mandatory group accident and emergency hospitalization insurance coverage for students both on-campus and during official off-campus school activities.",
    resolutionNo: "SSC Resolution No. 2026-003",
    allocatedDepartments: [
      "Accident & Medical Reimbursement Claims (70%)",
      "Emergency Hospitalization Assistance (20%)",
      "Insurance Policy Claims Administration (10%)",
    ],
    collectedCount: 6150,
    totalStudents: 10250,
    ledgerRecordHash: "0x9d2b5e8a1c4f7b0d3e6a9c2f5b8e1a4d7c0f3b6e9a2d5c8f1b4e7a0d3c6f9b2e",
  },
  {
    id: "4",
    code: "RCY-HLT-26A",
    title: "Red Cross Youth (RCY) & Health Services Fee",
    semester: "1st Semester",
    academicYear: "AY 2026–2027",
    amount: 50.0,
    dueDate: "November 15, 2026",
    category: "Health & Community Extension",
    status: "Unpaid",
    description:
      "Dedicated fund for Red Cross Youth campus emergency response, first aid station supplies, student disaster risk management, and annual voluntary blood donation drives.",
    resolutionNo: "SSC Resolution No. 2026-004",
    allocatedDepartments: [
      "First Aid Equipment & Health Supplies (50%)",
      "Emergency Response & Life Support Training (30%)",
      "Voluntary Blood Donation & Outreach Drives (20%)",
    ],
    collectedCount: 5430,
    totalStudents: 10250,
    ledgerRecordHash: "0x1a5c9e3b7d2f6a8c4e0b9d3f7a1c5e9b2d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c",
  },
  {
    id: "5",
    code: "DEP-COL-26A",
    title: "Department & College Student Council Fee",
    semester: "1st Semester",
    academicYear: "AY 2026–2027",
    amount: 100.0,
    dueDate: "November 30, 2026",
    category: "Departmental Fee",
    status: "Unpaid",
    description:
      "Departmental and collegiate student council fee supporting college-level academic conferences, specialized lab tools, research mentorship, and departmental general assemblies.",
    resolutionNo: "SSC Resolution No. 2026-005",
    allocatedDepartments: [
      "College Symposia & Academic Competitions (45%)",
      "Departmental Student Assembly & Mentorship (35%)",
      "Specialized Lab Enhancement & Student Projects (20%)",
    ],
    collectedCount: 4890,
    totalStudents: 10250,
    ledgerRecordHash: "0x5e2a8c1f4b7d3e9a0c6f2b5d8e1a4c7f0b3d6e9a2c5f8b1d4e7a0c3f6b9d2e5a",
  },
];

export const MOCK_TRANSACTIONS: TransactionItem[] = [
  {
    id: "SSC-2026-000001",
    receiptId: "SSC-RCP-2026-000001",
    referenceNo: "SSC-OR-2026-00981",
    studentName: "Maria Clara Santos",
    studentId: "21-29199",
    college: "CCIS",
    feeId: "1",
    feeTitle: "Supreme Student Council (SSC) Membership Fee",
    amount: 100.0,
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
    studentId: "21-29199",
    college: "CCIS",
    feeId: "2",
    feeTitle: "Kawasa Official Student Publication Fee",
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
    studentId: "22-30142",
    college: "College of Engineering",
    feeId: "3",
    feeTitle: "Student Accident & Health Insurance Fee",
    amount: 50.0,
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
