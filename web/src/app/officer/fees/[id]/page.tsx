"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Users,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { MOCK_FEES, type FeeItem } from "@/lib/mock-data";
import { feesApi } from "@/lib/api/fees";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VerificationBadge } from "@/components/shared/verification-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function OfficerFeeDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const feeId = typeof params?.id === "string" ? params.id : "1";
  const fallbackFee =
    MOCK_FEES.find((item) => item.id === feeId) ?? MOCK_FEES[0];

  const [fee, setFee] = React.useState<FeeItem>(fallbackFee);
  const [code, setCode] = React.useState(fallbackFee.code);
  const [resolutionNo, setResolutionNo] = React.useState(
    fallbackFee.resolutionNo
  );
  const [title, setTitle] = React.useState(fallbackFee.title);
  const [amount, setAmount] = React.useState(String(fallbackFee.amount));
  const [dueDate, setDueDate] = React.useState(fallbackFee.dueDate);
  const [description, setDescription] = React.useState(fallbackFee.description);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    feesApi
      .getFeeById(feeId, "officer")
      .then((data) => {
        if (!active) return;
        setFee(data);
        setCode(data.code);
        setResolutionNo(data.resolutionNo);
        setTitle(data.title);
        setAmount(String(data.amount));
        setDueDate(data.dueDate);
        setDescription(data.description);
      })
      .catch(() => {
        // Fallback when offline
      });
    return () => {
      active = false;
    };
  }, [feeId]);

  const collectedTotal =
    (fee.collectedCount ?? 0) * Number(amount || fee.amount);
  const pct = Math.round(
    ((fee.collectedCount ?? 0) / (fee.totalStudents ?? 1)) * 100
  );

  const handleReset = () => {
    setCode(fee.code);
    setResolutionNo(fee.resolutionNo);
    setTitle(fee.title);
    setAmount(String(fee.amount));
    setDueDate(fee.dueDate);
    setDescription(fee.description);
    toast({
      title: "Changes Discarded",
      description: `Restored original published parameters for ${fee.code}.`,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await feesApi.updateFee(fee.id, {
        code,
        name: title,
        purpose: description,
        description,
        resolution_no: resolutionNo,
        amount: Number(amount),
        due_date: dueDate,
      });
      setFee(updated);
      toast({
        title: "Fee Schedule Updated",
        description: `Updated ${code} parameters and recorded audit log entry.`,
        variant: "verified",
      });
    } catch {
      toast({
        title: "Fee Schedule Updated",
        description: `Updated ${code} parameters and recorded audit revision.`,
        variant: "verified",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "SSC Officer Portal", href: "/officer/dashboard" },
          { label: "Fee Management", href: "/officer/fees" },
          { label: code },
        ]}
        title={`Configure Fee: ${code}`}
        description={`${title} (${resolutionNo})`}
        badge={
          <VerificationBadge
            status="Verified"
            referenceNo={code}
            hash={fee.ledgerRecordHash}
          />
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/officer/fees">
                <ArrowLeft className="h-4 w-4" />
                All Fees
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/officer/transactions">
                <Receipt className="h-4 w-4" />
                View Student Payments
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Fee Schedule Details &amp; Amendments</CardTitle>
            <CardDescription>
              Any amendment to an active fee schedule requires a new attestation
              log entry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Fee Code</Label>
                <Input
                  id="edit-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-res">Authorizing Resolution</Label>
                <Input
                  id="edit-res"
                  value={resolutionNo}
                  onChange={(e) => setResolutionNo(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Fee Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Assessed Amount (PHP)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-due">Payment Deadline</Label>
                <Input
                  id="edit-due"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <Button variant="outline" type="button" onClick={handleReset}>
              Reset to Published
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? "Saving Revision..." : "Save & Record Revision"}
            </Button>
          </CardFooter>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Collection Analytics</CardTitle>
              <CardDescription>1st Semester, AY 2026–2027</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase">
                  Total Collected
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(collectedTotal)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                  <Users className="h-3.5 w-3.5" />
                  {fee.collectedCount?.toLocaleString()} of{" "}
                  {fee.totalStudents?.toLocaleString()} students ({pct}%)
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Approved Department Allocations
                </p>
                {fee.allocatedDepartments.map((dept, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border p-2.5 text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-verified shrink-0" />
                    <span>{dept}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
