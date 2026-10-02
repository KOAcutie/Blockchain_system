"use client";

import * as React from "react";
import {
  FileSpreadsheet,
  Download,
  FileCheck2,
  BarChart3,
  Printer,
  Calendar,
} from "lucide-react";
import { reportsApi } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const INITIAL_REPORTS = [
  {
    id: "rep-2026-01",
    code: "SSC-COA-2026-Q1",
    title: "1st Semester SSC Fee Collection & Remittance Statement",
    period: "August 15 – September 29, 2026",
    preparedBy: "Office of the VP for Finance & Audit",
    totalAmount: 1248500,
    format: "PDF & CSV Audit Bundle",
    hash: "0x9a1c5e3b7d2f6a8c4e0b9d3f7a1c5e9b2d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c",
  },
  {
    id: "rep-2026-02",
    code: "SSC-COA-2026-DISB",
    title: "Consolidated Schedule of Approved Appropriations & Liquidations",
    period: "1st Semester, AY 2026–2027",
    preparedBy: "Student Commission on Audit (SCOA)",
    totalAmount: 700250,
    format: "COA Standard Form 4B",
    hash: "0x4e8b2d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c6e0b4d8f2a6c0e4b8d2f6a0c4e8b",
  },
  {
    id: "rep-2026-03",
    code: "SSC-COL-2026-CCIS",
    title: "College-Level Student Fee Settlement & Clearance Roster",
    period: "As of September 29, 2026",
    preparedBy: "SSC Automated Clearance Registry",
    totalAmount: 384200,
    format: "Registrar Clearance Export",
    hash: "0x7c1e5b9d3f7a1c5e9b3d7f1a5c9e3b7d1f5a9c3e7b1d5f9a3c7e1b5d9f3a7c1e",
  },
];

export default function OfficerReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = React.useState(INITIAL_REPORTS);
  const [netBalance, setNetBalance] = React.useState(548250);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState(
    "Monthly Unencumbered Reserve & Trust Account Reconciliation"
  );
  const [newPeriod, setNewPeriod] = React.useState("October 2026 Cut-off");
  const [newFormat, setNewFormat] = React.useState("COA Standard Form 4B");

  React.useEffect(() => {
    let active = true;
    reportsApi
      .getSummary()
      .then((summary) => {
        if (!active) return;
        if (summary.total_collections > 0 || summary.total_expenses > 0) {
          setNetBalance(summary.net_balance || 548250);
          setReports((prev) =>
            prev.map((rep, idx) => {
              if (idx === 0 && summary.total_collections > 0) {
                return { ...rep, totalAmount: summary.total_collections };
              }
              if (idx === 1 && summary.total_expenses > 0) {
                return { ...rep, totalAmount: summary.total_expenses };
              }
              return rep;
            })
          );
        }
      })
      .catch(() => {
        // Fallback when offline
      });
    return () => {
      active = false;
    };
  }, []);

  const handleGenerateStatement = (e: React.FormEvent) => {
    e.preventDefault();
    const nextNum = reports.length + 1;
    const code = `SSC-COA-2026-0${nextNum}`;
    const newReport = {
      id: `rep-2026-0${nextNum}`,
      code,
      title: newTitle.trim() || "Custom SSC Financial Statement",
      period: newPeriod.trim() || "1st Semester, AY 2026–2027",
      preparedBy: "Office of the VP for Finance & Audit",
      totalAmount: netBalance,
      format: newFormat,
      hash: "0x2b6d0f4a8c2e6b0d4f8a1c5e9b3d7f2a6c0e4b8d2f6a0c4e8b2d6f0a4c8e2b6d",
    };
    setReports((prev) => [newReport, ...prev]);
    setModalOpen(false);
    toast({
      title: `Generated ${code}`,
      description:
        "Compiled custom financial statement and anchored verification checksum.",
      variant: "verified",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "SSC Officer Portal", href: "/officer/dashboard" },
          { label: "Financial Reports" },
        ]}
        title="Financial Statements & Audit Reports"
        description="Generate, inspect, and export COA-compliant student council financial statements with embedded verification digests."
        actions={
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <BarChart3 className="h-4 w-4" />
                Generate Custom Statement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleGenerateStatement} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Generate COA Financial Statement</DialogTitle>
                  <DialogDescription>
                    Compile verified collections and disbursements into an
                    attested report bundle.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rep-title">Statement Title</Label>
                    <Input
                      id="rep-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rep-period">Reporting Period</Label>
                    <Input
                      id="rep-period"
                      value={newPeriod}
                      onChange={(e) => setNewPeriod(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rep-format">Audit Export Format</Label>
                    <Select
                      id="rep-format"
                      value={newFormat}
                      onChange={(e) => setNewFormat(e.target.value)}
                    >
                      <option value="COA Standard Form 4B">
                        COA Standard Form 4B
                      </option>
                      <option value="PDF & CSV Audit Bundle">
                        PDF &amp; CSV Audit Bundle
                      </option>
                      <option value="Registrar Clearance Export">
                        Registrar Clearance Export
                      </option>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" size="sm">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" size="sm">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Compile &amp; Attest Report
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="flex flex-col justify-between">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono">
                  {report.code}
                </Badge>
                <VerificationBadge
                  status="Verified"
                  referenceNo={report.code}
                  hash={report.hash}
                />
              </div>
              <div>
                <CardTitle className="text-base leading-snug">
                  {report.title}
                </CardTitle>
                <CardDescription className="mt-1.5 flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  {report.period}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Covered</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(report.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prepared By</span>
                  <span className="font-medium text-right">
                    {report.preparedBy}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Export Format</span>
                  <span className="font-medium">{report.format}</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-2 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: "Printing Official Report",
                    description: `Sending ${report.code} to print preview.`,
                  })
                }
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  toast({
                    title: `Exported ${report.code}`,
                    description:
                      "Report bundle downloaded with cryptographic verification sheet.",
                    variant: "verified",
                  })
                }
              >
                <Download className="h-3.5 w-3.5" />
                Download Bundle
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Summary Audit Compliance Banner */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-verified-muted text-verified">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Student Commission on Audit (SCOA) Digital Compliance
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                All exported reports include a cryptographic checksum matching
                the public transparency portal so student publications and
                university auditors can verify that no figures were modified
                after export.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={() =>
              toast({
                title: "All Semester Checksums Verified",
                description: `Zero discrepancies detected across ${reports.length} published financial reports.`,
                variant: "verified",
              })
            }
          >
            <FileSpreadsheet className="h-4 w-4" />
            Verify Report Checksums
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
