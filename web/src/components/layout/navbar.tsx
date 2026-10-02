"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Compass,
  ShieldCheck,
  User,
  LogOut,
  ArrowLeftRight,
  Landmark,
  Globe,
  ChevronDown,
} from "lucide-react";
import { ALL_PORTAL_ROUTES, type UserRole } from "@/lib/navigation";
import {
  MOCK_STUDENT_PROFILE,
  MOCK_OFFICER_PROFILE,
} from "@/lib/mock-data";
import { authApi } from "@/lib/api/auth";
import { getStoredUser } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export interface NavbarProps {
  role: UserRole;
  onOpenMobileMenu: () => void;
}

export function Navbar({ role, onOpenMobileMenu }: NavbarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const defaultProfile =
    role === "student" ? MOCK_STUDENT_PROFILE : MOCK_OFFICER_PROFILE;

  const [displayName, setDisplayName] = React.useState(defaultProfile.name);
  const [displayEmail, setDisplayEmail] = React.useState(defaultProfile.email);
  const [displaySub, setDisplaySub] = React.useState(
    role === "student"
      ? MOCK_STUDENT_PROFILE.studentId
      : MOCK_OFFICER_PROFILE.position
  );

  React.useEffect(() => {
    const stored = getStoredUser();
    if (
      stored &&
      ((role === "student" && stored.role === "student") ||
        (role === "officer" &&
          (stored.role === "officer" || stored.role === "admin")))
    ) {
      setDisplayName(stored.name);
      setDisplayEmail(stored.email);
      setDisplaySub(
        role === "student"
          ? stored.student_id || MOCK_STUDENT_PROFILE.studentId
          : stored.position || MOCK_OFFICER_PROFILE.position
      );
    }

    let active = true;
    authApi
      .me(role)
      .then((user) => {
        if (!active) return;
        setDisplayName(user.name);
        setDisplayEmail(user.email);
        setDisplaySub(
          role === "student"
            ? user.student_id || MOCK_STUDENT_PROFILE.studentId
            : user.position || MOCK_OFFICER_PROFILE.position
        );
      })
      .catch(() => {
        // Keep stored/default profile if unauthenticated
      });

    return () => {
      active = false;
    };
  }, [role]);

  const handleSignOut = async () => {
    await authApi.logout();
    toast({
      title: "Signed Out",
      description: "Your SSC Portal session has been closed.",
    });
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 sm:px-6 lg:px-8">
      {/* Left: Mobile Menu Trigger, Mobile Brand Identity & Institutional Status */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 lg:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <Link
          href={
            role === "student" ? "/student/dashboard" : "/officer/dashboard"
          }
          className="flex items-center gap-2 lg:hidden"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Landmark className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            SSC Portal
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-2.5">
          <Badge
            variant="outline"
            className="rounded-full font-semibold text-xs py-1 px-3 bg-card/80 shadow-2xs"
          >
            1st Semester • AY 2026–2027
          </Badge>
          <div className="inline-flex items-center gap-2 rounded-full border border-verified/25 bg-verified-muted/70 px-3 py-1 text-xs font-semibold text-verified">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-verified" />
            </span>
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Blockchain Registry Synced</span>
          </div>
        </div>
      </div>

      {/* Right: Public View Link, Portal Directory, Theme Toggle, Notifications & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="hidden xl:inline-flex gap-1.5 text-xs rounded-full"
        >
          <Link href="/transparency">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>Public Open View</span>
          </Link>
        </Button>

        {/* Quick Portal Navigation Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs rounded-full px-3 sm:px-3.5"
            >
              <Compass className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Portal Directory</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-68 max-h-[75vh] overflow-y-auto"
          >
            <DropdownMenuLabel>SSC Portal Modules</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_PORTAL_ROUTES.map((route) => (
              <DropdownMenuItem
                key={route.path}
                onClick={() => router.push(route.path)}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span className="font-semibold text-xs text-foreground">
                  {route.label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {route.path}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Adaptive Light/Dark Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          onClick={() =>
            toast({
              title:
                role === "student"
                  ? "SSC Financial Statement Published"
                  : "Student Payment Queue Active",
              description:
                role === "student"
                  ? "1st Semester collection and disbursement records are verified on-chain."
                  : "Open Student Transactions to verify pending cashier submissions.",
              variant: "verified",
            })
          }
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </Button>

        {/* Modern Pill User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex items-center gap-2.5 rounded-full border border-border/80 bg-card/90 p-1 pr-2.5 sm:pr-3 text-left text-xs shadow-2xs transition-all hover:border-primary/40 hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold shadow-2xs">
                {displayName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="hidden md:block">
                <p className="font-bold text-foreground leading-none">
                  {displayName}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[140px]">
                  {displaySub}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-0.5">
                <span className="text-xs font-bold text-foreground">
                  {displayName}
                </span>
                <span className="text-[11px] font-normal text-muted-foreground truncate">
                  {displayEmail}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  role === "student"
                    ? "/student/dashboard"
                    : "/officer/dashboard"
                )
              }
            >
              <User className="h-4 w-4 text-primary" />
              <span>Portal Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  role === "student"
                    ? "/officer/dashboard"
                    : "/student/dashboard"
                )
              }
            >
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              <span>
                Switch to {role === "student" ? "Officer" : "Student"} Portal
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/transparency")}>
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <span>Public Transparency View</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
