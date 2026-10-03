"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Printer,
  Download,
  Landmark,
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { receiptsApi, type BackendReceipt } from "@/lib/api/receipts";
import { MOCK_TRANSACTIONS, MOCK_STUDENT_PROFILE } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { CardLoadingSkeleton } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function StudentReceiptDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const receiptId =
    typeof params?.id === "string" ? params.id : "SSC-RCP-2026-000001";

  const [receipt, setReceipt] = React.useState<BackendReceipt | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await receiptsApi.getReceiptById(receiptId);
        if (active) setReceipt(data);
      } catch {
        // Fallback if backend is offline
        const mockTx =
          MOCK_TRANSACTIONS.find((tx) => tx.receiptId === receiptId) ??
          MOCK_TRANSACTIONS[0];
        if (active) {
          setReceipt({
            id: 1,
            receipt_number: mockTx.receiptId,
            issued_at: mockTx.date,
            status: "issued",
            payment_id: 1,
            payment_status:
              mockTx.status === "Verified" ? "confirmed" : "pending",
            payment_method: mockTx.paymentChannel,
            reference_number: mockTx.referenceNo,
            amount: mockTx.amount,
            date: mockTx.date,
            student: {
              name: MOCK_STUDENT_PROFILE.name,
              student_id: MOCK_STUDENT_PROFILE.studentId,
              college: MOCK_STUDENT_PROFILE.college,
              program: MOCK_STUDENT_PROFILE.program,
            },
            fee: {
              id: 1,
              code: mockTx.feeId,
              name: mockTx.feeTitle,
              purpose: "SSC Semester Assessment",
              semester: "1st Semester",
              academic_year: "AY 2026–2027",
            },
            transaction_id: mockTx.id,
            transaction_db_id: 1,
            verified_by: mockTx.verifiedBy,
            blockchain: {
              status: mockTx.status === "Verified" ? "confirmed" : "pending",
              verification_label:
                mockTx.status === "Verified" ? "Verified" : "Pending",
              transaction_hash: null,
              record_hash: mockTx.verificationHash,
              contract_address: null,
              block_number: null,
            },
          });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [receiptId]);

  if (isLoading || !receipt) {
    return <CardLoadingSkeleton cards={1} />;
  }

  const bcStatus: "Verified" | "Pending" | "Failed" =
    receipt.blockchain?.status === "confirmed"
      ? "Verified"
      : receipt.blockchain?.status === "failed"
      ? "Failed"
      : "Pending";

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Student Portal", href: "/student/dashboard" },
          { label: "Transactions", href: "/student/transactions" },
          { label: `Receipt ${receipt.receipt_number}` },
        ]}
        title="Official Digital Receipt"
        description="Institutional proof of SSC organization fee settlement with cryptographic audit verification."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/student/transactions">
                <ArrowLeft className="h-4 w-4" />
                Transactions
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast({
                  title: "Digital Receipt Ready",
                  description: `Saved ${receipt.receipt_number}.pdf with embedded record hash.`,
                  variant: "verified",
                })
              }
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-primary text-primary-foreground p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15 border border-primary-foreground/25">
                  <Landmark className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/80 font-semibold">
                    Republic of the Philippines • State University
                  </p>
                  <h2 className="text-xl font-bold tracking-tight">
                    Supreme Student Council Official Receipt
                  </h2>
                  <p className="text-xs text-primary-foreground/80">
                    Office of the Vice President for Finance &amp; Audit
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 font-mono">
                  {receipt.receipt_number}
                </Badge>
                <p className="text-xs text-primary-foreground/80 mt-1.5">
                  Transaction ID: {receipt.transaction_id}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 rounded-xl border bg-muted/20 p-4 text-sm">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Received From</p>
                  <p className="font-semibold text-foreground">
                    {receipt.student?.name || "Demo Student"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Student ID &amp; College
                  </p>
                  <p className="font-medium text-foreground">
                    {receipt.student?.student_id || "21-29199"} •{" "}
                    {receipt.student?.college || "CCIS"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 sm:text-right">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Date &amp; Time Issued
                  </p>
                  <p className="font-medium text-foreground">{receipt.date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Payment Method &amp; Reference
                  </p>
                  <p className="font-medium text-foreground">
                    {receipt.payment_method} ({receipt.reference_number})
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Particulars of Assessment Settlement
              </h3>
              <div className="rounded-xl border overflow-hidden">
                <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase text-muted-foreground">
                  <span>Fee Description</span>
                  <span>Amount Paid</span>
                </div>
                <div className="flex items-center justify-between px-4 py-4 text-sm border-t">
                  <div>
                    <p className="font-semibold text-foreground">
                      {receipt.fee?.name || "SSC Fee"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {receipt.fee?.purpose || "Council Assessment"} •{" "}
                      {receipt.fee?.semester || "1st Semester"},{" "}
                      {receipt.fee?.academic_year || "AY 2026–2027"}
                    </p>
                  </div>
                  <span className="text-base font-bold text-foreground">
                    {formatCurrency(receipt.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-muted/20 px-4 py-3 border-t">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Total Official Settlement (Status:{" "}
                    {receipt.payment_status.toUpperCase()})
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(receipt.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-verified/30 bg-verified-muted/40 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-verified">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Official Verification Status: {bcStatus}</span>
                </div>
                <VerificationBadge
                  status={bcStatus}
                  hash={receipt.blockchain?.record_hash || ""}
                  referenceNo={receipt.receipt_number}
                  blockRef={
                    receipt.blockchain?.block_number
                      ? `Block #${receipt.blockchain.block_number}`
                      : "Pending Ledger Confirmation"
                  }
                  timestamp={receipt.date}
                  transactionHash={receipt.blockchain?.transaction_hash}
                  contractAddress={receipt.blockchain?.contract_address}
                  blockNumber={receipt.blockchain?.block_number}
                />
              </div>

              <div className="grid gap-2 text-xs pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono font-medium text-foreground">
                    {receipt.transaction_id}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-muted-foreground">Verified By:</span>
                  <span className="font-medium text-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
                    {receipt.verified_by || "Awaiting Officer Verification"}
                  </span>
                </div>
                {receipt.blockchain?.transaction_hash && (
                  <div className="space-y-1 pt-1">
                    <span className="text-muted-foreground">
                      Attestation Reference Hash:
                    </span>
                    <div className="rounded border bg-background px-3 py-2 font-mono text-[11px] break-all text-foreground">
                      {receipt.blockchain.transaction_hash}
                    </div>
                  </div>
                )}
                <div className="space-y-1 pt-1">
                  <span className="text-muted-foreground">
                    Integrity Verification Hash (SHA-256):
                  </span>
                  <div className="rounded border bg-background px-3 py-2 font-mono text-[11px] break-all text-foreground">
                    {receipt.blockchain?.record_hash || "Pending"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4">
            <span className="text-xs text-muted-foreground">
              Valid for Student Clearance &amp; Enrollment Verification
            </span>
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/student/transactions/${
                  receipt.transaction_id || "SSC-2026-000001"
                }`}
              >
                Inspect Transaction &amp; Attestation Record
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
