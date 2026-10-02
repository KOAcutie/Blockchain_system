import { apiRequest } from "./client";
import type { FundUsageItem } from "@/lib/mock-data";

export interface BackendFundUsage {
  id: number;
  purpose: string;
  title?: string;
  description: string;
  category: string;
  amount: number;
  approved_budget: number;
  date: string;
  approval_reference: string;
  committee: string;
  beneficiaries: string;
  notes: string | null;
  status: "draft" | "approved" | "published" | "archived";
  record_hash: string | null;
  published_at: string | null;
}

export interface CreateOrUpdateFundPayload {
  purpose: string;
  description: string;
  category: string;
  amount: number;
  approved_budget?: number;
  date: string;
  approval_reference: string;
  committee?: string;
  beneficiaries?: string;
  notes?: string;
  status?: "draft" | "approved" | "published" | "archived";
  supporting_document?: File | null;
}

export function mapBackendFundToUi(item: BackendFundUsage): FundUsageItem {
  const validCategories: FundUsageItem["category"][] = [
    "Academic Initiatives",
    "Student Welfare",
    "Campus Events",
    "Operations & Audit",
  ];

  const category = validCategories.includes(
    item.category as FundUsageItem["category"]
  )
    ? (item.category as FundUsageItem["category"])
    : "Student Welfare";

  const status: FundUsageItem["status"] =
    item.status === "published"
      ? "Verified & Published"
      : item.status === "approved"
      ? "Disbursed"
      : "Under Audit";

  return {
    id: String(item.id),
    resolutionNo: item.approval_reference,
    title: item.purpose,
    category,
    amountApproved: Number(item.approved_budget || item.amount),
    amountUtilized: Number(item.amount),
    dateApproved: item.date,
    committee: item.committee || "SSC Finance & Audit Committee",
    status,
    verificationHash:
      item.record_hash ||
      "0x6a1c5e9b3d7f2a4c8e0b6d2f8a4c0e6b2d8f4a0c6e2b8d4f0a6c2e8b4d0f6a2c",
    beneficiaries: item.beneficiaries || "University Student Body",
    attachmentsCount: 3,
  };
}

export const fundsApi = {
  async getOfficerFunds(): Promise<FundUsageItem[]> {
    const data = await apiRequest<BackendFundUsage[]>("/officer/funds", {
      roleHint: "officer",
    });
    return data.map(mapBackendFundToUi);
  },

  async createFundUsage(
    payload: CreateOrUpdateFundPayload
  ): Promise<FundUsageItem> {
    if (payload.supporting_document instanceof File) {
      const formData = new FormData();
      formData.append("purpose", payload.purpose);
      formData.append("description", payload.description);
      formData.append("category", payload.category);
      formData.append("amount", String(payload.amount));
      if (payload.approved_budget !== undefined) {
        formData.append("approved_budget", String(payload.approved_budget));
      }
      formData.append("date", payload.date);
      formData.append("approval_reference", payload.approval_reference);
      if (payload.committee) formData.append("committee", payload.committee);
      if (payload.beneficiaries) {
        formData.append("beneficiaries", payload.beneficiaries);
      }
      if (payload.notes) formData.append("notes", payload.notes);
      if (payload.status) formData.append("status", payload.status);
      formData.append("supporting_document", payload.supporting_document);

      const data = await apiRequest<BackendFundUsage>("/officer/funds", {
        method: "POST",
        body: formData,
        roleHint: "officer",
      });
      return mapBackendFundToUi(data);
    }

    const data = await apiRequest<BackendFundUsage>("/officer/funds", {
      method: "POST",
      body: payload,
      roleHint: "officer",
    });
    return mapBackendFundToUi(data);
  },

  async updateFundUsage(
    id: string | number,
    payload: Partial<CreateOrUpdateFundPayload>
  ): Promise<FundUsageItem> {
    const data = await apiRequest<BackendFundUsage>(`/officer/funds/${id}`, {
      method: "PUT",
      body: payload,
      roleHint: "officer",
    });
    return mapBackendFundToUi(data);
  },

  async publishFundUsage(id: string | number): Promise<FundUsageItem> {
    const data = await apiRequest<BackendFundUsage>(
      `/officer/funds/${id}/publish`,
      {
        method: "POST",
        roleHint: "officer",
      }
    );
    return mapBackendFundToUi(data);
  },
};
