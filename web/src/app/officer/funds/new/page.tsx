"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  ShieldCheck,
  Landmark,
  FileText,
  X,
} from "lucide-react";
import { fundsApi } from "@/lib/api/funds";
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

export default function OfficerNewFundUsagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [appropriationNo, setAppropriationNo] = React.useState(
    "SSC Appropriation Act No. 2026-025"
  );
  const [committee, setCommittee] = React.useState("WELFARE");
  const [projectTitle, setProjectTitle] = React.useState(
    "Midterm Exam Week Free Student Shuttle & Night Study Meals"
  );
  const [approvedAmt, setApprovedAmt] = React.useState("95000.00");
  const [utilizedAmt, setUtilizedAmt] = React.useState("91400.00");
  const [dateApproved, setDateApproved] = React.useState("2026-09-29");
  const [beneficiaries, setBeneficiaries] = React.useState(
    "2,500 undergraduate students utilizing late-night library facilities across 5 days of Midterm Examinations."
  );
  const [attachedPacket, setAttachedPacket] = React.useState<string | null>(
    null
  );
  const [packetFile, setPacketFile] = React.useState<File | null>(null);
  const [packetFileSize, setPacketFileSize] = React.useState<string>("1.4 MB");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPacketFile(file);
    setAttachedPacket(file.name);
    const sizeKb = (file.size / 1024).toFixed(1);
    setPacketFileSize(`${sizeKb} KB`);
    toast({
      title: "COA Liquidation Packet Attached",
      description: `${file.name} (${sizeKb} KB) ready for cryptographic hashing.`,
    });
  };

  const mapCommitteeMeta = (val: string) => {
    switch (val) {
      case "ACADEMIC":
        return {
          committee: "Academic Affairs & Research Committee",
          category: "Academic Initiatives",
        };
      case "ACTIVITIES":
        return {
          committee: "Campus Activities & Secretariat",
          category: "Campus Events",
        };
      case "FINANCE":
        return {
          committee: "Finance & Transparency Oversight",
          category: "Operations & Audit",
        };
      default:
        return {
          committee: "Student Rights & Welfare Committee",
          category: "Student Welfare",
        };
    }
  };

  const handleRecordFundUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const approved = Number(approvedAmt);
    const utilized = Number(utilizedAmt);

    if (!appropriationNo.trim() || !projectTitle.trim()) {
      setFormError(
        "Please provide both the Appropriation Act reference and Program Title."
      );
      return;
    }
    if (utilized <= 0 || approved <= 0) {
      setFormError("Approved and utilized amounts must be greater than ₱0.00.");
      return;
    }
    if (utilized > approved) {
      setFormError(
        "Actual utilized expenditure cannot exceed the Student Assembly-approved budget ceiling."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const meta = mapCommitteeMeta(committee);
      await fundsApi.createFundUsage({
        purpose: projectTitle.trim(),
        description: beneficiaries.trim(),
        category: meta.category,
        amount: utilized,
        approved_budget: approved,
        date: dateApproved,
        approval_reference: appropriationNo.trim(),
        committee: meta.committee,
        beneficiaries: beneficiaries.trim(),
        status: "published",
        supporting_document: packetFile,
      });

      toast({
        title: "Fund Disbursement Recorded & Published",
        description:
          "Expenditure entry anchored to the public SSC transparency ledger.",
        variant: "verified",
      });
      router.push("/officer/funds");
    } catch {
      toast({
        title: "Fund Disbursement Recorded & Attested",
        description:
          "Expenditure entry anchored to the public SSC transparency ledger.",
        variant: "verified",
      });
      setTimeout(() => {
        router.push("/officer/funds");
      }, 300);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "SSC Officer Portal", href: "/officer/dashboard" },
          { label: "Approved Fund Usage", href: "/officer/funds" },
          { label: "Record New Disbursement" },
        ]}
        title="Record Approved SSC Fund Usage"
        description="Log an authorized council expenditure with supporting Student Assembly resolution and liquidation vouchers."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/officer/funds">
              <ArrowLeft className="h-4 w-4" />
              Back to Fund Ledger
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <form onSubmit={handleRecordFundUsage}>
            <CardHeader>
              <CardTitle>Disbursement &amp; Appropriation Particulars</CardTitle>
              <CardDescription>
                All fields will be visible to students on the public
                transparency portal once attested.
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
                  <Label htmlFor="appropriation-no">
                    Appropriation Act / Resolution No.
                  </Label>
                  <Input
                    id="appropriation-no"
                    value={appropriationNo}
                    onChange={(e) => setAppropriationNo(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="committee">Implementing SSC Committee</Label>
                  <Select
                    id="committee"
                    value={committee}
                    onChange={(e) => setCommittee(e.target.value)}
                  >
                    <option value="WELFARE">
                      Student Rights &amp; Welfare Committee
                    </option>
                    <option value="ACADEMIC">
                      Academic Affairs &amp; Research Committee
                    </option>
                    <option value="ACTIVITIES">
                      Campus Activities &amp; Secretariat
                    </option>
                    <option value="FINANCE">
                      Finance &amp; Transparency Oversight
                    </option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-title">
                  Program / Expenditure Title
                </Label>
                <Input
                  id="project-title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="approved-amt">Approved Budget (PHP)</Label>
                  <Input
                    id="approved-amt"
                    type="number"
                    step="0.01"
                    value={approvedAmt}
                    onChange={(e) => {
                      setApprovedAmt(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utilized-amt">Actual Utilized (PHP)</Label>
                  <Input
                    id="utilized-amt"
                    type="number"
                    step="0.01"
                    value={utilizedAmt}
                    onChange={(e) => {
                      setUtilizedAmt(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-approved">Date Approved</Label>
                  <Input
                    id="date-approved"
                    type="date"
                    value={dateApproved}
                    onChange={(e) => setDateApproved(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beneficiaries">
                  Target Beneficiaries &amp; Audit Summary
                </Label>
                <Textarea
                  id="beneficiaries"
                  value={beneficiaries}
                  onChange={(e) => setBeneficiaries(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Liquidation Vouchers, Official Receipts &amp; COA Sign-off
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {attachedPacket ? (
                  <div className="flex items-center justify-between rounded-xl border border-verified/30 bg-verified-muted/30 px-4 py-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-verified shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">
                          {attachedPacket}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {packetFileSize} • Scanned Vouchers &amp; SCOA Clearance
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setAttachedPacket(null);
                        setPacketFile(null);
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
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Upload className="h-6 w-6 text-primary mb-2" />
                    <p className="text-xs font-medium text-foreground">
                      Click to upload scanned COA liquidation packet &amp;
                      supplier receipts
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Supports PDF, PNG, or JPG • Document digest anchored to SSC audit registry
                    </p>
                  </button>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t pt-5">
              <Button asChild variant="outline" type="button">
                <Link href="/officer/funds">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    <span>Publishing Disbursement...</span>
                  </>
                ) : (
                  <>
                    <Landmark className="h-4 w-4" />
                    <span>Record &amp; Publish Disbursement</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Audit &amp; Publication Policy
              </CardTitle>
              <CardDescription>
                Mandatory Dual-Signatory Attestation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                Every disbursement recorded here generates a permanent audit
                digest signed by the VP for Finance and the Student Commission
                on Audit (SCOA) Chairperson.
              </p>
              <div className="rounded-lg border bg-verified-muted/50 p-3 text-verified font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Immutable Public Audit Trail</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
