"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 p-4 sm:p-0"
    >
      {toasts.map((item) => {
        const variant = item.variant ?? "default";
        return (
          <div
            key={item.id}
            role={
              variant === "destructive" || variant === "warning"
                ? "alert"
                : "status"
            }
            className={cn(
              "flex items-start gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-lg transition-all animate-in slide-in-from-bottom-4",
              variant === "verified" &&
                "border-verified/40 bg-verified-muted/95 text-foreground",
              variant === "warning" &&
                "border-warning/40 bg-warning-muted/95 text-foreground",
              variant === "destructive" &&
                "border-destructive/40 bg-destructive/10 text-destructive"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {variant === "verified" ? (
                <CheckCircle2 className="h-5 w-5 text-verified" />
              ) : variant === "warning" || variant === "destructive" ? (
                <AlertCircle
                  className={cn(
                    "h-5 w-5",
                    variant === "destructive" ? "text-destructive" : "text-warning"
                  )}
                />
              ) : (
                <Info className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-none">{item.title}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
