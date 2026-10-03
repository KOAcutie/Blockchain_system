import { apiRequest } from "./client";
import type { BackendBlockchainInfo } from "./payments";
import type { TransactionItem } from "@/lib/mock-data";

export interface BackendTransaction {
  id: number;
  transaction_id: string;
  payment_id: number;
  amount: number;
  status: "pending" | "confirmed" | "failed" | "rejected";
  payment_status: "pending" | "confirmed" | "failed" | "completed" | "rejected";
  payment_method: string;
  reference_number: string;
  confirmed_at: string | null;
  created_at: string;
  student: {
    id: number;
    name: string;
    student_id: string | null;
    college: string;
  } | null;
  fee: {
    id: number;
    code: string;
    name: string;
    purpose: string;
    amount: number;
  } | null;
  receipt: {
    id: number;
    receipt_number: string;
    issued_at: string;
    status: string;
  } | null;
  verified_by: string | null;
  blockchain: BackendBlockchainInfo;
  verification?: {
    verified: boolean;
    record_hash_matches: boolean;
    transaction_confirmed: boolean;
    block_number: number | null;
    transaction_hash: string | null;
    record_hash: string;
    contract_address: string | null;
    status: string;
  };
}

export interface ExtendedTransactionItem extends TransactionItem {
  paymentId: number;
  paymentStatus: "Confirmed" | "Pending" | "Rejected" | "Failed";
  blockchainVerification: "Verified" | "Pending" | "Failed";
  blockchainTransactionHash: string | null;
  recordHash: string;
  contractAddress: string | null;
  blockNumber: number | null;
  network: string;
  errorMessage?: string | null;
}

export function mapBackendTransactionToUi(
  tx: BackendTransaction
): ExtendedTransactionItem {
  const bcStatus = tx.blockchain?.status || "pending";
  const blockchainVerification: "Verified" | "Pending" | "Failed" =
    bcStatus === "confirmed"
      ? "Verified"
      : bcStatus === "failed"
      ? "Failed"
      : "Pending";

  const paymentStatus: "Confirmed" | "Pending" | "Rejected" | "Failed" =
    tx.payment_status === "confirmed" || tx.payment_status === "completed"
      ? "Confirmed"
      : tx.payment_status === "rejected"
      ? "Rejected"
      : tx.payment_status === "failed"
      ? "Failed"
      : "Pending";

  const methodLabels: Record<string, string> = {
    ewallet: "GCash / Maya e-Wallet",
    bank_transfer: "University Cashier / LandBank Portal",
    cash: "University Cashier Counter",
    other: "SSC Finance Office Booth",
  };

  return {
    id: tx.transaction_id,
    paymentId: tx.payment_id,
    receiptId: tx.receipt?.receipt_number || `SSC-RCP-${tx.payment_id}`,
    referenceNo: tx.reference_number || tx.transaction_id,
    studentName: tx.student?.name || "Demo Student",
    studentId: tx.student?.student_id || "21-29199",
    college: tx.student?.college || "CCIS",
    feeId: String(tx.fee?.id || "1"),
    feeTitle: tx.fee?.name || "SSC Semester Fee",
    amount: Number(tx.amount),
    date: tx.confirmed_at || tx.created_at || new Date().toISOString(),
    paymentChannel:
      methodLabels[tx.payment_method] || tx.payment_method || "Cashier",
    status:
      paymentStatus === "Confirmed"
        ? "Verified"
        : paymentStatus === "Rejected"
        ? "Flagged"
        : "Pending Review",
    verificationHash:
      tx.blockchain?.record_hash || "0x00000000000000000000000000000000",
    blockReference:
      blockchainVerification === "Verified" && tx.blockchain?.block_number
        ? `Block #${tx.blockchain.block_number} • ${
            tx.blockchain.network || "localhost"
          }`
        : blockchainVerification === "Failed"
        ? "Blockchain Submission Failed"
        : "Pending Ledger Anchoring",
    verifiedBy: tx.verified_by || "Awaiting Officer Counter-Signature",
    paymentStatus,
    blockchainVerification,
    blockchainTransactionHash: tx.blockchain?.transaction_hash || null,
    recordHash: tx.blockchain?.record_hash || "",
    contractAddress: tx.blockchain?.contract_address || null,
    blockNumber: tx.blockchain?.block_number ?? null,
    network: tx.blockchain?.network || "localhost",
    errorMessage: tx.blockchain?.error_message || null,
  };
}

export const transactionsApi = {
  async getStudentTransactions(): Promise<ExtendedTransactionItem[]> {
    const data = await apiRequest<BackendTransaction[]>(
      "/student/transactions",
      {
        roleHint: "student",
      }
    );
    return data.map(mapBackendTransactionToUi);
  },

  async getStudentTransactionById(
    id: string | number,
    liveVerify = false
  ): Promise<ExtendedTransactionItem> {
    const query = liveVerify ? "?verify=1" : "";
    const data = await apiRequest<BackendTransaction>(
      `/student/transactions/${encodeURIComponent(String(id))}${query}`,
      {
        roleHint: "student",
      }
    );
    return mapBackendTransactionToUi(data);
  },

  async getOfficerTransactions(
    status?: string
  ): Promise<ExtendedTransactionItem[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const data = await apiRequest<BackendTransaction[]>(
      `/officer/transactions${query}`,
      {
        roleHint: "officer",
      }
    );
    return data.map(mapBackendTransactionToUi);
  },

  async verifyBlockchainRecord(transactionId: string): Promise<{
    verified: boolean;
    record_hash_matches: boolean;
    transaction_confirmed: boolean;
    block_number: number | null;
    transaction_hash: string | null;
    record_hash: string;
    contract_address: string | null;
    status: string;
  }> {
    try {
      return await apiRequest("/blockchain/verify", {
        method: "POST",
        body: { transaction_id: transactionId },
        roleHint: "student",
      });
    } catch {
      // Fallback to public transparency verification endpoint
      const res = await apiRequest<{
        verified: boolean;
        block_number?: number | null;
        record_hash?: string;
        contract_address?: string | null;
        status?: string;
      }>("/transparency/verify", {
        method: "POST",
        body: { query: transactionId },
        requireAuth: false,
      });

      return {
        verified: Boolean(res.verified),
        record_hash_matches: Boolean(res.verified),
        transaction_confirmed: Boolean(res.verified),
        block_number: res.block_number ?? 11832631,
        transaction_hash: null,
        record_hash: res.record_hash || "0x00000000000000000000000000000000",
        contract_address: res.contract_address || null,
        status: res.status || (res.verified ? "confirmed" : "pending"),
      };
    }
  },

  async retryBlockchainSubmission(transactionId: string): Promise<{
    transaction_id: string;
    status: string;
    blockchain: BackendBlockchainInfo;
  }> {
    return apiRequest("/blockchain/transactions", {
      method: "POST",
      body: { transaction_id: transactionId },
      roleHint: "officer",
    });
  },
};
