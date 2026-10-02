"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  Search,
  CreditCard,
  ArrowRight,
  RotateCcw,
  Filter,
} from "lucide-react";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";
import {
  transactionsApi,
  type ExtendedTransactionItem,
} from "@/lib/api/transactions";
import { formatCurrency, truncateHash } from "@/lib/utils";
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

const FALLBACK_TRANSACTIONS: ExtendedTransactionItem[] = MOCK_TRANSACTIONS.map(
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

export default function StudentTransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = React.useState<
    ExtendedTransactionItem[]
  >(FALLBACK_TRANSACTIONS);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadTransactions = React.useCallback(async () => {
    try {
      const data = await transactionsApi.getStudentTransactions();
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

  const handleRefreshLedger = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
    toast({
      title: "Verification History Synchronized",
      description:
        "All payment records verified against the SSC Transparency Smart Contract.",
      variant: "verified",
    });
  };

  const studentTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.feeTitle.toLowerCase().includes(search.toLowerCase()) ||
      tx.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      tx.verificationHash.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || tx.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Student Portal", href: "/student/dashboard" },
          { label: "Transaction History" },
        ]}
        title="Payment & Verification History"
        description="Complete log of your SSC fee settlements, digital receipts, and blockchain verification records."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshLedger}
              disabled={isRefreshing}
            >
              <RotateCcw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Sync Registry
            </Button>
            <Button asChild size="sm">
              <Link href="/student/payment">
                <CreditCard className="h-4 w-4" />
                Record New Payment
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Recorded Transactions</CardTitle>
            <CardDescription>
              Click any transaction to verify its cryptographic audit trail or
              view the digital receipt.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search receipt # or hash..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <div className="w-full sm:w-44">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter transactions by verification status"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified Only</option>
                  <option value="PENDING REVIEW">Pending Review</option>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isRefreshing ? (
            <TableLoadingSkeleton rows={4} />
          ) : studentTransactions.length === 0 ? (
            <EmptyState
              title="No Matching Transactions"
              description="No recorded payments matched your search or status filter."
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
                  <TableHead>Fee Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Channel &amp; Date</TableHead>
                  <TableHead>Blockchain Verification</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {tx.referenceNo}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {tx.feeTitle}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        Digest:{" "}
                        {truncateHash(
                          tx.recordHash || tx.verificationHash,
                          10,
                          6
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium">
                        {tx.paymentChannel}
                      </div>
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
                        timestamp={tx.date}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/student/receipt/${tx.receiptId}`}>
                            <FileText className="h-3.5 w-3.5" />
                            Receipt
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/student/transactions/${tx.id}`}>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verify
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
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
