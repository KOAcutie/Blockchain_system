"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Receipt,
  ArrowRight,
  FileText,
  Landmark,
} from "lucide-react";
import {
  MOCK_STUDENT_PROFILE,
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
import { transparencyApi } from "@/lib/api/transparency";
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
  CardFooter,
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

export default function StudentDashboardPage() {
  const [studentName, setStudentName] = React.useState(MOCK_STUDENT_PROFILE.name);
  const [studentId, setStudentId] = React.useState(MOCK_STUDENT_PROFILE.studentId);
  const [studentSubtitle, setStudentSubtitle] = React.useState(
    `${MOCK_STUDENT_PROFILE.program} • ${MOCK_STUDENT_PROFILE.college} (${MOCK_STUDENT_PROFILE.semester})`
  );
  const [fees, setFees] = React.useState<FeeItem[]>(MOCK_FEES);
  const [transactions, setTransactions] = React.useState<ExtendedTransactionItem[]>(
    MOCK_TRANSACTIONS.map((tx) => ({
      ...tx,
      paymentId: 1,
      paymentStatus: tx.status === "Verified" ? "Confirmed" : "Pending",
      blockchainVerification: tx.status === "Verified" ? "Verified" : "Pending",
      blockchainTransactionHash: tx.verificationHash,
      recordHash: tx.verificationHash,
      contractAddress:
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
        "0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856",
      blockNumber: 149104,
      network: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK || "sepolia",
    }))
  );
  const [latestFundTitle, setLatestFundTitle] = React.useState(
    MOCK_FUND_USAGES[0].title
  );

  React.useEffect(() => {
    const stored = getStoredUser();
    if (stored && stored.role === "student") {
      setStudentName(stored.name);
      if (stored.student_id) setStudentId(stored.student_id);
      setStudentSubtitle(
        `${stored.program || MOCK_STUDENT_PROFILE.program} • ${
          stored.college || MOCK_STUDENT_PROFILE.college
        } (${MOCK_STUDENT_PROFILE.semester})`
      );
    }

    let active = true;
    Promise.allSettled([
      feesApi.getStudentFees(),
      transactionsApi.getStudentTransactions(),
      transparencyApi.getPublishedFunds(),
    ]).then(([feesRes, txRes, fundsRes]) => {
      if (!active) return;
      if (feesRes.status === "fulfilled" && feesRes.value.length > 0) {
        setFees(feesRes.value);
      }
      if (txRes.status === "fulfilled" && txRes.value.length > 0) {
        setTransactions(txRes.value);
      }
      if (fundsRes.status === "fulfilled" && fundsRes.value.length > 0) {
        setLatestFundTitle(fundsRes.value[0].title);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const paidFees = fees.filter((f) => f.status === "Paid");
  const unpaidFees = fees.filter((f) => f.status !== "Paid");
  const totalPaid = paidFees.reduce((sum, f) => sum + f.amount, 0);
  const totalDue = unpaidFees.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Student Portal", href: "/student/dashboard" },
          { label: "Dashboard" },
        ]}
        title={`Welcome, ${studentName}`}
        description={studentSubtitle}
        badge={<Badge variant="info">{studentId}</Badge>}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/student/transparency">
                <Landmark className="h-4 w-4" />
                View Council Budget
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/student/payment">
                <CreditCard className="h-4 w-4" />
                Record / Pay Fee
              </Link>
            </Button>
          </>
        }
      />

      {/* Summary Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Fees Paid"
          value={formatCurrency(totalPaid)}
          subtitle={`${paidFees.length} of ${fees.length} semester fees settled`}
          icon={CheckCircle2}
          tone="verified"
          footer={
            <>
              <span>All receipts verified</span>
              <Link
                href="/student/transactions"
                className="font-semibold text-primary hover:underline"
              >
                View History →
              </Link>
            </>
          }
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(totalDue)}
          subtitle={`${unpaidFees.length} fees remaining for 1st Sem`}
          icon={Clock}
          tone="warning"
          footer={
            <>
              <span>Next due: Nov 05, 2026</span>
              <Link
                href="/student/payment"
                className="font-semibold text-primary hover:underline"
              >
                Pay Now →
              </Link>
            </>
          }
        />
        <StatCard
          title="Digital Receipts Issued"
          value={`${transactions.length} Receipts`}
          subtitle="Cryptographically attested on ledger"
          icon={Receipt}
          tone="primary"
          footer={
            <>
              <span>
                Latest: {transactions[0]?.receiptId || "SSC-RCP-2026-000001"}
              </span>
              <Link
                href={`/student/receipt/${
                  transactions[0]?.receiptId || "SSC-RCP-2026-000001"
                }`}
                className="font-semibold text-primary hover:underline"
              >
                Open Receipt →
              </Link>
            </>
          }
        />
        <StatCard
          title="SSC Transparency Index"
          value="100% Audited"
          subtitle="₱1.24M 1st Semester collections tracked"
          icon={ShieldCheck}
          tone="verified"
          footer={
            <>
              <span>Published Fund Reports</span>
              <Link
                href="/student/transparency"
                className="font-semibold text-primary hover:underline"
              >
                Inspect →
              </Link>
            </>
          }
        />
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Assessed Semester Fees */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>1st Semester SSC Fee Schedule</CardTitle>
              <CardDescription>
                Assessed student council &amp; publication fees for AY 2026–2027.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/student/fees">View All Fees</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {fee.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fee.code} • Due {fee.dueDate}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(fee.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={fee.status === "Paid" ? "verified" : "warning"}
                      >
                        {fee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/student/fees/${fee.id}`}>
                          Details
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Transactions & Verification */}
        <Card className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Verified Receipts</CardTitle>
                <CardDescription>
                  Your latest recorded fee payments and audit proofs.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/student/transactions">All History</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {transactions.slice(0, 2).map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl border bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {tx.feeTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tx.referenceNo} • {tx.date}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
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
                    <div className="flex items-center gap-1.5">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        <Link href={`/student/receipt/${tx.receiptId}`}>
                          <FileText className="h-3 w-3" />
                          Receipt
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        <Link href={`/student/transactions/${tx.id}`}>
                          Verify
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </div>

          <CardFooter className="border-t pt-4">
            <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
              <span>Latest SSC Fund Activity: {latestFundTitle}</span>
              <Link
                href="/student/transparency"
                className="font-semibold text-primary hover:underline shrink-0 ml-2"
              >
                Transparency →
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
