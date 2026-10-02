"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Copy,
  FileCheck2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  transactionsApi,
  type ExtendedTransactionItem,
} from "@/lib/api/transactions";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { CardLoadingSkeleton } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function StudentTransactionDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const txId =
    typeof params?.id === "string" ? params.id : "SSC-2026-000001";

  const [tx, setTx] = React.useState<ExtendedTransactionItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isVerifying, setIsVerifying] = React.useState(false);

  const loadTransaction = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await transactionsApi.getStudentTransactionById(txId);
      setTx(data);
    } catch {
      const fallback =
        MOCK_TRANSACTIONS.find((item) => item.id === txId) ??
        MOCK_TRANSACTIONS[0];
      setTx({
        ...fallback,
        paymentId: 1,
        paymentStatus: fallback.status === "Verified" ? "Confirmed" : "Pending",
        blockchainVerification:
          fallback.status === "Verified" ? "Verified" : "Pending",
        blockchainTransactionHash: null,
        recordHash: fallback.verificationHash,
        contractAddress: null,
        blockNumber: null,
        network: "localhost",
      });
    } finally {
      setIsLoading(false);
    }
  }, [txId]);

  React.useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  const handleCopyDigest = (value: string, label = "Record Hash") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    toast({
      title: `${label} Copied`,
      description: `Copied ${value.slice(0, 18)}... to clipboard.`,
      variant: "verified",
    });
  };

  const handleLiveVerify = async () => {
    if (!tx) return;
    setIsVerifying(true);
    try {
      const res = await transactionsApi.verifyBlockchainRecord(tx.id);
      setTx((prev) =>
        prev
          ? {
              ...prev,
              blockchainVerification: res.verified
                ? "Verified"
                : res.status === "failed"
                ? "Failed"
                : "Pending",
              blockchainTransactionHash:
                res.transaction_hash || prev.blockchainTransactionHash,
              recordHash: res.record_hash || prev.recordHash,
              contractAddress: res.contract_address || prev.contractAddress,
              blockNumber: res.block_number ?? prev.blockNumber,
            }
          : prev
      );

      toast({
        title: res.verified
          ? "Blockchain Verification Confirmed"
          : "Record Not Yet Anchored / Mismatch",
        description: res.verified
          ? `On-chain record hash matches ${tx.id} at Block #${res.block_number}.`
          : "This transaction is currently pending or awaiting blockchain confirmation.",
        variant: res.verified ? "verified" : "warning",
      });
    } catch (err: unknown) {
      toast({
        title: "Blockchain Service Unavailable",
        description:
          err instanceof Error
            ? err.message
            : "Could not reach the Python blockchain verification service.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading || !tx) {
    return <CardLoadingSkeleton cards={2} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Student Portal", href: "/student/dashboard" },
          { label: "Transactions", href: "/student/transactions" },
          { label: tx.id },
        ]}
        title={`Transaction Record ${tx.id}`}
        description={`Detailed settlement audit log and blockchain verification status for ${tx.feeTitle}.`}
        badge={
          <VerificationBadge
            status={tx.blockchainVerification}
            hash={tx.recordHash}
            referenceNo={tx.referenceNo}
            blockRef={tx.blockReference}
            transactionHash={tx.blockchainTransactionHash}
            contractAddress={tx.contractAddress}
            blockNumber={tx.blockNumber}
          />
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/student/transactions">
                <ArrowLeft className="h-4 w-4" />
                Back to History
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/student/receipt/${tx.receiptId}`}>
                <FileText className="h-4 w-4" />
                View Digital Receipt
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Transaction Metadata & Verification Trail */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settlement Record Particulars</CardTitle>
              <CardDescription>
                Official student council fee payment details recorded in the
                Laravel database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge
                  variant={
                    tx.paymentStatus === "Confirmed"
                      ? "verified"
                      : tx.paymentStatus === "Rejected" ||
                        tx.paymentStatus === "Failed"
                      ? "destructive"
                      : "warning"
                  }
                >
                  {tx.paymentStatus}
                </Badge>
              </div>
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-muted-foreground">
                  Blockchain Verification
                </span>
                <Badge
                  variant={
                    tx.blockchainVerification === "Verified"
                      ? "verified"
                      : tx.blockchainVerification === "Failed"
                      ? "destructive"
                      : "warning"
                  }
                >
                  {tx.blockchainVerification}
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-2.5">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono font-semibold">{tx.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2.5">
                <span className="text-muted-foreground">
                  Official Receipt #
                </span>
                <span className="font-mono font-semibold">
                  {tx.receiptId}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2.5">
                <span className="text-muted-foreground">Payment Reference</span>
                <span className="font-mono">{tx.referenceNo}</span>
              </div>
              <div className="flex justify-between border-b pb-2.5">
                <span className="text-muted-foreground">Student Payor</span>
                <span className="font-medium">
                  {tx.studentName} ({tx.studentId})
                </span>
              </div>
              <div className="flex justify-between border-b pb-2.5">
                <span className="text-muted-foreground">Assessed Fee</span>
                <Link
                  href={`/student/fees/${tx.feeId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {tx.feeTitle}
                </Link>
              </div>
              <div className="flex justify-between border-b pb-2.5">
                <span className="text-muted-foreground">Amount Settled</span>
                <span className="text-base font-bold text-foreground">
                  {formatCurrency(tx.amount)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2.5">
                <span className="text-muted-foreground">Payment Channel</span>
                <span>{tx.paymentChannel}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Timestamp</span>
                <span>{tx.date}</span>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Verification Details Card (Section 52) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-verified" />
                <CardTitle>Blockchain Verification Details</CardTitle>
              </div>
              <CardDescription>
                Cryptographic record hash and smart contract anchor metadata from
                SSCTransparency.sol. No personal student information is stored
                on-chain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3 text-xs">
                <div className="grid gap-2.5 sm:grid-cols-2 border-b pb-3">
                  <div>
                    <p className="text-muted-foreground">Payment Status</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {tx.paymentStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      Blockchain Verification
                    </p>
                    <p
                      className={`font-semibold mt-0.5 ${
                        tx.blockchainVerification === "Verified"
                          ? "text-verified"
                          : tx.blockchainVerification === "Failed"
                          ? "text-destructive"
                          : "text-warning"
                      }`}
                    >
                      {tx.blockchainVerification}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-mono font-semibold text-foreground mt-0.5">
                      {tx.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Block Number</p>
                    <p className="font-mono font-semibold text-foreground mt-0.5">
                      {tx.blockNumber !== null
                        ? `#${tx.blockNumber} (${tx.network})`
                        : "Pending Confirmation"}
                    </p>
                  </div>
                </div>

                {/* Blockchain Transaction Hash */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                      Blockchain Transaction
                    </span>
                    {tx.blockchainTransactionHash && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() =>
                          handleCopyDigest(
                            tx.blockchainTransactionHash!,
                            "Blockchain Transaction Hash"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    )}
                  </div>
                  <div className="rounded border bg-background p-2.5 font-mono text-xs break-all">
                    {tx.blockchainTransactionHash ||
                      "Not yet submitted to blockchain"}
                  </div>
                </div>

                {/* Record Hash */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                      Record Hash (SHA-256 Canonical Digest)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() =>
                        handleCopyDigest(tx.recordHash, "Record Hash")
                      }
                    >
                      <Copy className="h-3 w-3" />
                      Copy Digest
                    </Button>
                  </div>
                  <div className="rounded border bg-background p-2.5 font-mono text-xs break-all">
                    {tx.recordHash}
                  </div>
                </div>

                {/* Contract Address */}
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                    Contract Address (SSCTransparency.sol)
                  </span>
                  <div className="rounded border bg-background p-2.5 font-mono text-xs break-all">
                    {tx.contractAddress || "Awaiting smart contract submission"}
                  </div>
                </div>

                {tx.errorMessage && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-destructive">
                    Last Blockchain Error: {tx.errorMessage}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Verification Step-by-Step Timeline */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Audit Verification Timeline</CardTitle>
              <CardDescription>
                How this fee payment was validated and anchored.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                {
                  step: "1. Student Payment Recorded",
                  detail: `Submitted via ${tx.paymentChannel} (${tx.referenceNo})`,
                  state: "done" as const,
                },
                {
                  step: "2. SSC Officer Verification",
                  detail:
                    tx.paymentStatus === "Confirmed"
                      ? `Verified by ${tx.verifiedBy}`
                      : "Awaiting SSC Finance Officer verification",
                  state:
                    tx.paymentStatus === "Confirmed"
                      ? ("done" as const)
                      : ("pending" as const),
                },
                {
                  step: "3. Digital Receipt & Canonical Hash Generated",
                  detail: `Official Receipt ${tx.receiptId} • SHA-256 record hash computed`,
                  state: "done" as const,
                },
                {
                  step: "4. Smart Contract Blockchain Confirmation",
                  detail:
                    tx.blockchainVerification === "Verified"
                      ? `Confirmed at Block #${tx.blockNumber ?? 1} on ${
                          tx.network
                        }`
                      : tx.blockchainVerification === "Failed"
                      ? "Blockchain submission failed (payment record preserved)"
                      : "Pending blockchain confirmation",
                  state:
                    tx.blockchainVerification === "Verified"
                      ? ("done" as const)
                      : tx.blockchainVerification === "Failed"
                      ? ("failed" as const)
                      : ("pending" as const),
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      item.state === "done"
                        ? "bg-verified-muted text-verified"
                        : item.state === "failed"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-warning-muted text-warning"
                    }`}
                  >
                    {item.state === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : item.state === "failed" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      {item.step}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t">
                <Button
                  variant="verified"
                  className="w-full"
                  disabled={isVerifying}
                  onClick={handleLiveVerify}
                >
                  {isVerifying ? (
                    <>
                      <Spinner size="sm" />
                      <span>Verifying Against Smart Contract...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify On-Chain Record Hash</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
