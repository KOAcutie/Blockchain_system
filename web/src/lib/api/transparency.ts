import { apiRequest } from "./client";
import { mapBackendFundToUi, type BackendFundUsage } from "./funds";
import type { FeeItem, FundUsageItem } from "@/lib/mock-data";

export interface TransparencySummary {
  total_collections: number;
  total_approved_budget?: number;
  total_expenses: number;
  recorded_balance: number;
  published_records: number;
  verified_transactions_count?: number;
  active_fees_count?: number;
  contract_address?: string;
  semester?: string;
}

export interface TransparencyCollectionItem {
  fee_id: number;
  code: string;
  name: string;
  purpose: string;
  description?: string;
  category: string;
  semester: string;
  academic_year: string;
  resolution_no?: string;
  allocated_departments?: string[];
  due_date?: string;
  unit_amount: number;
  confirmed_payments_count: number;
  assigned_students_count: number;
  total_collected: number;
  record_hash?: string;
}

export interface PublicLedgerEntry {
  id: string;
  record_type: string;
  reference: string;
  secondary_reference: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  block_number: number;
  contract_address: string;
  verification_hash: string;
  status: string;
}

export interface PublicVerificationResult {
  verified: boolean;
  record_type: string;
  reference: string;
  secondary_reference?: string | null;
  title: string;
  amount: number;
  status: string;
  timestamp?: string | null;
  block_number?: number | null;
  contract_address: string;
  record_hash: string;
}

export interface TransparencyOverview {
  summary: TransparencySummary;
  collections: TransparencyCollectionItem[];
  fees: FeeItem[];
  funds: FundUsageItem[];
  ledger: PublicLedgerEntry[];
}

export function mapCollectionToFeeItem(item: TransparencyCollectionItem): FeeItem {
  const validCategories: FeeItem["category"][] = [
    "Mandatory Council Fee",
    "Student Publication",
    "Campus Event Fund",
    "Community Outreach",
  ];
  const category = validCategories.includes(item.category as FeeItem["category"])
    ? (item.category as FeeItem["category"])
    : "Mandatory Council Fee";

  return {
    id: String(item.fee_id),
    code: item.code,
    title: item.name,
    semester: item.semester || "1st Semester",
    academicYear: item.academic_year || "AY 2026–2027",
    amount: Number(item.unit_amount),
    dueDate: item.due_date || "October 15, 2026",
    category,
    status: "Paid",
    description: item.description || item.purpose,
    resolutionNo: item.resolution_no || `SSC Resolution No. 2026-00${item.fee_id}`,
    allocatedDepartments: item.allocated_departments || [
      "Student Welfare & Assistance (40%)",
      "Academic & Leadership Programs (30%)",
      "General Assembly & Council Operations (20%)",
      "Audit & Transparency Systems (10%)",
    ],
    collectedCount: Number(item.confirmed_payments_count || 0),
    totalStudents: Number(item.assigned_students_count || 1),
    ledgerRecordHash:
      item.record_hash ||
      "0x8f4e2c9a1b7d3e5f6a0c2d4e8b9a1c3f5e7d9b2a4c6e8f0a1b2c3d4e5f6a7b8c",
  };
}

export const transparencyApi = {
  async getTransparencyOverview(): Promise<TransparencyOverview> {
    const data = await apiRequest<{
      summary: TransparencySummary;
      collections: TransparencyCollectionItem[];
      funds: BackendFundUsage[];
      ledger?: PublicLedgerEntry[];
    }>("/transparency", {
      requireAuth: false,
    });

    const collections = data.collections || [];
    return {
      summary: data.summary,
      collections,
      fees: collections.map(mapCollectionToFeeItem),
      funds: (data.funds || []).map(mapBackendFundToUi),
      ledger: data.ledger || [],
    };
  },

  async getSummary(): Promise<TransparencySummary> {
    return apiRequest<TransparencySummary>("/transparency/summary", {
      requireAuth: false,
    });
  },

  async getCollections(): Promise<TransparencyCollectionItem[]> {
    return apiRequest<TransparencyCollectionItem[]>(
      "/transparency/collections",
      {
        requireAuth: false,
      }
    );
  },

  async getPublishedFunds(): Promise<FundUsageItem[]> {
    const data = await apiRequest<BackendFundUsage[]>("/transparency/funds", {
      requireAuth: false,
    });
    return data.map(mapBackendFundToUi);
  },

  async getPublicLedger(): Promise<PublicLedgerEntry[]> {
    return apiRequest<PublicLedgerEntry[]>("/transparency/ledger", {
      requireAuth: false,
    });
  },

  async verifyPublicRecord(query: string): Promise<PublicVerificationResult> {
    return apiRequest<PublicVerificationResult>(
      `/transparency/verify?q=${encodeURIComponent(query.trim())}`,
      {
        requireAuth: false,
      }
    );
  },
};

