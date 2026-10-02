import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell role="officer">{children}</AppShell>;
}
