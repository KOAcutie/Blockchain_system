"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import {
  STUDENT_NAV_ITEMS,
  OFFICER_NAV_ITEMS,
  type UserRole,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  role: UserRole;
  children: React.ReactNode;
}

export function AppShell({ role, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const navItems = role === "student" ? STUDENT_NAV_ITEMS : OFFICER_NAV_ITEMS;
  const mobileQuickItems = navItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        role={role}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="lg:pl-72 flex min-h-screen min-w-0 flex-col">
        <Navbar
          role={role}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 min-w-0 overflow-x-hidden px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>

        <footer className="hidden sm:block border-t border-border/70 bg-card/50 px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
            <p>
              <strong className="font-semibold text-foreground">
                SSC Transparency
              </strong>{" "}
              • Official Supreme Student Council Fee Collection &amp; Financial
              Audit Portal
            </p>
            <p className="font-mono text-[11px]">
              Official Council Audit Registry • Academic Year 2026–2027
            </p>
          </div>
        </footer>

        {/* Progressive Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Mobile bottom navigation"
          className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-border/80 bg-card/92 px-2 backdrop-blur-xl lg:hidden"
        >
          {mobileQuickItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const shortLabel = item.title
              .replace("SSC ", "")
              .replace("Record / ", "")
              .replace("Transaction ", "Tx ")
              .replace("Approved ", "")
              .replace("Public ", "")
              .replace("Student ", "")
              .split(" ")[0];

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-semibold transition-all",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute -top-1.5 h-1 w-6 rounded-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isActive && "scale-110 text-primary"
                  )}
                />
                <span className="truncate max-w-[64px]">{shortLabel}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
