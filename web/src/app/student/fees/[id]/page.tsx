"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  FileCheck2,
  Landmark,
  CheckCircle2,
  Calendar,
  FileText,
} from "lucide-react";
import { MOCK_FEES, type FeeItem } from "@/lib/mock-data";
import { feesApi } from "@/lib/api/fees";
import { getStoredUser } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
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

export default function StudentFeeDetailPage() {
  const params = useParams();
  const feeId = typeof params?.id === "string" ? params.id : "1";
  const fallbackFee = MOCK_FEES.find((item) => item.id === feeId) ?? MOCK_FEES[0];

  const [fee, setFee] = React.useState<FeeItem>(fallbackFee);
  const [studentId, setStudentId] = React.useState("21-29199");

  React.useEffect(() => {
    const stored = getStoredUser();
    if (stored?.student_id) {
      setStudentId(stored.student_id);
    }

    let active = true;
    feesApi
      .getStudentFeeById(feeId)
      .then((data) => {
        if (active) setFee(data);
      })
      .catch(() => {
        if (active) setFee(fallbackFee);
      });

    return () => {
      active = false;
    };
  }, [feeId, fallbackFee]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Student Portal", href: "/student/dashboard" },
          { label: "SSC Fees", href: "/student/fees" },
          { label: fee.code },
        ]}
        title={fee.title}
        description={`${fee.resolutionNo} • ${fee.semester}, ${fee.academicYear}`}
        badge={
          <Badge variant={fee.status === "Paid" ? "verified" : "warning"}>
            {fee.status}
          </Badge>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/student/fees">
                <ArrowLeft className="h-4 w-4" />
                Back to Fees
              </Link>
            </Button>
            {fee.status === "Paid" ? (
              <Button asChild size="sm">
                <Link href="/student/receipt/SSC-RCP-2026-000001">
                  <FileCheck2 className="h-4 w-4" />
                  Open Official Receipt
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href={`/student/payment?feeId=${fee.id}`}>
                  <CreditCard className="h-4 w-4" />
                  Proceed to Payment
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Fee Details */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fee Assessment Overview</CardTitle>
              <CardDescription>
                Institutional purpose and Student Assembly authorization for
                this fee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground leading-relaxed">
                {fee.description}
              </p>

              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Approved Budget Allocation Breakdown
                </h4>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {fee.allocatedDepartments.map((dept, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2.5 rounded-lg border bg-muted/20 p-3 text-xs font-medium"
                    >
                      <CheckCircle2 className="h-4 w-4 text-verified shrink-0" />
                      <span>{dept}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit &amp; Resolution Metadata</CardTitle>
              <CardDescription>
                This fee schedule is registered on the SSC transparency ledger
                prior to semester collection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <span className="text-muted-foreground">Authorizing Act</span>
                <span className="font-semibold">{fee.resolutionNo}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <span className="text-muted-foreground">Fee Category</span>
                <span>{fee.category}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <span className="text-muted-foreground">
                  University-Wide Collection Progress
                </span>
                <span className="font-medium">
                  {fee.collectedCount?.toLocaleString()} /{" "}
                  {fee.totalStudents?.toLocaleString()} Students
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <span className="text-muted-foreground">
                  Resolution Ledger Attestation
                </span>
                <VerificationBadge
                  status="Verified"
                  referenceNo={fee.code}
                  hash={fee.ledgerRecordHash}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Summary Sidebar Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Assessment Status</CardTitle>
              <CardDescription>Student ID: {studentId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Assessed Amount
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(fee.amount)}
                </p>
                <div className="pt-1 flex justify-center">
                  <Badge
                    variant={fee.status === "Paid" ? "verified" : "warning"}
                  >
                    {fee.status === "Paid"
                      ? "Settled & Verified"
                      : "Awaiting Settlement"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Due Date
                  </span>
                  <span className="font-semibold">{fee.dueDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Fee Code
                  </span>
                  <span className="font-mono font-semibold">{fee.code}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {fee.status === "Paid" ? (
                  <Button asChild variant="verified" className="w-full">
                    <Link href="/student/receipt/SSC-RCP-2026-000001">
                      <FileCheck2 className="h-4 w-4" />
                      View Official Digital Receipt
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href={`/student/payment?feeId=${fee.id}`}>
                      <CreditCard className="h-4 w-4" />
                      Record / Pay This Fee
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/student/transparency">
                    <Landmark className="h-4 w-4" />
                    Inspect Fund Utilization
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
