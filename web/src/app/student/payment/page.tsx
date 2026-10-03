"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  ShieldCheck,
  Upload,
  CheckCircle2,
  ArrowRight,
  Building2,
  FileText,
  X,
} from "lucide-react";
import {
  MOCK_FEES,
  MOCK_STUDENT_PROFILE,
  type FeeItem,
} from "@/lib/mock-data";
import { feesApi } from "@/lib/api/fees";
import { paymentsApi } from "@/lib/api/payments";
import { getStoredUser } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function StudentPaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [fees, setFees] = React.useState<FeeItem[]>(MOCK_FEES);
  const [selectedFeeId, setSelectedFeeId] = React.useState(MOCK_FEES[2].id);
  const [channel, setChannel] = React.useState("UNIVERSITY_CASHIER");
  const [referenceNo, setReferenceNo] = React.useState(
    `LBP-2026-${Math.floor(1000000 + Math.random() * 8999999)}`
  );
  const [notes, setNotes] = React.useState(
    "Full settlement for 1st Semester AY 2026–2027."
  );
  const [attachedFile, setAttachedFile] = React.useState<string | null>(null);
  const [proofFile, setProofFile] = React.useState<File | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [studentName, setStudentName] = React.useState(
    MOCK_STUDENT_PROFILE.name
  );
  const [studentId, setStudentId] = React.useState(
    MOCK_STUDENT_PROFILE.studentId
  );

  React.useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setStudentName(stored.name);
      if (stored.student_id) setStudentId(stored.student_id);
    }

    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const feeIdParam = params?.get("feeId");

    let active = true;
    feesApi
      .getStudentFees()
      .then((data) => {
        if (active && data.length > 0) {
          setFees(data);
          if (feeIdParam && data.some((f) => f.id === feeIdParam)) {
            setSelectedFeeId(feeIdParam);
          } else {
            const firstUnpaid = data.find((f) => f.status !== "Paid");
            setSelectedFeeId((firstUnpaid || data[0]).id);
          }
        }
      })
      .catch(() => {
        if (feeIdParam && MOCK_FEES.some((f) => f.id === feeIdParam)) {
          setSelectedFeeId(feeIdParam);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedFee = fees.find((f) => f.id === selectedFeeId) ?? fees[0];
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setAttachedFile(file.name);
      toast({
        title: "Validation Slip Attached",
        description: `${file.name} (${Math.max(
          1,
          Math.round(file.size / 1024)
        )} KB) ready for upload.`,
      });
    }
  };

  const handleTriggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const mapChannelToBackendMethod = (
    uiChannel: string
  ): "ewallet" | "bank_transfer" | "cash" | "other" => {
    switch (uiChannel) {
      case "GCASH_MERCHANT":
      case "MAYA_QRPH":
        return "ewallet";
      case "UNIVERSITY_CASHIER":
        return "bank_transfer";
      case "SSC_BOOTH":
        return "cash";
      default:
        return "other";
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!referenceNo.trim()) {
      setFormError(
        "Please enter your Official Receipt or Payment Reference Number before submitting."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const numericFeeId = Number(selectedFee.id) || 1;
      const payment = await paymentsApi.recordStudentPayment({
        fee_id: numericFeeId,
        amount: selectedFee.amount,
        payment_method: mapChannelToBackendMethod(channel),
        reference_number: referenceNo.trim(),
        notes,
        proof: proofFile,
      });

      toast({
        title: "Fee Payment Recorded",
        description: `Payment ${payment.reference_number} submitted for SSC Finance verification.`,
        variant: "verified",
      });

      if (payment.receipt_number) {
        router.push(`/student/receipt/${payment.receipt_number}`);
      } else {
        router.push("/student/transactions");
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Unable to record payment. Please check your reference number and try again.";
      setFormError(errorMsg);
      toast({
        title: "Payment Submission Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Student Portal", href: "/student/dashboard" },
          { label: "SSC Fees", href: "/student/fees" },
          { label: "Record / Pay Fee" },
        ]}
        title="Record or Submit SSC Fee Payment"
        description="Submit your semester fee settlement to receive a verifiable digital receipt anchored on the SSC financial registry."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Payment Submission Form */}
        <Card className="lg:col-span-8">
          <form onSubmit={handleSubmitPayment}>
            <CardHeader>
              <CardTitle>Fee Settlement Details</CardTitle>
              <CardDescription>
                Select the assessed SSC fee and provide your official payment
                reference.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive"
                >
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="student-name">Student Name</Label>
                  <Input
                    id="student-name"
                    value={studentName}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-id">Student Number</Label>
                  <Input
                    id="student-id"
                    value={studentId}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee-select">Select Assessed SSC Fee</Label>
                <Select
                  id="fee-select"
                  value={selectedFeeId}
                  onChange={(e) => setSelectedFeeId(e.target.value)}
                >
                  {fees.map((fee) => (
                    <option key={fee.id} value={fee.id}>
                      {fee.code} — {fee.title} ({formatCurrency(fee.amount)}) [
                      {fee.status}]
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment-channel">Payment Channel</Label>
                  <Select
                    id="payment-channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="UNIVERSITY_CASHIER">
                      University Cashier / LandBank Portal
                    </option>
                    <option value="GCASH_MERCHANT">
                      GCash Institutional Merchant
                    </option>
                    <option value="MAYA_QRPH">Maya / QR Ph</option>
                    <option value="SSC_BOOTH">
                      SSC Finance Office Official Booth
                    </option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference-no">
                    Official Receipt / Reference Number
                  </Label>
                  <Input
                    id="reference-no"
                    value={referenceNo}
                    onChange={(e) => {
                      setReferenceNo(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Enter Cashier OR or Transaction Ref #"
                    required
                  />
                </div>
              </div>

              {/* Interactive Upload Proof Control */}
              <div className="space-y-2">
                <Label>Payment Validation Slip / Screenshot (Optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {attachedFile ? (
                  <div className="flex items-center justify-between rounded-xl border border-verified/30 bg-verified-muted/30 px-4 py-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-verified shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">
                          {attachedFile}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {proofFile
                            ? `${Math.max(
                                1,
                                Math.round(proofFile.size / 1024)
                              )} KB • Official Proof Attached`
                            : "Verified PDF Document Ready"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setAttachedFile(null);
                        setProofFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleTriggerFileUpload}
                    className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Upload className="h-6 w-6 text-primary mb-2" />
                    <p className="text-xs font-medium text-foreground">
                      Click to upload cashier validation slip or digital receipt
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      PDF, PNG, or JPG up to 5 MB
                    </p>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-notes">Remarks for SSC Finance</Label>
                <Textarea
                  id="payment-notes"
                  placeholder="Optional notes regarding scholarship exemption or partial payment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <Button asChild variant="outline" type="button">
                <Link href="/student/fees">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    <span>Recording Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Submit &amp; Record Payment</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Payment Summary & Trust Assurance Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Settlement Summary</CardTitle>
              <CardDescription>1st Semester, AY 2026–2027</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee Code</span>
                  <span className="font-mono font-semibold">
                    {selectedFee.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution</span>
                  <span className="font-medium">{selectedFee.resolutionNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-medium text-verified">₱0.00 (Waived)</span>
                </div>
              </div>

              <div className="border-t pt-3 flex items-baseline justify-between">
                <span className="text-sm font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(selectedFee.amount)}
                </span>
              </div>

              <div className="rounded-lg border bg-verified-muted/50 p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-verified">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Tamper-Evident Receipt Guarantee</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Once verified by an SSC Officer, your digital receipt receives
                  a cryptographic SHA-256 record hash anchored on the SSC smart
                  contract so your payment can never be lost or altered.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Need Cashier Assistance?</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Visit the SSC Finance Committee Desk at Student Union Building
                Rm 204 for manual validation.
              </p>
              <div className="pt-1 flex items-center gap-2 text-verified font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Official University Collection Partner</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
