import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: "default" | "verified" | "warning" | "primary";
  footer?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
  footer,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30",
        className
      )}
    >
      {/* Subtle Top Accent Line */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1 transition-opacity",
          tone === "primary" && "bg-gradient-to-r from-primary via-primary/70 to-transparent",
          tone === "verified" && "bg-gradient-to-r from-verified via-verified/70 to-transparent",
          tone === "warning" && "bg-gradient-to-r from-warning via-warning/70 to-transparent",
          tone === "default" && "bg-gradient-to-r from-border via-primary/25 to-transparent"
        )}
      />
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl truncate">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-2xs transition-transform duration-200 group-hover:scale-105",
              tone === "default" && "bg-muted/70 text-foreground border-border",
              tone === "primary" &&
                "bg-primary/10 text-primary border-primary/20",
              tone === "verified" &&
                "bg-verified-muted text-verified border-verified/25",
              tone === "warning" &&
                "bg-warning-muted text-warning border-warning/25"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {footer && (
          <div className="mt-4 pt-3 border-t border-border/70 text-xs text-muted-foreground flex items-center justify-between gap-2">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
