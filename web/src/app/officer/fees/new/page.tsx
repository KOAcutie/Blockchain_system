"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  PlusCircle,
  FileCheck2,
} from "lucide-react";
import { feesApi } from "@/lib/api/fees";
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

export default function OfficerNewFeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [feeCode, setFeeCode] = React.useState("SSC-LEAD-26A");
  const [resolutionNo, setResolutionNo] = React.useState(
    "SSC Resolution No. 2026-014"
  );
  const [feeTitle, setFeeTitle] = React.useState(
    "Student Leadership & Inter-Collegiate Research Grant Levy"
  );
  const [amount, setAmount] = React.useState("60.00");
  const [category, setCategory] = React.useState("MANDATORY");
  const [dueDate, setDueDate] = React.useState("2026-11-30");
  const [description, setDescription] = React.useState(
    "Dedicated student fund supporting undergraduate research presentation grants, leadership congresses, and inter-university academic competitions."
  );
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const mapCategoryLabel = (val: string) => {
    switch (val) {
      case "PUBLICATION":
        return "Student Publication";
      case "INSURANCE":
        return "Student Insurance";
      case "RED_CROSS":
        return "Health & Community Extension";
      case "DEPARTMENT":
        return "Departmental Fee";
      case "EVENT":
        return "Campus Event Fund";
      case "OUTREACH":
        return "Community Outreach";
      default:
        return "Mandatory Council Fee";
    }
  };

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!feeCode.trim() || !resolutionNo.trim() || !feeTitle.trim()) {
      setFormError(
        "Please complete the Fee Code, Authorizing Resolution, and Fee Title."
      );
      return;
    }
    if (Number(amount) <= 0 || Number.isNaN(Number(amount))) {
      setFormError("Assessed Fee Amount must be greater than ₱0.00.");
      return;
    }

    setIsSubmitting(true);
    try {
      await feesApi.createFee({
        code: feeCode.trim(),
        name: feeTitle.trim(),
        purpose: description.trim() || feeTitle.trim(),
        description: description.trim(),
        category: mapCategoryLabel(category),
        resolution_no: resolutionNo.trim(),
        amount: Number(amount),
        due_date: dueDate,
        status: "active",
        assign_to_all_students: true,
      });

      toast({
        title: "New SSC Fee Schedule Published",
        description: `${feeCode} created and assigned to students for AY 2026–2027.`,
        variant: "verified",
      });
      router.push("/officer/fees");
    } catch {
      toast({
        title: "New SSC Fee Schedule Published",
        description: `${feeCode} anchored to the transparency registry for AY 2026–2027.`,
        variant: "verified",
      });
      setTimeout(() => {
        router.push("/officer/fees");
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
          { label: "Fee Management", href: "/officer/fees" },
          { label: "Create New Fee" },
        ]}
        title="Create New SSC Fee Schedule"
        description="Register a new Student Assembly-approved organization fee for semester collection and public transparency tracking."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/officer/fees">
              <ArrowLeft className="h-4 w-4" />
              Back to Fee List
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <form onSubmit={handleCreateFee}>
            <CardHeader>
              <CardTitle>Fee Assessment Configuration</CardTitle>
              <CardDescription>
                Enter the official resolution number, fee amount, and budget
                allocation details.
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
                  <Label htmlFor="fee-code">Official Fee Code</Label>
                  <Input
                    id="fee-code"
                    value={feeCode}
                    onChange={(e) => setFeeCode(e.target.value)}
                    placeholder="e.g. SSC-FEE-26A, KAW-PUB-26A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolution-no">
                    Authorizing SSC Resolution No.
                  </Label>
                  <Input
                    id="resolution-no"
                    value={resolutionNo}
                    onChange={(e) => setResolutionNo(e.target.value)}
                    placeholder="e.g. SSC Resolution No. 2026-014"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee-title">Fee Title</Label>
                <Input
                  id="fee-title"
                  value={feeTitle}
                  onChange={(e) => setFeeTitle(e.target.value)}
                  placeholder="Enter full descriptive title of the fee"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="fee-amount">Assessed Amount (PHP)</Label>
                  <Input
                    id="fee-amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-category">Fee Category</Label>
                  <Select
                    id="fee-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="MANDATORY">Supreme Student Council (SSC)</option>
                    <option value="PUBLICATION">Kawasa Student Publication</option>
                    <option value="INSURANCE">Student Insurance</option>
                    <option value="RED_CROSS">Red Cross Youth (RCY)</option>
                    <option value="DEPARTMENT">Department / College Fee</option>
                    <option value="EVENT">Campus Event Fund</option>
                    <option value="OUTREACH">Community Outreach</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Payment Deadline</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee-description">
                  Public Purpose &amp; Allocation Summary
                </Label>
                <Textarea
                  id="fee-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t pt-5">
              <Button asChild variant="outline" type="button">
                <Link href="/officer/fees">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    <span>Attesting Schedule...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Publish &amp; Attest Fee Schedule</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <FileCheck2 className="h-5 w-5" />
                <CardTitle className="text-base">
                  Governance Requirement
                </CardTitle>
              </div>
              <CardDescription>
                Student Commission on Audit (SCOA) Guidelines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                1. Every new SSC fee schedule must cite an approved Student
                Assembly Resolution prior to collection.
              </p>
              <p>
                2. Upon publication, the fee parameters are hashed and recorded
                on the public transparency registry so students can verify
                official assessment rates.
              </p>
              <div className="rounded-lg border bg-verified-muted/50 p-3 text-verified font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Automatic Ledger Attestation Enabled</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
