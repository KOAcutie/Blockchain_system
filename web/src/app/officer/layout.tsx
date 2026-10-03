"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { getStoredUser } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isStudent, setIsStudent] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    const user = getStoredUser();
    if (user && user.role === "student") {
      setIsStudent(true);
    }
    setChecked(true);
  }, []);

  if (checked && isStudent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-border/80 shadow-lg">
          <CardHeader className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold">
              Officer Portal Access Restricted
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              You are currently signed in with a Student account. Council administrative modules are reserved for Supreme Student Council officers and finance auditors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <Button asChild className="w-full" size="sm">
              <Link href="/student/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Student Portal
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs"
              size="sm"
              onClick={() => router.push("/login")}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In as Council Officer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AppShell role="officer">{children}</AppShell>;
}
