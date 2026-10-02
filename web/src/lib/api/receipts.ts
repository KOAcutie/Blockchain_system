import { apiRequest } from "./client";
import type { BackendBlockchainInfo } from "./payments";

export interface BackendReceipt {
  id: number;
  receipt_number: string;
  issued_at: string;
  status: string;
  payment_id: number;
  payment_status: "pending" | "confirmed" | "failed" | "completed" | "rejected";
  payment_method: string;
  reference_number: string;
  amount: number;
  date: string;
  student: {
    name: string;
    student_id: string | null;
    college: string;
    program: string;
  } | null;
  fee: {
    id: number;
    code: string;
    name: string;
    purpose: string;
    semester: string;
    academic_year: string;
  } | null;
  transaction_id: string | null;
  transaction_db_id: number | null;
  verified_by: string | null;
  blockchain: BackendBlockchainInfo;
}

export const receiptsApi = {
  async getReceiptById(id: string | number): Promise<BackendReceipt> {
    return apiRequest<BackendReceipt>(
      `/student/receipts/${encodeURIComponent(String(id))}`,
      {
        roleHint: "student",
      }
    );
  },

  async getReceiptByTransactionId(
    transactionId: string | number
  ): Promise<BackendReceipt> {
    return apiRequest<BackendReceipt>(
      `/student/transactions/${encodeURIComponent(
        String(transactionId)
      )}/receipt`,
      {
        roleHint: "student",
      }
    );
  },
};
