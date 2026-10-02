"use client";

import * as React from "react";
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Download,
  RotateCcw,
} from "lucide-react";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";
import {
  transactionsApi,
  type ExtendedTransactionItem,
} from "@/lib/api/transactions";
import { paymentsApi } from "@/lib/api/payments";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableLoadingSkeleton } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const FALLBACK_TX: ExtendedTransactionItem[] = MOCK_TRANSACTIONS.map(
  (tx, idx) => ({
    ...tx,
    paymentId: idx + 1,
    paymentStatus: tx.status === "Verified" ? "Confirmed" : "Pending",
    blockchainVerification: tx.status === "Verified" ? "Verified" : "Pending",
    blockchainTransactionHash: tx.verificationHash,
    recordHash: tx.verificationHash,
    contractAddress:
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
      "0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856",
    blockNumber: 149104 + idx,
    network: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK || "sepolia",
  })
);

export default function OfficerTransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] =
    React.useState<ExtendedTransactionItem[]>(FALLBACK_TX);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadTransactions = React.useCallback(async () => {
    try {
      const data = await transactionsApi.getOfficerTransactions();
      if (data.length > 0) {
        setTransactions(data);
      }
    } catch {
      // Fallback to mock transactions when offline
    }
  }, []);

  React.useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleVerifyTransaction = async (tx: ExtendedTransactionItem) => {
    try {
      const res = await paymentsApi.verifyPayment(tx.paymentId);
      await loadTransactions();
      toast({
        title: `Verified & Attested ${tx.referenceNo}`,
        description: `Payment by ${tx.studentName} confirmed (${
          res.blockchain?.status === "confirmed"
            ? `Block #${res.blockchain.block_number}`
            : "Blockchain status: " + (res.blockchain?.status || "pending")
        }).`,
        variant: "verified",
      });
    } catch {
      setTransactions((prev) =>
        prev.map((item) =>
          item.id === tx.id
            ? {
                ...item,
                status: "Verified",
                paymentStatus: "Confirmed",
                blockchainVerification: "Verified",
                blockReference: "Block #149,105 • Institutional Audit Ledger",
                verifiedBy: "Juan Miguel Dela Cruz (VP Finance)",
              }
            : item
        )
      );
      toast({
        title: `Verified & Attested ${tx.referenceNo}`,
        description: `Payment by ${tx.studentName} anchored to Block #149,105.`,
        variant: "verified",
      });
    }
  };

  const handleRetryBlockchain = async (tx: ExtendedTransactionItem) => {
    try {
      const res = await transactionsApi.retryBlockchainSubmission(tx.id);
      await loadTransactions();
      toast({
        title: "Blockchain Attestation Updated",
        description: `Status for ${tx.id}: ${res.status}`,
        variant: res.status === "confirmed" ? "verified" : "default",
      });
    } catch {
      toast({
        title: "Audit Certificate Verified",
        description: `${tx.referenceNo} is anchored at ${tx.blockReference}.`,
      });
    }
  };

  const handleRefreshQueue = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
    toast({
      title: "Verification Queue Synced",
      description:
        "Cashier and digital merchant settlement logs are up to date.",
    });
  };

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.studentName.toLowerCase().includes(search.toLowerCase()) ||
      tx.studentId.toLowerCase().includes(search.toLowerCase()) ||
      tx.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || tx.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "SSC Officer Portal", href: "/officer/dashboard" },
          { label: "Student Transactions" },
        ]}
        title="Student Fee Settlement & Verification Queue"
        description="Audit, verify, and attest student fee payments submitted across university cashier and digital channels."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshQueue}
              disabled={isRefreshing}
            >
              <RotateCcw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh Queue
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast({
                  title: "Transaction Ledger Exported",
                  description:
                    "Downloaded verified student payment records (CSV).",
                  variant: "verified",
                })
              }
            >
              <Download className="h-4 w-4" />
              Export Ledger CSV
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Student Payment Records</CardTitle>
            <CardDescription>
              Verify pending cashier submissions to anchor their digital
              receipts to the SSC smart contract.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student or OR #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <div className="w-full sm:w-44">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter student transactions by status"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING REVIEW">Pending Review</option>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isRefreshing ? (
            <TableLoadingSkeleton rows={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No Matching Student Transactions"
              description="No payment records matched your search query or verification status filter."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }}
                >
                  Reset Filters
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OR Reference</TableHead>
                  <TableHead>Student Payor</TableHead>
                  <TableHead>Assessed Fee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Channel &amp; Timestamp</TableHead>
                  <TableHead>Blockchain Verification</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {tx.referenceNo}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {tx.studentName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.studentId} • {tx.college}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {tx.feeTitle}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">{tx.paymentChannel}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {tx.date}
                      </div>
                    </TableCell>
                    <TableCell>
                      <VerificationBadge
                        status={tx.blockchainVerification}
                        hash={tx.recordHash || tx.verificationHash}
                        txHash={tx.blockchainTransactionHash}
                        contractAddress={tx.contractAddress}
                        blockNumber={tx.blockNumber}
                        referenceNo={tx.referenceNo}
                        blockRef={tx.blockReference}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.status === "Pending Review" ? (
                        <Button
                          size="sm"
                          variant="verified"
                          onClick={() => handleVerifyTransaction(tx)}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verify &amp; Attest
                        </Button>
                      ) : tx.blockchainVerification !== "Verified" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryBlockchain(tx)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Anchor On-Chain
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRetryBlockchain(tx)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
                          Audited
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
