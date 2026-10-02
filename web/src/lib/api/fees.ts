import { apiRequest } from "./client";
import type { FeeItem } from "@/lib/mock-data";

export interface BackendFee {
  id: number;
  code: string;
  name: string;
  title?: string;
  purpose: string;
  description: string | null;
  category: string;
  semester: string;
  academic_year: string;
  resolution_no: string;
  allocated_departments: string[];
  amount: number;
  due_date: string;
  status: "draft" | "active" | "closed" | "archived";
  assignment_status?: "unpaid" | "pending_verification" | "paid" | "partial" | "waived" | null;
  collected_count?: number;
  total_students?: number;
}

export interface CreateOrUpdateFeePayload {
  code?: string;
  name: string;
  purpose: string;
  description?: string;
  category?: string;
  semester?: string;
  academic_year?: string;
  resolution_no?: string;
  allocated_departments?: string[];
  amount: number;
  due_date: string;
  status?: "draft" | "active" | "closed" | "archived";
  assign_to_all_students?: boolean;
}

export function mapBackendFeeToUi(fee: BackendFee): FeeItem {
  const statusMap: Record<string, FeeItem["status"]> = {
    paid: "Paid",
    pending_verification: "Pending Verification",
    partial: "Partial",
    unpaid: "Unpaid",
  };

  const validCategories: FeeItem["category"][] = [
    "Mandatory Council Fee",
    "Student Publication",
    "Campus Event Fund",
    "Community Outreach",
  ];

  const category = validCategories.includes(fee.category as FeeItem["category"])
    ? (fee.category as FeeItem["category"])
    : "Mandatory Council Fee";

  return {
    id: String(fee.id),
    code: fee.code || `SSC-FEE-${fee.id}`,
    title: fee.name,
    semester: fee.semester || "1st Semester",
    academicYear: fee.academic_year || "AY 2026–2027",
    amount: Number(fee.amount),
    dueDate: fee.due_date,
    category,
    status: fee.assignment_status
      ? statusMap[fee.assignment_status] || "Unpaid"
      : fee.status === "active"
      ? "Unpaid"
      : "Paid",
    description: fee.description || fee.purpose,
    resolutionNo: fee.resolution_no || "SSC Resolution No. 2026-004",
    allocatedDepartments:
      fee.allocated_departments && fee.allocated_departments.length > 0
        ? fee.allocated_departments
        : ["Student Welfare & Assistance (100%)"],
    collectedCount: fee.collected_count ?? 0,
    totalStudents: fee.total_students ?? 1,
    ledgerRecordHash: `0x${String(fee.code || fee.id)
      .split("")
      .map((c) => c.charCodeAt(0).toString(16))
      .join("")
      .padEnd(64, "a")
      .slice(0, 64)}`,
  };
}

export const feesApi = {
  async getStudentFees(): Promise<FeeItem[]> {
    const data = await apiRequest<BackendFee[]>("/student/fees", {
      roleHint: "student",
    });
    return data.map(mapBackendFeeToUi);
  },

  async getStudentFeeById(id: string | number): Promise<FeeItem> {
    const data = await apiRequest<BackendFee>(`/student/fees/${id}`, {
      roleHint: "student",
    });
    return mapBackendFeeToUi(data);
  },

  async getOfficerFees(): Promise<FeeItem[]> {
    const data = await apiRequest<BackendFee[]>("/fees", {
      roleHint: "officer",
    });
    return data.map(mapBackendFeeToUi);
  },

  async getFeeById(
    id: string | number,
    roleHint: "student" | "officer" = "officer"
  ): Promise<FeeItem> {
    const endpoint =
      roleHint === "student" ? `/student/fees/${id}` : `/fees/${id}`;
    const data = await apiRequest<BackendFee>(endpoint, { roleHint });
    return mapBackendFeeToUi(data);
  },

  async createFee(payload: CreateOrUpdateFeePayload): Promise<FeeItem> {
    const data = await apiRequest<BackendFee>("/fees", {
      method: "POST",
      body: payload,
      roleHint: "officer",
    });
    return mapBackendFeeToUi(data);
  },

  async updateFee(
    id: string | number,
    payload: Partial<CreateOrUpdateFeePayload>
  ): Promise<FeeItem> {
    const data = await apiRequest<BackendFee>(`/fees/${id}`, {
      method: "PUT",
      body: payload,
      roleHint: "officer",
    });
    return mapBackendFeeToUi(data);
  },

  async deleteFee(id: string | number): Promise<void> {
    await apiRequest(`/fees/${id}`, {
      method: "DELETE",
      roleHint: "officer",
    });
  },
};
