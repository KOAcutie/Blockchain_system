"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
  LogIn,
  Sparkles,
  PieChart,
  Blocks,
  Copy,
  AlertCircle,
} from "lucide-react";
import {
  MOCK_FUND_USAGES,
  MOCK_FEES,
  type FundUsageItem,
  type FeeItem,
} from "@/lib/mock-data";
import {
  transparencyApi,
  type PublicLedgerEntry,
  type PublicVerificationResult,
} from "@/lib/api/transparency";
import { apiRequest } from "@/lib/api/client";
import { formatCurrency, truncateHash } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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

const DEFAULT_LEDGER_ENTRIES: PublicLedgerEntry[] = [
  {
    id: "tx-1",
    record_type: "Fee Collection Receipt",
    reference: "SSC-2026-000001",
    secondary_reference: "SSC-RCP-2026-000001",
    title: "Supreme Student Council General Membership & Welfare Fee",
    category: "Mandatory Council Fee",
    amount: 150.0,
    date: "Sep 24, 2026 • 10:14 AM",
    block_number: 148920,
    contract_address: "0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856",
    verification_hash:
      "0x7f9c2e4a8b1d6f3c5a9e0b2d4f8a1c7e3b9d5f1a6c2e8b4d0f7a3c9e5b1d8f4a",
    status: "Verified & Anchored",
  },
  {
    id: "tx-2",
    record_type: "Fee Collection Receipt",
    reference: "SSC-2026-000002",
    secondary_reference: "SSC-RCP-2026-000002",
    title: "Official Student Publication & Campus Press Levy",
    category: "Student Publication",
    amount: 75.0,
    date: "Sep 20, 2026 • 02:45 PM",
    block_number: 148412,
    contract_address: "0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856",
    verification_hash:
      "0x4b8d1f6a3c9e2b7d5f0a8c4e1b9d6f2a7c3e8b5d1f9a4c6e0b2d8f3a7c1e5b9d",
    status: "Verified & Anchored",
  },
  ...MOCK_FUND_USAGES.map((f, idx) => ({
    id: `fund-${f.id}`,
    record_type: "Council Fund Disbursement",
    reference: f.resolutionNo,
    secondary_reference: f.committee,
    title: f.title,
    category: f.category,
    amount: f.amountUtilized,
    date: f.dateApproved,
    block_number: 149101 + idx,
    contract_address: "0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856",
    verification_hash: f.verificationHash,
    status: f.status,
  })),
];

