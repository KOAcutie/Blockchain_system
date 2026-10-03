"use client";

import * as React from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  FileCheck2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { truncateHash } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface VerificationBadgeProps {
  status?: "Verified" | "Pending" | "Failed" | "Verified & Published";
  hash?: string;
  blockRef?: string;
  referenceNo?: string;
  verifiedBy?: string;
  timestamp?: string;
  transactionHash?: string | null;
  txHash?: string | null;
  contractAddress?: string | null;
  blockNumber?: number | null;
  interactive?: boolean;
}

export function VerificationBadge({
  status = "Verified",
  hash = "0x7f9c2e4a8b1d6f3c5a9e0b2d4f8a1c7e3b9d5f1a6c2e8b4d0f7a3c9e5b1d8f4a",
  blockRef = "Block #148,920 • SSC Institutional Audit Registry",
  referenceNo = "SSC-OR-2026-00981",
  verifiedBy = "SSC Finance & Student COA Automated Attestation",
  timestamp = "September 24, 2026 • 10:14 AM PHT",
  transactionHash,
  txHash,
  contractAddress,
  blockNumber,
  interactive = true,
}: VerificationBadgeProps) {
  const effectiveTxHash = transactionHash || txHash;
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();
  const isVerified = status === "Verified" || status === "Verified & Published";
  const isFailed = status === "Failed";

  const handleCopyHash = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(hash).catch(() => {});
    }
    setCopied(true);
    toast({
      title: "Verification digest copied",
      description: `Record hash ${truncateHash(hash, 12, 8)} copied to clipboard.`,
      variant: "verified",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeElement = (
    <Badge
      variant={isVerified ? "verified" : isFailed ? "destructive" : "warning"}
      className={
        interactive
          ? "cursor-pointer transition-opacity hover:opacity-85"
          : undefined
      }
    >
      {isVerified ? (
        <ShieldCheck className="h-3.5 w-3.5" />
      ) : isFailed ? (
        <AlertTriangle className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      <span>
        {isVerified
          ? "Officially Verified"
          : isFailed
          ? "Verification Failed"
          : "Pending Verification"}
      </span>
    </Badge>
  );

  if (!interactive) {
    return badgeElement;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{badgeElement}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className={
              isVerified
                ? "flex items-center gap-2.5 text-verified mb-1"
                : isFailed
                ? "flex items-center gap-2.5 text-destructive mb-1"
                : "flex items-center gap-2.5 text-warning mb-1"
            }
          >
            <div
              className={
                isVerified
                  ? "flex h-9 w-9 items-center justify-center rounded-lg bg-verified-muted border border-verified/25"
                  : isFailed
                  ? "flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 border border-destructive/25"
                  : "flex h-9 w-9 items-center justify-center rounded-lg bg-warning-muted border border-warning/25"
              }
            >
              {isVerified ? (
                <FileCheck2 className="h-5 w-5 text-verified" />
              ) : isFailed ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <Clock className="h-5 w-5 text-warning" />
              )}
            </div>
            <div className="text-left">
              <DialogTitle className="text-foreground">
                Institutional Record Verification
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Supreme Student Council Tamper-Evident Audit Registry
              </p>
            </div>
          </div>
          <DialogDescription className="pt-2 text-left">
            {isVerified
              ? "This financial record has been cryptographically attested to guarantee authenticity and prevent unauthorized alteration."
              : isFailed
              ? "The payment record is safely stored, and official attestation is queued for council confirmation."
              : "This financial record has been logged in the system and is currently awaiting officer verification."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 rounded-lg border bg-muted/40 p-4 text-xs">
          <div className="flex justify-between gap-2 border-b pb-2">
            <span className="text-muted-foreground">
              Verification Status
            </span>
            <span
              className={
                isVerified
                  ? "font-semibold text-verified flex items-center gap-1"
                  : isFailed
                  ? "font-semibold text-destructive flex items-center gap-1"
                  : "font-semibold text-warning flex items-center gap-1"
              }
            >
              {isVerified ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : isFailed ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              {status}
            </span>
          </div>
          <div className="flex justify-between gap-2 border-b pb-2">
            <span className="text-muted-foreground">Document Reference</span>
            <span className="font-mono font-medium text-foreground">
              {referenceNo}
            </span>
          </div>
          <div className="flex justify-between gap-2 border-b pb-2">
            <span className="text-muted-foreground">Audit Reference</span>
            <span className="font-medium text-foreground">
              {blockNumber ? `Block #${blockNumber}` : blockRef}
            </span>
          </div>
          {contractAddress && (
            <div className="flex justify-between gap-2 border-b pb-2">
              <span className="text-muted-foreground">Contract Address</span>
              <span className="font-mono text-[11px] text-foreground">
                {truncateHash(contractAddress, 10, 8)}
              </span>
            </div>
          )}
          {effectiveTxHash && (
            <div className="flex justify-between gap-2 border-b pb-2">
              <span className="text-muted-foreground">
                Attestation Reference
              </span>
              <span className="font-mono text-[11px] text-foreground">
                {truncateHash(effectiveTxHash, 10, 8)}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-2 border-b pb-2">
            <span className="text-muted-foreground">Timestamp</span>
            <span className="text-foreground">{timestamp}</span>
          </div>
          <div className="flex justify-between gap-2 border-b pb-2">
            <span className="text-muted-foreground">Attested By</span>
            <span className="text-right font-medium text-foreground">
              {verifiedBy}
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Record Hash (SHA-256 Digest)
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy Digest
                  </>
                )}
              </button>
            </div>
            <div className="rounded border bg-background p-2 font-mono text-[11px] break-all text-foreground/90">
              {hash}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close Verification Certificate
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
