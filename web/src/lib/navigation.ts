import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  History,
  ShieldCheck,
  Landmark,
  FileSpreadsheet,
  Wallet,
  BarChart3,
  FileCheck2,
  type LucideIcon,
} from "lucide-react";

export type UserRole = "student" | "officer";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
  subItems?: {
    title: string;
    href: string;
  }[];
}

export const STUDENT_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/student/dashboard",
    icon: LayoutDashboard,
    description: "Overview of your semester fees, receipts, and council updates",
  },
  {
    title: "SSC Fees",
    href: "/student/fees",
    icon: Wallet,
    badge: "2 Due",
    description: "View semester assessment fees and council contributions",
    subItems: [
      { title: "All Assessed Fees", href: "/student/fees" },
      { title: "Pay Outstanding Fee", href: "/student/payment" },
    ],
  },
  {
    title: "Record / Pay Fee",
    href: "/student/payment",
    icon: CreditCard,
    description: "Submit payment or record official fee settlement",
  },
  {
    title: "Transactions",
    href: "/student/transactions",
    icon: History,
    description: "Complete history of your payments and verification status",
    subItems: [
      { title: "Transaction History", href: "/student/transactions" },
      { title: "Submit New Payment", href: "/student/payment" },
    ],
  },
  {
    title: "Transparency Portal",
    href: "/student/transparency",
    icon: ShieldCheck,
    description: "Verified SSC budget allocations, collections, and fund usage",
  },
];

export const OFFICER_NAV_ITEMS: NavItem[] = [
  {
    title: "Officer Dashboard",
    href: "/officer/dashboard",
    icon: LayoutDashboard,
    description:
      "Council collection metrics, pending verifications, and budget status",
  },
  {
    title: "Fee Management",
    href: "/officer/fees",
    icon: FileSpreadsheet,
    description:
      "Configure semester SSC fees, schedules, and student assessments",
    subItems: [
      { title: "All Fee Schedules", href: "/officer/fees" },
      { title: "Create New Fee", href: "/officer/fees/new" },
    ],
  },
  {
    title: "Student Transactions",
    href: "/officer/transactions",
    icon: Receipt,
    badge: "Pending Queue",
    description: "Review, verify, and audit student payment records",
  },
  {
    title: "Approved Fund Usage",
    href: "/officer/funds",
    icon: Landmark,
    description: "Record and track council disbursements and project expenses",
    subItems: [
      { title: "Disbursement Ledger", href: "/officer/funds" },
      { title: "Record Fund Usage", href: "/officer/funds/new" },
    ],
  },
  {
    title: "Financial Reports",
    href: "/officer/reports",
    icon: BarChart3,
    description:
      "Generate COA-ready student council statements and audit exports",
  },
  {
    title: "Public Transparency",
    href: "/officer/transparency",
    icon: FileCheck2,
    description: "Manage published transparency records and ledger verifications",
  },
];

export const ALL_PORTAL_ROUTES = [
  {
    label: "Public Transparency View (No Account)",
    path: "/transparency",
    group: "Public Open View",
  },
  { label: "Institutional Login", path: "/login", group: "Authentication" },
  { label: "Student Registration", path: "/register", group: "Authentication" },
  {
    label: "Student Dashboard",
    path: "/student/dashboard",
    group: "Student Portal",
  },
  {
    label: "Assessed SSC Fees",
    path: "/student/fees",
    group: "Student Portal",
  },
  {
    label: "Record / Pay SSC Fee",
    path: "/student/payment",
    group: "Student Portal",
  },
  {
    label: "Student Transactions",
    path: "/student/transactions",
    group: "Student Portal",
  },
  {
    label: "Public Transparency Portal",
    path: "/student/transparency",
    group: "Student Portal",
  },
  {
    label: "Officer Executive Dashboard",
    path: "/officer/dashboard",
    group: "Officer Portal",
  },
  {
    label: "Fee Schedule Management",
    path: "/officer/fees",
    group: "Officer Portal",
  },
  {
    label: "Create New Fee Schedule",
    path: "/officer/fees/new",
    group: "Officer Portal",
  },
  {
    label: "Payment Verification Queue",
    path: "/officer/transactions",
    group: "Officer Portal",
  },
  {
    label: "Approved Fund Disbursements",
    path: "/officer/funds",
    group: "Officer Portal",
  },
  {
    label: "Record New Fund Usage",
    path: "/officer/funds/new",
    group: "Officer Portal",
  },
  {
    label: "COA Financial Reports",
    path: "/officer/reports",
    group: "Officer Portal",
  },
  {
    label: "Transparency Registry Mgmt",
    path: "/officer/transparency",
    group: "Officer Portal",
  },
];

export const ALL_PROTOTYPE_ROUTES = ALL_PORTAL_ROUTES;
