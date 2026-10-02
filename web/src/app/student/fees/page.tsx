"use client";

import * as React from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Eye,
  FileCheck2,
  Filter,
} from "lucide-react";
import { MOCK_FEES, type FeeItem } from "@/lib/mock-data";
import { feesApi } from "@/lib/api/fees";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StudentFeesPage() {
  const [fees, setFees] = React.useState<FeeItem[]>(MOCK_FEES);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  React.useEffect(() => {
    let active = true;
    feesApi
      .getStudentFees()
      .then((data) => {
        if (active && data.length > 0) {
          setFees(data);
        }
      })
      .catch(() => {
        // Fallback to MOCK_FEES when offline
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredFees = fees.filter((fee) => {
    const matchesSearch =
      fee.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || fee.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paidCount = fees.filter((f) => f.status === "Paid").length;
  const unpaidCount = fees.length - paidCount;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Student Portal", href: "/student/dashboard" },
          { label: "SSC Fees" },
        ]}
        title="Assessed SSC Organization Fees"
        description="Official schedule of Supreme Student Council fees approved by the Student Assembly for 1st Semester, AY 2026–2027."
        actions={
          <Button asChild>
            <Link href="/student/payment">
              <CreditCard className="h-4 w-4" />
              Record / Pay Selected Fee
            </Link>
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fee title or code (e.g., SSC-GEN-26A)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter fees by payment status"
              >
                <option value="ALL">All Statuses ({fees.length})</option>
                <option value="PAID">Paid ({paidCount})</option>
                <option value="UNPAID">Unpaid ({unpaidCount})</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fees List Grid */}
      {filteredFees.length === 0 ? (
        <EmptyState
          title="No Matching SSC Fees Found"
          description="Try clearing your search query or switching the payment status filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredFees.map((fee) => (
            <Card key={fee.id} className="flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {fee.code}
                    </Badge>
                    <Badge variant="secondary">{fee.category}</Badge>
                  </div>
                  <Badge
                    variant={fee.status === "Paid" ? "verified" : "warning"}
                  >
                    {fee.status}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg leading-snug">
                    {fee.title}
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    {fee.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Assessed Amount</p>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      {formatCurrency(fee.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Deadline</p>
                    <p className="font-semibold text-foreground mt-1">
                      {fee.dueDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Council Resolution</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {fee.resolutionNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Audit Registry</p>
                    <div className="mt-0.5">
                      <VerificationBadge
                        status="Verified"
                        referenceNo={fee.code}
                        hash={fee.ledgerRecordHash}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-2 border-t pt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/student/fees/${fee.id}`}>
                    <Eye className="h-3.5 w-3.5" />
                    View Fee Breakdown
                  </Link>
                </Button>
                {fee.status === "Paid" ? (
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/student/receipt/SSC-RCP-2026-000001">
                      <FileCheck2 className="h-3.5 w-3.5" />
                      View Digital Receipt
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="sm">
                    <Link href={`/student/payment?feeId=${fee.id}`}>
                      <CreditCard className="h-3.5 w-3.5" />
                      Pay {formatCurrency(fee.amount)}
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