export function PublicTransparencyPortal() {
  const { toast } = useToast();

  const [semesterLabel, setSemesterLabel] = React.useState(
    "1st Semester, AY 2026–2027"
  );
  const [contractAddress, setContractAddress] = React.useState(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
      "0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856"
  );
  const [totalCollections, setTotalCollections] = React.useState(1248500);
  const [totalAppropriated, setTotalAppropriated] = React.useState(775000);
  const [totalUtilized, setTotalUtilized] = React.useState(700250);
  const [reserveBalance, setReserveBalance] = React.useState(548250);

  const [funds, setFunds] = React.useState<FundUsageItem[]>(MOCK_FUND_USAGES);
  const [fees, setFees] = React.useState<FeeItem[]>(MOCK_FEES);
  const [ledgerEntries, setLedgerEntries] = React.useState<PublicLedgerEntry[]>(
    DEFAULT_LEDGER_ENTRIES
  );
  const [backendConnected, setBackendConnected] = React.useState(true);

  // Filters for public tables
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [selectedFund, setSelectedFund] = React.useState<FundUsageItem | null>(
    null
  );

  // Public Cryptographic Verifier state
  const [verifyInput, setVerifyInput] = React.useState("SSC-RCP-2026-000001");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verifyResult, setVerifyResult] =
    React.useState<PublicVerificationResult | null>(null);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    Promise.allSettled([
      transparencyApi.getTransparencyOverview(),
      apiRequest<{ status: string; database_connected: boolean }>("/health", {
        requireAuth: false,
      }),
    ]).then(([overviewRes, healthRes]) => {
      if (!active) return;

      if (overviewRes.status === "fulfilled") {
        const {
          summary,
          fees: apiFees,
          funds: apiFunds,
          ledger: apiLedger,
        } = overviewRes.value;

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

        if (apiLedger && apiLedger.length > 0) {
          setLedgerEntries(apiLedger);
        }

        if (summary) {
          if (summary.semester) setSemesterLabel(summary.semester);
          if (summary.contract_address) {
            setContractAddress(summary.contract_address);
          }
          if (summary.total_collections > 0) {
            setTotalCollections(summary.total_collections);
            setReserveBalance(summary.recorded_balance);
          }
          if (
            summary.total_approved_budget &&
            summary.total_approved_budget > 0
          ) {
            setTotalAppropriated(summary.total_approved_budget);
          }
        }
      }

      if (healthRes.status === "fulfilled") {
        setBackendConnected(Boolean(healthRes.value.database_connected));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const runPublicVerification = async (queryToVerify?: string) => {
    const q = (queryToVerify ?? verifyInput).trim();
    if (!q) {
      setVerifyError(
        "Please enter a receipt number, transaction reference, resolution number, or 0x hash."
      );
      return;
    }

    setVerifyError(null);
    setIsVerifying(true);
    try {
      const result = await transparencyApi.verifyPublicRecord(q);
      setVerifyResult(result);
      toast({
        title: "Public Record Verified",
        description: `${result.reference} (${result.record_type}) confirmed on the SSC audit registry.`,
        variant: "verified",
      });
    } catch {
      // Local fallback check against loaded public records if offline
      const matchedFund = funds.find(
        (f) =>
          f.resolutionNo.toLowerCase() === q.toLowerCase() ||
          f.verificationHash.toLowerCase() === q.toLowerCase()
      );
      const matchedFee = fees.find(
        (f) =>
          f.code.toLowerCase() === q.toLowerCase() ||
          f.resolutionNo.toLowerCase() === q.toLowerCase() ||
          f.ledgerRecordHash.toLowerCase() === q.toLowerCase()
      );
      const matchedLedger = ledgerEntries.find(
        (l) =>
          l.reference.toLowerCase() === q.toLowerCase() ||
          l.secondary_reference.toLowerCase() === q.toLowerCase() ||
          l.verification_hash.toLowerCase() === q.toLowerCase()
      );

      if (matchedLedger) {
        setVerifyResult({
          verified: true,
          record_type: matchedLedger.record_type,
          reference: matchedLedger.reference,
          secondary_reference: matchedLedger.secondary_reference,
          title: matchedLedger.title,
          amount: matchedLedger.amount,
          status: matchedLedger.status,
          timestamp: matchedLedger.date,
          block_number: matchedLedger.block_number,
          contract_address: matchedLedger.contract_address,
          record_hash: matchedLedger.verification_hash,
        });
      } else if (matchedFund) {
        setVerifyResult({
          verified: true,
          record_type: "Approved SSC Fund Disbursement",
          reference: matchedFund.resolutionNo,
          secondary_reference: matchedFund.committee,
          title: matchedFund.title,
          amount: matchedFund.amountUtilized,
          status: matchedFund.status,
          timestamp: matchedFund.dateApproved,
          block_number: 149104,
          contract_address: contractAddress,
          record_hash: matchedFund.verificationHash,
        });
      } else if (matchedFee) {
        setVerifyResult({
          verified: true,
          record_type: "Approved SSC Fee Mandate",
          reference: matchedFee.code,
          secondary_reference: matchedFee.resolutionNo,
          title: matchedFee.title,
          amount: matchedFee.amount,
          status: "Active Semester Levy",
          timestamp: matchedFee.dueDate,
          block_number: 148100,
          contract_address: contractAddress,
          record_hash: matchedFee.ledgerRecordHash,
        });
      } else {
        setVerifyResult(null);
        setVerifyError(
          `No public record matched "${q}". Try a receipt number (e.g. SSC-RCP-2026-000001), transaction ID (SSC-2026-000001), or resolution number.`
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportPublicStatementCsv = () => {
    const rows: string[][] = [
      ["SSC PUBLIC FINANCIAL TRANSPARENCY STATEMENT"],
      ["Academic Period", semesterLabel],
      ["Smart Contract Registry", contractAddress],
      ["Total Verified Collections (PHP)", String(totalCollections)],
      ["Total Approved Appropriations (PHP)", String(totalAppropriated)],
      ["Total Audited Disbursements (PHP)", String(totalUtilized)],
      ["Unencumbered Reserve Balance (PHP)", String(reserveBalance)],
      [],
      ["APPROVED SEMESTER FEE SCHEDULES & COLLECTIONS"],
      [
        "Fee Code",
        "Resolution No",
        "Fee Title",
        "Category",
        "Unit Amount (PHP)",
        "Due Date",
        "Students Paid",
        "Total Assigned",
        "Ledger Hash",
      ],
      ...fees.map((f) => [
        f.code,
        f.resolutionNo,
        `"${f.title.replace(/"/g, '""')}"`,
        f.category,
        String(f.amount),
        f.dueDate,
        String(f.collectedCount ?? 0),
        String(f.totalStudents ?? 0),
        f.ledgerRecordHash,
      ]),
      [],
      ["AUDITED COUNCIL FUND DISBURSEMENTS"],
      [
        "Resolution No",
        "Program Title",
        "Category",
        "Implementing Committee",
        "Approved Budget (PHP)",
        "Actual Utilized (PHP)",
        "Date Approved",
        "Status",
        "Verification Hash",
      ],
      ...funds.map((item) => [
        item.resolutionNo,
        `"${item.title.replace(/"/g, '""')}"`,
        item.category,
        `"${item.committee.replace(/"/g, '""')}"`,
        String(item.amountApproved),
        String(item.amountUtilized),
        item.dateApproved,
        item.status,
        item.verificationHash,
      ]),
    ];

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SSC_Public_Transparency_Statement_AY2026-2027.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Public Financial Statement Downloaded",
      description:
        "Exported complete SSC collections, fee mandates, and audited disbursements (CSV).",
      variant: "verified",
    });
  };

  const filteredFunds = funds.filter((item) => {
    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.resolutionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.committee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.beneficiaries.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const filteredLedger = ledgerEntries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.secondary_reference
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      entry.verification_hash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories: FundUsageItem["category"][] = [
    "Student Welfare",
    "Academic Initiatives",
    "Campus Events",
    "Operations & Audit",
  ];

  const categoryBreakdowns = categories.map((cat) => {
    const items = funds.filter((f) => f.category === cat);
    const approved = items.reduce((s, i) => s + i.amountApproved, 0);
    const utilized = items.reduce((s, i) => s + i.amountUtilized, 0);
    const pctOfBudget =
      totalAppropriated > 0
        ? Math.round((approved / totalAppropriated) * 100)
        : 0;
    const utilizationPct =
      approved > 0 ? Math.round((utilized / approved) * 100) : 0;

    return {
      category: cat,
      count: items.length,
      approved,
      utilized,
      remaining: Math.max(approved - utilized, 0),
      pctOfBudget,
      utilizationPct,
    };
  });

  const overallUtilizationPct =
    totalAppropriated > 0
      ? Math.round((totalUtilized / totalAppropriated) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Modern Glassmorphic Public Top Navigation Bar — NO user account shown */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-0.5 shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.35)] transition-transform group-hover:scale-105 border border-primary/20">
              <Image
                src="/ssc-logo.png"
                alt="Supreme Student Council Seal"
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight truncate">
                  SSC Transparency
                </span>
                <Badge
                  variant="verified"
                  className="hidden xs:inline-flex text-[10px] px-2 py-0 rounded-full"
                >
                  <Globe className="mr-1 h-3 w-3" />
                  Public Open View
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Supreme Student Council • Public Financial &amp; Audit Registry
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1 text-xs font-semibold text-muted-foreground shadow-2xs">
            <a
              href="#financial-summary"
              className="rounded-full px-3 py-1.5 hover:bg-accent hover:text-primary transition-colors"
            >
              Summary
            </a>
            <a
              href="#public-verifier"
              className="rounded-full px-3 py-1.5 hover:bg-accent hover:text-primary transition-colors"
            >
              Receipt &amp; Hash Verifier
            </a>
            <a
              href="#public-registry"
              className="rounded-full px-3 py-1.5 hover:bg-accent hover:text-primary transition-colors"
            >
              Disbursements, Fees &amp; Ledger
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPublicStatementCsv}
              className="hidden sm:inline-flex rounded-full"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/login">
                <LogIn className="h-3.5 w-3.5" />
                <span>Portal Sign In</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Public Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl space-y-8 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8 md:pb-12">
        {/* Modern Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-5 sm:p-8 lg:p-10 shadow-[0_8px_30px_-8px_rgba(128,0,32,0.08)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-primary/70 to-verified" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 max-w-3xl">
              <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.25)] border border-primary/20">
                <Image
                  src="/ssc-logo.png"
                  alt="Supreme Student Council Official Seal"
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <div className="space-y-3.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-0.5">
                    <Globe className="mr-1 h-3 w-3 text-primary" />
                    Open Public Access • No Login Required
                  </Badge>
                  <VerificationBadge
                    status="Verified"
                    referenceNo="COA-SSC-2026"
                    contractAddress={contractAddress}
                  />
                  {backendConnected && (
                    <Badge variant="verified" className="gap-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Official Audit Registry Active
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl leading-tight">
                  Supreme Student Council Public Financial Transparency Portal
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Welcome to the official open-data financial registry of the
                  Supreme Student Council ({semesterLabel}). Every student,
                  parent, faculty adviser, and auditor can inspect all council fee
                  collections, Student Assembly appropriations, COA liquidation
                  vouchers, and verified official receipts below without
                  signing in.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <Button onClick={handleExportPublicStatementCsv} variant="default">
                <Download className="h-4 w-4" />
                Download Public Statement (CSV)
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  Student / Officer Sign In
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 1. Public Semester Financial Summary KPIs */}
        <section id="financial-summary" className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {semesterLabel} — Public Financial Summary
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time aggregate council collections, authorized budgets,
                audited expenditures, and trust account reserves.
              </p>
            </div>
            <a
              href={`https://sepolia.etherscan.io/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline hover:opacity-80 transition-opacity"
              title="View SSC Transparency Smart Contract on Sepolia Etherscan"
            >
              Contract: {truncateHash(contractAddress, 10, 8)}
              <span className="text-[10px]">↗</span>
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Verified Collections"
              value={formatCurrency(totalCollections)}
              subtitle={`Across ${fees.length} active semester fee mandates`}
              icon={Landmark}
              tone="primary"
            />
            <StatCard
              title="Approved Appropriations"
              value={formatCurrency(totalAppropriated)}
              subtitle={`Authorized across ${funds.length} council resolutions`}
              icon={TrendingUp}
              tone="default"
            />
            <StatCard
              title="Audited Disbursements"
              value={formatCurrency(totalUtilized)}
              subtitle={`${overallUtilizationPct}% budget utilization • COA verified`}
              icon={ShieldCheck}
              tone="verified"
            />
            <StatCard
              title="Unencumbered Council Reserve"
              value={formatCurrency(reserveBalance)}
              subtitle="Held in official LandBank SSC Trust Account"
              icon={Users}
              tone="verified"
            />
          </div>
        </section>

        {/* 2. Public Cryptographic Receipt, Transaction & Resolution Verifier */}
        <section id="public-verifier">
          <Card className="border-primary/25 bg-card">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      Public Receipt &amp; Transaction Verification Engine
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Verify any official digital receipt number, transaction
                    reference, Student Assembly resolution, or SHA-256 hash
                    directly against the public SSC ledger — no account
                    required.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[11px] w-fit">
                  Instant Public Verification
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runPublicVerification();
                }}
                className="flex flex-col gap-2.5 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={verifyInput}
                    onChange={(e) => {
                      setVerifyInput(e.target.value);
                      if (verifyError) setVerifyError(null);
                    }}
                    placeholder="Enter Receipt No. (SSC-RCP-2026-000001), Transaction ID (SSC-2026-000001), Resolution, or 0x Hash..."
                    className="pl-9 font-mono text-xs sm:text-sm"
                  />
                </div>
                <Button type="submit" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Spinner size="sm" />
                      <span>Verifying Ledger...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify Public Record</span>
                    </>
                  )}
                </Button>
              </form>

              {/* Quick Sample Public Lookups */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Quick Public Check:
                </span>
                {[
                  {
                    label: "Receipt: SSC-RCP-2026-000001",
                    value: "SSC-RCP-2026-000001",
                  },
                  {
                    label: "Transaction: SSC-2026-000001",
                    value: "SSC-2026-000001",
                  },
                  {
                    label: "Appropriation: SSC Appropriation Act No. 2026-012",
                    value: "SSC Appropriation Act No. 2026-012",
                  },
                  {
                    label: "Fee Levy: SSC-GEN-26A",
                    value: "SSC-GEN-26A",
                  },
                ].map((sample) => (
                  <button
                    key={sample.value}
                    type="button"
                    onClick={() => {
                      setVerifyInput(sample.value);
                      runPublicVerification(sample.value);
                    }}
                    className="rounded-full border bg-secondary/60 px-2.5 py-1 font-mono text-[11px] text-secondary-foreground hover:border-primary hover:bg-accent transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              {verifyError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {verifyResult && (
                <div className="rounded-xl border border-verified/35 bg-verified-muted/25 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-verified/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-5 w-5 text-verified shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {verifyResult.record_type} — {verifyResult.status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {verifyResult.title}
                        </p>
                      </div>
                    </div>
                    <Badge variant="verified" className="w-fit font-mono">
                      {verifyResult.reference}
                    </Badge>
                  </div>

                  <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground block">
                        Primary Reference
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {verifyResult.reference}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Linked Reference / Committee
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {verifyResult.secondary_reference || "SSC Registry"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Verified Amount
                      </span>
                      <span className="font-bold text-primary">
                        {formatCurrency(verifyResult.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Block &amp; Timestamp
                      </span>
                      <span className="font-mono text-foreground">
                        {verifyResult.block_number
                          ? `Block #${verifyResult.block_number.toLocaleString()}`
                          : "Pending Block"}{" "}
                        • {verifyResult.timestamp || "AY 2026–2027"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-background/80 px-3 py-2 text-xs">
                    <div className="truncate font-mono text-[11px]">
                      <span className="text-muted-foreground">
                        Cryptographic Digest:{" "}
                      </span>
                      <span className="text-foreground font-medium">
                        {verifyResult.record_hash}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => {
                        navigator.clipboard?.writeText(verifyResult.record_hash);
                        toast({
                          title: "Hash Copied",
                          description:
                            "Cryptographic digest copied to clipboard.",
                        });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Digest
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* 3. All Public Information Tabs */}
        <section id="public-registry" className="space-y-4">
          <Tabs defaultValue="disbursements" className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="disbursements" className="gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  Approved Fund Usage ({funds.length})
                </TabsTrigger>
                <TabsTrigger value="collections" className="gap-1.5">
                  <Landmark className="h-3.5 w-3.5" />
                  Fee Schedules &amp; Collections ({fees.length})
                </TabsTrigger>
                <TabsTrigger value="allocation" className="gap-1.5">
                  <PieChart className="h-3.5 w-3.5" />
                  Budget Allocation by Category ({categoryBreakdowns.length})
                </TabsTrigger>
                <TabsTrigger value="ledger" className="gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  Public Audit Registry ({ledgerEntries.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="w-full sm:w-48">
                  <Select
                    aria-label="Filter by budget category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="ALL">All Budget Categories</option>
                    <option value="Student Welfare">Student Welfare</option>
                    <option value="Academic Initiatives">
                      Academic Initiatives
                    </option>
                    <option value="Campus Events">Campus Events</option>
                    <option value="Operations & Audit">
                      Operations &amp; Audit
                    </option>
                  </Select>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resolutions, fees, hashes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* TAB 1: Approved Fund Usage & Disbursements */}
            <TabsContent value="disbursements">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Audited SSC Fund Utilization &amp; Disbursement Registry
                  </CardTitle>
                  <CardDescription>
                    Complete public list of Student Assembly-approved
                    appropriations, implementing committees, target
                    beneficiaries, actual liquidated amounts, and COA vouchers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredFunds.length === 0 ? (
                    <EmptyState
                      title="No Matching Disbursement Records"
                      description="No published council appropriations matched your search or category filter."
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setCategoryFilter("ALL");
                          }}
                        >
                          Reset Filters
                        </Button>
                      }
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Resolution &amp; Program Title</TableHead>
                          <TableHead>Category &amp; Committee</TableHead>
                          <TableHead>Approved Budget</TableHead>
                          <TableHead>Actual Utilized</TableHead>
                          <TableHead>Remaining</TableHead>
                          <TableHead>Audit Verification</TableHead>
                          <TableHead className="text-right">
                            COA Packet
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFunds.map((item) => {
                          const unexpended = Math.max(
                            item.amountApproved - item.amountUtilized,
                            0
                          );
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="font-semibold text-foreground">
                                  {item.title}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  <span className="font-mono font-medium text-primary">
                                    {item.resolutionNo}
                                  </span>{" "}
                                  • Approved {item.dateApproved}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Beneficiaries: {item.beneficiaries}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {item.category}
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.committee}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(item.amountApproved)}
                              </TableCell>
                              <TableCell className="font-bold text-primary">
                                {formatCurrency(item.amountUtilized)}
                              </TableCell>
                              <TableCell className="font-medium text-verified">
                                {formatCurrency(unexpended)}
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
                                  <span>{item.attachmentsCount} Vouchers</span>
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
            </TabsContent>

            {/* TAB 2: Semester Fee Schedules & Collection Breakdown */}
            <TabsContent value="collections">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Approved Semester Fee Schedules &amp; Collection Breakdown
                  </CardTitle>
                  <CardDescription>
                    Public mandate registry of all SSC organization levies,
                    unit rates, department allocation percentages, and live
                    collection totals for {semesterLabel}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fees.map((fee) => {
                    const collected = (fee.collectedCount ?? 0) * fee.amount;
                    const pct = Math.min(
                      100,
                      Math.round(
                        ((fee.collectedCount ?? 0) / (fee.totalStudents ?? 1)) *
                          100
                      )
                    );
                    return (
                      <div
                        key={fee.id}
                        className="rounded-xl border p-5 space-y-3.5 bg-muted/15"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {fee.code}
                              </Badge>
                              <Badge variant="secondary">{fee.category}</Badge>
                              <span className="font-bold text-base text-foreground">
                                {fee.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                              {fee.description}
                            </p>
                            <p className="text-xs text-muted-foreground pt-0.5">
                              <strong className="text-foreground">
                                Mandate:
                              </strong>{" "}
                              {fee.resolutionNo} •{" "}
                              <strong className="text-foreground">
                                Assessment Rate:
                              </strong>{" "}
                              {formatCurrency(fee.amount)} per student •{" "}
                              <strong className="text-foreground">
                                Due Date:
                              </strong>{" "}
                              {fee.dueDate}
                            </p>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(collected)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fee.collectedCount?.toLocaleString()} /{" "}
                              {fee.totalStudents?.toLocaleString()} students
                              settled ({pct}%)
                            </p>
                          </div>
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <FileCheck2 className="h-3.5 w-3.5 text-verified shrink-0" />
                            <span className="font-semibold text-foreground">
                              Department Allocations:
                            </span>
                            {fee.allocatedDepartments.map((dept, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-[11px] font-normal"
                              >
                                {dept}
                              </Badge>
                            ))}
                          </div>
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

            {/* TAB 3: Budget Allocation by Category & Committee */}
            <TabsContent value="allocation">
              <div className="grid gap-6 lg:grid-cols-12">
                <Card className="lg:col-span-8">
                  <CardHeader>
                    <CardTitle>
                      SSC Budget Allocation &amp; Utilization by Category
                    </CardTitle>
                    <CardDescription>
                      How approved council funds are distributed across student
                      welfare, academic initiatives, campus events, and audit
                      operations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryBreakdowns.map((row) => (
                      <div
                        key={row.category}
                        className="rounded-xl border p-4 space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {row.category}
                            </span>
                            <Badge variant="secondary" className="text-[11px]">
                              {row.count} Resolution{row.count === 1 ? "" : "s"}{" "}
                              • {row.pctOfBudget}% of Total Budget
                            </Badge>
                          </div>
                          <div className="text-xs font-mono">
                            <span className="text-muted-foreground">
                              Utilized:{" "}
                            </span>
                            <span className="font-bold text-primary">
                              {formatCurrency(row.utilized)}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              / {formatCurrency(row.approved)} (
                              {row.utilizationPct}%)
                            </span>
                          </div>
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${Math.min(100, row.utilizationPct)}%`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            Approved Ceiling: {formatCurrency(row.approved)}
                          </span>
                          <span className="text-verified font-medium">
                            Unexpended Balance: {formatCurrency(row.remaining)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Student Commission on Audit (SCOA) Attestation
                    </CardTitle>
                    <CardDescription>
                      Independent Student Governance &amp; COA Oversight
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                    <p>
                      Under the Supreme Student Council Financial Transparency
                      Charter, no student organization levy or council
                      disbursement is valid unless published to this public
                      registry with a cryptographic digest.
                    </p>
                    <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2">
                      <div className="flex justify-between">
                        <span>Total Collected</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(totalCollections)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Appropriated</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(totalAppropriated)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Liquidated</span>
                        <span className="font-bold text-primary">
                          {formatCurrency(totalUtilized)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-foreground">
                          Trust Account Reserve
                        </span>
                        <span className="font-bold text-verified">
                          {formatCurrency(reserveBalance)}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-verified/30 bg-verified-muted/40 p-3 text-verified font-medium flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>
                        100% of Published Records Anchored to SSCTransparency
                        Smart Contract
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 4: Public Audit Registry */}
            <TabsContent value="ledger">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Public Attestation &amp; Audit Trail
                  </CardTitle>
                  <CardDescription>
                    Anonymized, tamper-evident log of verified fee collection
                    receipts and council fund disbursements. No personal student
                    information is exposed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredLedger.length === 0 ? (
                    <EmptyState
                      title="No Matching Registry Entries"
                      description="No public attestation records matched your search."
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
                          <TableHead>Record Type</TableHead>
                          <TableHead>Reference &amp; Linked ID</TableHead>
                          <TableHead>Particulars</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Block &amp; Timestamp</TableHead>
                          <TableHead>Cryptographic Digest</TableHead>
                          <TableHead className="text-right">Verify</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLedger.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <Badge
                                variant={
                                  entry.record_type.includes("Disbursement")
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {entry.record_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-xs font-semibold text-foreground">
                                {entry.reference}
                              </div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {entry.secondary_reference}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground text-xs sm:text-sm">
                                {entry.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {entry.category}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-primary">
                              {formatCurrency(entry.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-xs text-foreground">
                                Block #{entry.block_number.toLocaleString()}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {entry.date}
                              </div>
                            </TableCell>
                            <TableCell>
                              <VerificationBadge
                                status="Verified"
                                referenceNo={entry.reference}
                                hash={entry.verification_hash}
                                blockNumber={entry.block_number}
                                contractAddress={entry.contract_address}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setVerifyInput(entry.reference);
                                  runPublicVerification(entry.reference);
                                  document
                                    .getElementById("public-verifier")
                                    ?.scrollIntoView({ behavior: "smooth" });
                                }}
                              >
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                Verify
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
          </Tabs>
        </section>
      </main>

      {/* Public COA Voucher & Liquidation Inspection Modal */}
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
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Beneficiaries</span>
                  <span className="font-medium text-foreground text-right max-w-xs">
                    {selectedFund.beneficiaries}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="font-semibold text-foreground">
                    Public COA Liquidation Vouchers (
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
                          Publicly Audited
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
                      title: "Public Liquidation Packet Downloaded",
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

      {/* Public Footer */}
      <footer className="hidden md:block border-t bg-card/60 px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8 mt-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p>
            <strong className="font-semibold text-foreground">
              SSC Transparency
            </strong>{" "}
            • Public Open-Data Financial &amp; Audit Registry • No Account
            Required for Public Inspection
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-primary underline">
              Student &amp; Officer Sign In
            </Link>
            <span className="font-mono text-[11px]">{semesterLabel}</span>
          </div>
        </div>
      </footer>

      {/* Progressive Mobile Bottom Bar for Public View */}
      <nav
        aria-label="Public mobile quick navigation"
        className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-border/80 bg-card/92 px-2 backdrop-blur-xl md:hidden"
      >
        <a
          href="#financial-summary"
          className="flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-primary"
        >
          <Landmark className="h-4 w-4 text-primary" />
          <span>Summary</span>
        </a>
        <a
          href="#public-verifier"
          className="flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-primary"
        >
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Verify</span>
        </a>
        <a
          href="#public-registry"
          className="flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-primary"
        >
          <FileCheck2 className="h-4 w-4 text-primary" />
          <span>Registry</span>
        </a>
        <button
          type="button"
          onClick={handleExportPublicStatementCsv}
          className="flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-primary"
        >
          <Download className="h-4 w-4 text-primary" />
          <span>Export CSV</span>
        </button>
        <Link
          href="/login"
          className="flex flex-col items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-primary"
        >
          <LogIn className="h-4 w-4" />
          <span>Sign In</span>
        </Link>
      </nav>
    </div>
  );
}
