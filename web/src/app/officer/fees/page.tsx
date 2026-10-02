"use client";

import * as React from "react";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Settings2,
  ArrowRight,
  Users,
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

export default function OfficerFeesPage() {
  const [feeList, setFeeList] = React.useState<FeeItem[]>(MOCK_FEES);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let active = true;
    feesApi
      .getOfficerFees()
      .then((data) => {
        if (active && data.length > 0) {
          setFeeList(data);
        }
      })
      .catch(() => {
        // Fallback to MOCK_FEES when offline
      });
    return () => {
      active = false;
    };
  }, []);

  const fees = feeList.filter(
    (f) =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.resolutionNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "SSC Officer Portal", href: "/officer/dashboard" },
          { label: "Fee Management" },
        ]}
        title="SSC Fee Schedule Management"
        description="Configure semester student council assessments, authorizing resolutions, and collection parameters."
        actions={
          <Button asChild>
            <Link href="/officer/fees/new">
              <PlusCircle className="h-4 w-4" />
              Create New Fee Schedule
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Published Semester Fees (AY 2026–2027)</CardTitle>
            <CardDescription>
              All fee schedules anchored on the SSC transparency registry.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fee code or resolution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          {fees.length === 0 ? (
            <EmptyState
              title="No Matching Fee Schedules"
              description="No SSC fee assessments matched your search filter."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearch("")}
                >
                  Clear Search
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Fee Title &amp; Resolution</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Collection Progress</TableHead>
                  <TableHead>Registry Status</TableHead>
                  <TableHead className="text-right">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => {
                  const pct = Math.round(
                    ((fee.collectedCount ?? 0) / (fee.totalStudents ?? 1)) * 100
                  );
                  return (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {fee.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          {fee.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {fee.resolutionNo} • Due {fee.dueDate}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(fee.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {fee.collectedCount?.toLocaleString()} /{" "}
                            {fee.totalStudents?.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <VerificationBadge
                          status="Verified"
                          referenceNo={fee.code}
                          hash={fee.ledgerRecordHash}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/officer/fees/${fee.id}`}>
                            <Settings2 className="h-3.5 w-3.5" />
                            Configure
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
