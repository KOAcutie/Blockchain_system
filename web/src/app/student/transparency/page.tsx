"use client";

import * as React from "react";
import Link from "next/link";
import {
  Landmark,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  Users,
  Search,
  Download,
  Paperclip,
  CheckCircle2,
  Globe,
} from "lucide-react";
import {
  MOCK_FUND_USAGES,
  MOCK_FEES,
  type FundUsageItem,
  type FeeItem,
} from "@/lib/mock-data";
import { transparencyApi } from "@/lib/api/transparency";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";

export default function StudentTransparencyPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [funds, setFunds] = React.useState<FundUsageItem[]>(MOCK_FUND_USAGES);
  const [fees, setFees] = React.useState<FeeItem[]>(MOCK_FEES);
  const [totalCollections, setTotalCollections] = React.useState(1248500);
  const [totalAppropriated, setTotalAppropriated] = React.useState(775000);
  const [totalUtilized, setTotalUtilized] = React.useState(700250);
  const [reserveBalance, setReserveBalance] = React.useState(548250);
  const [selectedFund, setSelectedFund] = React.useState<FundUsageItem | null>(
    null
  );

  React.useEffect(() => {
    let active = true;
    transparencyApi
      .getTransparencyOverview()
      .then(({ summary, fees: apiFees, funds: apiFunds }) => {
        if (!active) return;
        if (apiFunds.length > 0) {
          setFunds(apiFunds);
          const approvedSum = apiFunds.reduce(
            (sum, item) => sum + item.amountApproved,
            0
          );
          const utilizedSum = apiFunds.reduce(
            (sum, item) => sum + item.amountUtilized,
            0
          );
          if (approvedSum > 0) setTotalAppropriated(approvedSum);
          if (utilizedSum > 0) setTotalUtilized(utilizedSum);
        }
        if (apiFees.length > 0) {
          setFees(apiFees);
        }
        if (summary && summary.total_collections > 0) {
          setTotalCollections(summary.total_collections);
          setReserveBalance(summary.recorded_balance);
        }
      })
      .catch(() => {
        // Fallback when offline
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredFunds = funds.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.resolutionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.committee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Student Portal", href: "/student/dashboard" },
          { label: "Financial Transparency Portal" },
        ]}
        title="SSC Financial Transparency Portal"
        description="Public, student-verifiable registry of all Supreme Student Council fee collections, budget appropriations, and audited project disbursements."
        badge={<VerificationBadge status="Verified" referenceNo="COA-SSC-26A" />}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/transparency">
                <Globe className="h-4 w-4" />
                Public View (No Account)
              </Link>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                toast({
                  title: "Public Audit Summary Exported",
                  description:
                    "Downloaded 1st Semester SSC Transparency Statement (CSV/PDF).",
                  variant: "verified",
                })
              }
            >
              <Download className="h-4 w-4" />
              Download Public Statement
            </Button>
          </>
        }
      />

      {/* Financial Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Collections (1st Sem)"
          value={formatCurrency(totalCollections)}
          subtitle={`Across ${fees.length} approved SSC fee schedules`}
          icon={Landmark}
          tone="primary"
        />
        <StatCard
          title="Approved Appropriations"
          value={formatCurrency(totalAppropriated)}
          subtitle="Authorized via Student Assembly resolutions"
          icon={TrendingUp}
          tone="default"
        />
        <StatCard
          title="Audited Disbursements"
          value={formatCurrency(totalUtilized)}
          subtitle="100% supported by COA-verified vouchers"
          icon={ShieldCheck}
          tone="verified"
        />
        <StatCard
          title="Unencumbered Reserve"
          value={formatCurrency(reserveBalance)}
          subtitle="Held in official LandBank SSC Trust Account"
          icon={Users}
          tone="verified"
        />
      </div>

      {/* Tabs: Approved Fund Usage vs Collection Progress */}
      <Tabs defaultValue="disbursements" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="disbursements">
              Approved Fund Usage ({funds.length})
            </TabsTrigger>
            <TabsTrigger value="collections">
              Fee Collection Breakdown ({fees.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resolutions or programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="disbursements">
          <Card>
            <CardHeader>
              <CardTitle>Audited SSC Fund Utilization Registry</CardTitle>
              <CardDescription>
                Every council expenditure requires an approved Student Assembly
                appropriation act and is attested on the transparency ledger.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFunds.length === 0 ? (
                <EmptyState
                  title="No Matching Disbursement Records"
                  description="No published council appropriations matched your search query."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear Search
                    </Button>
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resolution &amp; Program</TableHead>
                      <TableHead>Committee</TableHead>
                      <TableHead>Approved Budget</TableHead>
                      <TableHead>Utilized Amount</TableHead>
                      <TableHead>Audit Verification</TableHead>
                      <TableHead className="text-right">Vouchers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFunds.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-semibold text-foreground">
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.resolutionNo} • {item.beneficiaries}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.committee}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.amountApproved)}
                        </TableCell>
                        <TableCell className="font-bold text-foreground">
                          {formatCurrency(item.amountUtilized)}
                        </TableCell>
                        <TableCell>
                          <VerificationBadge
                            status={
                              item.status === "Under Audit"
                                ? "Pending"
                                : "Verified & Published"
                            }
                            hash={item.verificationHash}
                            referenceNo={item.resolutionNo}
                            timestamp={item.dateApproved}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFund(item)}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>{item.attachmentsCount} Docs</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections">
          <Card>
            <CardHeader>
              <CardTitle>Semester Fee Collection Progress by Levy</CardTitle>
              <CardDescription>
                Real-time student participation and verified collection totals
                for 1st Semester, AY 2026–2027.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fees.map((fee) => {
                const collected = (fee.collectedCount ?? 0) * fee.amount;
                const pct = Math.round(
                  ((fee.collectedCount ?? 0) / (fee.totalStudents ?? 1)) * 100
                );
                return (
                  <div
                    key={fee.id}
                    className="rounded-xl border p-4 space-y-3 bg-muted/15"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {fee.code}
                          </Badge>
                          <span className="font-semibold text-sm">
                            {fee.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fee.resolutionNo} • {formatCurrency(fee.amount)} per
                          student
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-base font-bold text-foreground">
                          {formatCurrency(collected)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fee.collectedCount?.toLocaleString()} /{" "}
                          {fee.totalStudents?.toLocaleString()} students ({pct}
                          %)
                        </p>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        <FileCheck2 className="h-3.5 w-3.5 text-verified shrink-0" />
                        <span>
                          Allocations: {fee.allocatedDepartments.join(" • ")}
                        </span>
                      </span>
                      <VerificationBadge
                        status="Verified"
                        referenceNo={fee.code}
                        hash={fee.ledgerRecordHash}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* COA Voucher & Liquidation Inspection Modal */}
      <Dialog
        open={!!selectedFund}
        onOpenChange={(open) => {
          if (!open) setSelectedFund(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedFund && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <FileCheck2 className="h-5 w-5 text-verified" />
                  <Badge variant="outline" className="font-mono">
                    {selectedFund.resolutionNo}
                  </Badge>
                </div>
                <DialogTitle>{selectedFund.title}</DialogTitle>
                <DialogDescription>
                  Implemented by {selectedFund.committee} • Approved{" "}
                  {selectedFund.dateApproved}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Approved Budget</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(selectedFund.amountApproved)}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">
                    Actual Utilized &amp; Liquidated
                  </span>
                  <span className="font-bold text-primary">
                    {formatCurrency(selectedFund.amountUtilized)}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">
                    Unexpended Balance Returned
                  </span>
                  <span className="font-semibold text-verified">
                    {formatCurrency(
                      selectedFund.amountApproved - selectedFund.amountUtilized
                    )}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="font-semibold text-foreground">
                    Attached COA Liquidation Vouchers (
                    {selectedFund.attachmentsCount})
                  </p>
                  <div className="space-y-1.5">
                    {[
                      "Official Student Assembly Appropriation Resolution.pdf",
                      "Supplier Official Receipts & Canvass Sheet.pdf",
                      "SCOA Post-Disbursement Audit Clearance Certificate.pdf",
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-verified shrink-0" />
                          {doc}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          Verified
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">
                    Close
                  </Button>
                </DialogClose>
                <Button
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Liquidation Packet Downloaded",
                      description: `Exported ${selectedFund.attachmentsCount} audited vouchers for ${selectedFund.resolutionNo}.`,
                      variant: "verified",
                    });
                    setSelectedFund(null);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Voucher Bundle
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
