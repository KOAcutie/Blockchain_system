"use client";

import * as React from "react";
import Link from "next/link";
import {
  Landmark,
  Receipt,
  ShieldCheck,
  PlusCircle,
  BarChart3,
  Clock,
  ArrowRight,
  FileSpreadsheet,
} from "lucide-react";
import {
  MOCK_OFFICER_PROFILE,
  MOCK_FEES,
  MOCK_TRANSACTIONS,
  MOCK_FUND_USAGES,
  type FeeItem,
} from "@/lib/mock-data";
import { feesApi } from "@/lib/api/fees";
import {
  transactionsApi,
  type ExtendedTransactionItem,
} from "@/lib/api/transactions";
import { reportsApi } from "@/lib/api/reports";
import { getStoredUser } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function OfficerDashboardPage() {
  const [officerSubtitle, setOfficerSubtitle] = React.useState(
    `${MOCK_OFFICER_PROFILE.name} • ${MOCK_OFFICER_PROFILE.position} (${MOCK_OFFICER_PROFILE.term})`
  );
  const [fees, setFees] = React.useState<FeeItem[]>(MOCK_FEES);
  const [transactions, setTransactions] =
    React.useState<ExtendedTransactionItem[]>(FALLBACK_TX);
  const [totalCollections, setTotalCollections] = React.useState(1248500);
  const [totalExpenses, setTotalExpenses] = React.useState(700250);
  const [publishedFundsCount] = React.useState(
    MOCK_FUND_USAGES.length
  );

  React.useEffect(() => {
    const stored = getStoredUser();
    if (stored && (stored.role === "officer" || stored.role === "admin")) {
      setOfficerSubtitle(
        `${stored.name} • ${
          stored.position || MOCK_OFFICER_PROFILE.position
        } (${MOCK_OFFICER_PROFILE.term})`
      );
    }

    let active = true;
    Promise.allSettled([
      feesApi.getOfficerFees(),
      transactionsApi.getOfficerTransactions(),
      reportsApi.getSummary(),
    ]).then(([feesRes, txRes, repRes]) => {
      if (!active) return;
      if (feesRes.status === "fulfilled" && feesRes.value.length > 0) {
        setFees(feesRes.value);
      }
      if (txRes.status === "fulfilled" && txRes.value.length > 0) {
        setTransactions(txRes.value);
      }
      if (repRes.status === "fulfilled" && repRes.value.total_collections > 0) {
        setTotalCollections(repRes.value.total_collections);
        if (repRes.value.total_expenses > 0) {
          setTotalExpenses(repRes.value.total_expenses);
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const pendingCount = transactions.filter(
    (t) => t.status === "Pending Review"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "SSC Officer Portal", href: "/officer/dashboard" },
          { label: "Executive Dashboard" },
        ]}
        title="SSC Finance & Transparency Control Center"
        description={officerSubtitle}
        badge={<Badge variant="verified">Audit Ledger Synced</Badge>}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/officer/fees/new">
                <PlusCircle className="h-4 w-4" />
                New Fee Schedule
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/officer/funds/new">
                <Landmark className="h-4 w-4" />
                Record Fund Usage
              </Link>
            </Button>
          </>
        }
      />

      {/* Officer Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="1st Sem Collections"
          value={formatCurrency(totalCollections)}
          subtitle="78.4% of enrolled student body settled"
          icon={Landmark}
          tone="primary"
          footer={
            <>
              <span>{fees.length} Active Fee Schedules</span>
              <Link
                href="/officer/fees"
                className="font-semibold text-primary hover:underline"
              >
                Manage Fees →
              </Link>
            </>
          }
        />
        <StatCard
          title="Pending Verifications"
          value={`${pendingCount} Receipts`}
          subtitle="Awaiting finance officer attestation"
          icon={Clock}
          tone="warning"
          footer={
            <>
              <span>Latest: 12 mins ago</span>
              <Link
                href="/officer/transactions"
                className="font-semibold text-primary hover:underline"
              >
                Review Queue →
              </Link>
            </>
          }
        />
        <StatCard
          title="Approved Fund Usage"
          value={formatCurrency(totalExpenses)}
          subtitle="Appropriation acts disbursed & tracked"
          icon={ShieldCheck}
          tone="verified"
          footer={
            <>
              <span>90.3% budget utilization</span>
              <Link
                href="/officer/funds"
                className="font-semibold text-primary hover:underline"
              >
                Fund Ledger →
              </Link>
            </>
          }
        />
        <StatCard
          title="COA & Audit Reports"
          value="3 Ready"
          subtitle="Monthly collection & disbursement exports"
          icon={BarChart3}
          tone="default"
          footer={
            <>
              <span>September 2026 Cut-off</span>
              <Link
                href="/officer/reports"
                className="font-semibold text-primary hover:underline"
              >
                Open Reports →
              </Link>
            </>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Student Transactions Queue */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Student Fee Settlements</CardTitle>
              <CardDescription>
                Latest student payments recorded across cashier and digital
                channels.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/officer/transactions">
                <Receipt className="h-3.5 w-3.5" />
                All Transactions
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Fee &amp; Ref</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {tx.studentName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.studentId} • {tx.college}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium">{tx.feeTitle}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {tx.referenceNo}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <VerificationBadge
                        status={tx.blockchainVerification}
                        hash={tx.recordHash || tx.verificationHash}
                        txHash={tx.blockchainTransactionHash}
                        contractAddress={tx.contractAddress}
                        blockNumber={tx.blockNumber}
                        referenceNo={tx.referenceNo}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Active Fee Schedules & Quick Actions */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Fee Schedules</CardTitle>
              <CardDescription>
                Semester assessments &amp; collection rates.
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/officer/fees">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Manage
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fees.map((fee) => {
              const pct = Math.round(
                ((fee.collectedCount ?? 0) / (fee.totalStudents ?? 1)) * 100
              );
              return (
                <div
                  key={fee.id}
                  className="rounded-xl border bg-muted/20 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/officer/fees/${fee.id}`}
                      className="text-sm font-semibold text-foreground hover:text-primary flex items-center gap-1"
                    >
                      <span>{fee.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                    <Badge variant="outline" className="font-mono shrink-0">
                      {formatCurrency(fee.amount)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {fee.collectedCount?.toLocaleString()} /{" "}
                      {fee.totalStudents?.toLocaleString()} students
                    </span>
                    <span className="font-semibold text-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t">
              <span>Published Disbursements: {publishedFundsCount}</span>
              <Link
                href="/officer/transparency"
                className="font-semibold text-primary hover:underline"
              >
                Manage Public Portal →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
