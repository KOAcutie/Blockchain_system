import { apiRequest } from "./client";
import type { BackendTransaction } from "./transactions";
import type { BackendFundUsage } from "./funds";

export interface ReportFilterParams {
  from?: string;
  to?: string;
  status?: string;
  fee_id?: string | number;
  category?: string;
}

export interface ReportSummaryResponse {
  total_collections: number;
  pending_collections: number;
  total_expenses: number;
  net_balance: number;
  confirmed_transactions_count: number;
  blockchain_metrics: {
    confirmed: number;
    pending: number;
    failed: number;
  };
}

export interface ReportCollectionsResponse {
  filters: Record<string, unknown>;
  total_collected: number;
  items: {
    fee_id: number;
    code: string;
    name: string;
    category: string;
    unit_amount: number;
    payments_count: number;
    assigned_students: number;
    collected_amount: number;
    target_amount: number;
    collection_rate: number;
  }[];
}

export interface ReportTransactionsResponse {
  filters: Record<string, unknown>;
  count: number;
  total_amount: number;
  items: BackendTransaction[];
}

export interface ReportFundsResponse {
  filters: Record<string, unknown>;
  count: number;
  total_amount: number;
  by_category: {
    category: string;
    count: number;
    total_amount: number;
    approved_budget: number;
  }[];
  items: BackendFundUsage[];
}

function buildQuery(params?: ReportFilterParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.status) search.set("status", params.status);
  if (params.fee_id !== undefined && params.fee_id !== "")
    search.set("fee_id", String(params.fee_id));
  if (params.category) search.set("category", params.category);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const reportsApi = {
  async getSummary(
    params?: ReportFilterParams
  ): Promise<ReportSummaryResponse> {
    return apiRequest<ReportSummaryResponse>(
      `/officer/reports/summary${buildQuery(params)}`,
      {
        roleHint: "officer",
      }
    );
  },

  async getCollections(
    params?: ReportFilterParams
  ): Promise<ReportCollectionsResponse> {
    return apiRequest<ReportCollectionsResponse>(
      `/officer/reports/collections${buildQuery(params)}`,
      {
        roleHint: "officer",
      }
    );
  },

  async getTransactions(
    params?: ReportFilterParams
  ): Promise<ReportTransactionsResponse> {
    return apiRequest<ReportTransactionsResponse>(
      `/officer/reports/transactions${buildQuery(params)}`,
      {
        roleHint: "officer",
      }
    );
  },

  async getFunds(params?: ReportFilterParams): Promise<ReportFundsResponse> {
    return apiRequest<ReportFundsResponse>(
      `/officer/reports/funds${buildQuery(params)}`,
      {
        roleHint: "officer",
      }
    );
  },
};
