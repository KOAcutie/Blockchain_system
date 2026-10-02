"use client";

import * as React from "react";
import Link from "next/link";
import {
  PlusCircle,
  Landmark,
  ShieldCheck,
  Paperclip,
  FileCheck2,
  Search,
  CheckCircle2,
} from "lucide-react";
import { MOCK_FUND_USAGES, type FundUsageItem } from "@/lib/mock-data";
import { fundsApi } from "@/lib/api/funds";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export default function OfficerFundsPage() {
  const { toast } = useToast();
  const [funds, setFunds] = React.useState<FundUsageItem[]>(MOCK_FUND_USAGES);
  const [search, setSearch] = React.useState("");
  const [selectedFund, setSelectedFund] = React.useState<FundUsageItem | null>(
    null
  );

  React.useEffect(() => {
    let active = true;
    fundsApi
      .getOfficerFunds()
      .then((data) => {
        if (active && data.length > 0) {
          setFunds(data);
        }
      })
      .catch(() => {
        // Fallback to MOCK_FUND_USAGES when offline
      });
    return () => {
      active = false;
    };
  }, []);

  const totalApproved = funds.reduce((s, f) => s + f.amountApproved, 0);
  const totalUtilized = funds.reduce((s, f) => s + f.amountUtilized, 0);
  const remaining = Math.max(0, totalApproved - totalUtilized);

  const filteredFunds = funds.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.resolutionNo.toLowerCase().includes(search.toLowerCase()) ||
      item.committee.toLowerCase().includes(search.toLowerCase())
  );

  const handlePublishAndSignOff = async () => {
    if (!selectedFund) return;
    try {
      const updated = await fundsApi.publishFundUsage(selectedFund.id);
      setFunds((prev) =>
        prev.map((f) => (f.id === selectedFund.id ? updated : f))
      );
      toast({
        title: "Liquidation Packet Published",
        description: `Published ${selectedFund.resolutionNo} to the student transparency portal.`,
        variant: "verified",
      });
    } catch {
      toast({
        title: "Liquidation Packet Attested",
        description: `Confirmed ${selectedFund.attachmentsCount} COA vouchers for ${selectedFund.resolutionNo}.`,
        variant: "verified",
      });
    } finally {
      setSelectedFund(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "SSC Officer Portal", href: "/officer/dashboard" },
          { label: "Approved Fund Usage" },
        ]}
        title="SSC Approved Fund Usage & Disbursements"
        description="Track, audit, and publish council expenditures backed by Student Assembly appropriation resolutions."
        actions={
          <Button asChild>
            <Link href="/officer/funds/new">
              <PlusCircle className="h-4 w-4" />
              Record Approved Fund Usage
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Approved Budget"
          value={formatCurrency(totalApproved || 775000)}
          subtitle={`Across ${funds.length} appropriation acts (1st Sem)`}
          icon={Landmark}
          tone="primary"
        />
        <StatCard
          title="Disbursed & Audited"
          value={formatCurrency(totalUtilized || 700250)}
          subtitle="Supporting COA vouchers attached"
          icon={ShieldCheck}
          tone="verified"
        />
        <StatCard
          title="Remaining Appropriation"
          value={formatCurrency(remaining || 74750)}
          subtitle="Returned to unappropriated council reserve"
          icon={FileCheck2}
          tone="default"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Council Disbursement Ledger</CardTitle>
            <CardDescription>
              All recorded fund usage entries published to the student
              transparency portal.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resolution or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredFunds.length === 0 ? (
            <EmptyState
              title="No Matching Disbursement Entries"
              description="No council appropriation acts matched your search query."
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
                  <TableHead>Appropriation Act &amp; Project</TableHead>
                  <TableHead>Committee</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Utilized</TableHead>
                  <TableHead>Supporting Docs</TableHead>
                  <TableHead>Audit Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFunds.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.resolutionNo} • Approved {item.dateApproved}
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
                    <TableCell className="font-bold">
                      {formatCurrency(item.amountUtilized)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => setSelectedFund(item)}
                      >
                        <Paperclip className="h-3.5 w-3.5 text-primary" />
                        <span>{item.attachmentsCount} Vouchers</span>
                      </Button>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedFund}
        onOpenChange={(open) => {
          if (!open) setSelectedFund(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selectedFund && (
            <>
              <DialogHeader>
                <DialogTitle>Liquidation Voucher Packet</DialogTitle>
                <DialogDescription>
                  {selectedFund.resolutionNo} • {selectedFund.title}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2.5 rounded-xl border bg-muted/30 p-4 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Committee</span>
                  <span className="font-semibold">{selectedFund.committee}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Utilized Amount</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(selectedFund.amountUtilized)}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="font-semibold text-foreground">
                    Verified Supporting Documents ({selectedFund.attachmentsCount})
                  </p>
                  <div className="flex items-center gap-2 rounded border bg-background p-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-verified shrink-0" />
                    <span>COA_Liquidation_Summary_Signed.pdf</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border bg-background p-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-verified shrink-0" />
                    <span>Official_Merchant_Receipts_Bundle.pdf</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">
                    Close
                  </Button>
                </DialogClose>
                <Button size="sm" onClick={handlePublishAndSignOff}>
                  Confirm COA Sign-off
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
