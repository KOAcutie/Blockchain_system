"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  GraduationCap,
  Landmark,
  ArrowLeftRight,
  LogOut,
  ChevronRight,
  Globe,
  X,
} from "lucide-react";
import {
  STUDENT_NAV_ITEMS,
  OFFICER_NAV_ITEMS,
  type UserRole,
} from "@/lib/navigation";
import { authApi } from "@/lib/api/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  role: UserRole;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  role,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = role === "student" ? STUDENT_NAV_ITEMS : OFFICER_NAV_ITEMS;
  const oppositeRoleHref =
    role === "student" ? "/officer/dashboard" : "/student/dashboard";
  const oppositeRoleLabel =
    role === "student" ? "Switch to Officer Portal" : "Switch to Student Portal";

  const handleSignOut = async () => {
    if (onMobileClose) onMobileClose();
    await authApi.logout();
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-card/95 backdrop-blur-xl border-r border-border/80 text-card-foreground">
      {/* Brand Header */}
      <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-border/70">
          <Link
            href={
              role === "student" ? "/student/dashboard" : "/officer/dashboard"
            }
            className="flex items-center gap-3 group"
            onClick={onMobileClose}
          >
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
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-foreground">
                SSC Transparency
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Supreme Student Council
              </span>
            </div>
          </Link>
          {onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/70 text-muted-foreground hover:bg-primary/10 hover:text-primary lg:hidden"
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Role Context Banner */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-secondary/60 to-transparent px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              {role === "student" ? (
                <GraduationCap className="h-4 w-4 text-primary" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-primary" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                {role === "student" ? "Student Portal" : "Officer Portal"}
              </span>
            </div>
            <Badge variant="info" className="text-[10px] px-2 py-0">
              AY 26–27
            </Badge>
          </div>
        </div>

        {/* Navigation Links */}
        <nav
          aria-label={`${role} navigation`}
          className="space-y-1.5 px-3.5 py-3"
        >
          <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {role === "student"
              ? "Student Services"
              : "Council Administration"}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.subItems?.some((sub) => pathname === sub.href) ?? false);

            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.45)]"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-primary"
                      )}
                    />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-warning-muted text-warning"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Sub-links */}
                {item.subItems && (
                  <div className="ml-5 border-l-2 border-primary/15 pl-3 space-y-0.5 py-0.5">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onMobileClose}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                            isSubActive
                              ? "font-bold text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          )}
                        >
                          <span>{sub.title}</span>
                          <ChevronRight className="h-3 w-3 opacity-60" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer: Public View Link, Role Switcher & Institutional Trust Notice */}
      <div className="border-t border-border/70 p-4 space-y-3 bg-muted/20">
        <div className="rounded-2xl border border-verified/20 bg-verified-muted/30 p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-verified shrink-0" />
            <span>Audit Registry Active</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All transactions and receipts are verified against the official council audit ledger.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="w-full justify-between text-xs"
          >
            <Link href="/transparency" onClick={onMobileClose}>
              <span className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-primary" />
                Public Open View
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-between text-xs"
          >
            <Link href={oppositeRoleHref} onClick={onMobileClose}>
              <span className="flex items-center gap-2">
                <ArrowLeftRight className="h-3.5 w-3.5" />
                {oppositeRoleLabel}
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out of Portal
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-72 lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-md animate-in fade-in-0"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
