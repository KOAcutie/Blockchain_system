import { apiRequest } from "./client";

export interface BackendBlockchainInfo {
  status: "pending" | "submitted" | "confirmed" | "failed";
  verification_label?: "Verified" | "Pending" | "Failed";
  network?: string;
  transaction_hash: string | null;
  record_hash: string | null;
  contract_address: string | null;
  block_number: number | null;
  confirmed_at?: string | null;
  error_message?: string | null;
}

export interface BackendPayment {
  id: number;
  user_id: number;
  student?: {
    id: number;
    name: string;
    student_id: string | null;
    college: string;
  } | null;
  fee_id: number;
  fee?: {
    id: number;
    code: string;
    name: string;
    purpose: string;
    amount: number;
  } | null;
  amount: number;
  payment_method: "ewallet" | "bank_transfer" | "cash" | "other";
  reference_number: string;
  has_proof: boolean;
  proof_url: string | null;
  notes: string | null;
  rejection_reason: string | null;
  status: "pending" | "confirmed" | "failed" | "completed" | "rejected";
  recorded_at: string;
  verified_at: string | null;
  verified_by: string | null;
  transaction_id: string | null;
  transaction_db_id: number | null;
  receipt_id: number | null;
  receipt_number: string | null;
  blockchain: BackendBlockchainInfo | null;
}

export interface RecordPaymentPayload {
  fee_id: number;
  amount: number;
  payment_method: "ewallet" | "bank_transfer" | "cash" | "other";
  reference_number: string;
  notes?: string;
  proof?: File | null;
}

export interface VerifyPaymentResponse {
  payment: BackendPayment;
  transaction_id: string;
  status: string;
  blockchain: BackendBlockchainInfo;
}

export const paymentsApi = {
  async recordStudentPayment(
    payload: RecordPaymentPayload
  ): Promise<BackendPayment> {
    if (payload.proof) {
      const formData = new FormData();
      formData.append("fee_id", String(payload.fee_id));
      formData.append("amount", String(payload.amount));
      formData.append("payment_method", payload.payment_method);
      formData.append("reference_number", payload.reference_number);
      if (payload.notes) formData.append("notes", payload.notes);
      formData.append("proof", payload.proof);

      return apiRequest<BackendPayment>("/student/payments", {
        method: "POST",
        body: formData,
        roleHint: "student",
      });
    }

    return apiRequest<BackendPayment>("/student/payments", {
      method: "POST",
      body: {
        fee_id: payload.fee_id,
        amount: payload.amount,
        payment_method: payload.payment_method,
        reference_number: payload.reference_number,
        notes: payload.notes,
      },
      roleHint: "student",
    });
  },

  async getStudentPayments(): Promise<BackendPayment[]> {
    return apiRequest<BackendPayment[]>("/student/payments", {
      roleHint: "student",
    });
  },

  async getOfficerPayments(status?: string): Promise<BackendPayment[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiRequest<BackendPayment[]>(`/officer/payments${query}`, {
      roleHint: "officer",
    });
  },

  async verifyPayment(paymentId: number | string): Promise<VerifyPaymentResponse> {
    return apiRequest<VerifyPaymentResponse>(
      `/officer/payments/${paymentId}/verify`,
      {
        method: "POST",
        roleHint: "officer",
      }
    );
  },

  async rejectPayment(
    paymentId: number | string,
    reason?: string
  ): Promise<BackendPayment> {
    return apiRequest<BackendPayment>(
      `/officer/payments/${paymentId}/reject`,
      {
        method: "POST",
        body: { reason },
        roleHint: "officer",
      }
    );
  },
};
