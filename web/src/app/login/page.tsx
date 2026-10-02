"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Landmark,
  GraduationCap,
  ShieldCheck,
  Lock,
  ArrowRight,
  FileCheck2,
  Building2,
} from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [roleTab, setRoleTab] = React.useState("student");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [studentId, setStudentId] = React.useState("STU-2026-001");
  const [studentEmail, setStudentEmail] = React.useState(
    "student@example.test"
  );
  const [studentPassword, setStudentPassword] = React.useState("password");
  const [officerEmail, setOfficerEmail] = React.useState(
    "officer@example.test"
  );
  const [officerPassword, setOfficerPassword] = React.useState("password");
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleSignIn = async (
    e: React.FormEvent,
    targetRole: "student" | "officer"
  ) => {
    e.preventDefault();
    setFormError(null);

    const email =
      targetRole === "student" ? studentEmail.trim() : officerEmail.trim();
    const password =
      targetRole === "student" ? studentPassword : officerPassword;

    if (targetRole === "student" && (!studentId.trim() || !email)) {
      setFormError(
        "Please provide both your Student Number and Institutional Email."
      );
      return;
    }
    if (targetRole === "officer" && !email) {
      setFormError("Please provide your official SSC Council Email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await authApi.login({
        email,
        password,
        student_id: targetRole === "student" ? studentId.trim() : undefined,
      });

      toast({
        title: `Welcome, ${session.user.name}`,
        description: `Authenticated as ${session.user.role_label}. Redirecting to your portal...`,
        variant: "verified",
      });

      router.push(
        session.user.role === "student"
          ? "/student/dashboard"
          : "/officer/dashboard"
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please check your credentials.";
      setFormError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-background">
      {/* Left Column: University & SSC Institutional Identity */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/20">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight">
                SSC Transparency
              </p>
              <p className="text-xs text-primary-foreground/75">
                Supreme Student Council Portal
              </p>
            </div>
          </Link>
          <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20">
            AY 2026–2027
          </Badge>
        </div>

        <div className="space-y-6 my-auto py-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3.5 py-1.5 text-xs font-medium border border-primary-foreground/15">
            <FileCheck2 className="h-4 w-4" />
            <span>Tamper-Evident Student Government Finance</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight">
            Accountable Student Governance Through Open Financial Records.
          </h1>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            Every student council fee assessment, official receipt, and approved
            budget disbursement is cryptographically attested so students and
            auditors can independently verify every peso collected and spent.
          </p>

          <div className="grid gap-3 pt-4">
            <div className="rounded-xl bg-primary-foreground/10 p-4 border border-primary-foreground/15">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/90">
                For Students
              </p>
              <p className="text-xs text-primary-foreground/75 mt-1 leading-relaxed">
                Check semester SSC dues, submit payment records, download
                digital receipts, and inspect verified council budgets.
              </p>
            </div>
            <div className="rounded-xl bg-primary-foreground/10 p-4 border border-primary-foreground/15">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/90">
                For SSC Officers &amp; Auditors
              </p>
              <p className="text-xs text-primary-foreground/75 mt-1 leading-relaxed">
                Manage fee schedules, verify student payments, record approved
                fund usage, and publish COA-compliant financial reports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-primary-foreground/70 border-t border-primary-foreground/15 pt-6">
          <span>Office of the Supreme Student Council</span>
          <span>Student Commission on Audit (SCOA)</span>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between pb-1">
            <Link href="/" className="flex items-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">SSC Transparency</p>
                <p className="text-[11px] text-muted-foreground">
                  Supreme Student Council
                </p>
              </div>
            </Link>
            <div className="hidden lg:block">
              <Badge variant="outline">Laravel Sanctum Auth</Badge>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Badge variant="outline" className="lg:hidden">
                Sanctum Auth
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Sign in to SSC Portal
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your university student or SSC officer credentials.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive"
            >
              {formError}
            </div>
          )}

          <Tabs
            value={roleTab}
            onValueChange={(val) => {
              setRoleTab(val);
              setFormError(null);
            }}
            defaultValue="student"
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                <span>Student Login</span>
              </TabsTrigger>
              <TabsTrigger value="officer" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>SSC Officer Login</span>
              </TabsTrigger>
            </TabsList>

            {/* Student Login Form */}
            <TabsContent value="student">
              <Card>
                <form onSubmit={(e) => handleSignIn(e, "student")}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      University Student Credentials
                    </CardTitle>
                    <CardDescription>
                      Sign in using your Student ID number and university email.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-id">Student Number</Label>
                      <Input
                        id="student-id"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. STU-2026-001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-email">
                        Institutional Email Address
                      </Label>
                      <Input
                        id="student-email"
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="student-password">Password</Label>
                        <button
                          type="button"
                          onClick={() =>
                            toast({
                              title: "Registrar SSO Password Reset",
                              description:
                                "A password reset link would be sent to your university email address.",
                            })
                          }
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Reset via Registrar SSO
                        </button>
                      </div>
                      <Input
                        id="student-password"
                        type="password"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Student Dashboard</span>
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <div className="flex w-full items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Public Visitor (No Account)?</span>
                      <Link
                        href="/transparency"
                        className="font-medium text-primary hover:underline"
                      >
                        Open Public Transparency View →
                      </Link>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* Officer Login Form */}
            <TabsContent value="officer">
              <Card>
                <form onSubmit={(e) => handleSignIn(e, "officer")}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      SSC Officer &amp; Finance Committee Access
                    </CardTitle>
                    <CardDescription>
                      Authorized access for elected council officers and SCOA
                      auditors.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="officer-email">
                        Official Council Email
                      </Label>
                      <Input
                        id="officer-email"
                        type="email"
                        value={officerEmail}
                        onChange={(e) => setOfficerEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="officer-role">Council Designation</Label>
                      <Input
                        id="officer-role"
                        defaultValue="Vice President for Finance & Audit"
                        readOnly
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="officer-password">Passphrase</Label>
                        <button
                          type="button"
                          onClick={() =>
                            toast({
                              title: "Officer Security Key Reset",
                              description:
                                "Contact the SCOA Chairperson to rotate your officer passphrase.",
                            })
                          }
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Request Key Rotation
                        </button>
                      </div>
                      <Input
                        id="officer-password"
                        type="password"
                        value={officerPassword}
                        onChange={(e) => setOfficerPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" />
                          <span>Authenticating Officer...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="mr-1.5 h-4 w-4" />
                          <span>Continue to Officer Dashboard</span>
                        </>
                      )}
                    </Button>
                    <div className="flex w-full items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Public Visitor (No Account)?</span>
                      <Link
                        href="/transparency"
                        className="font-medium text-primary hover:underline"
                      >
                        Open Public Transparency View →
                      </Link>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Institutional Test Accounts Quick-Select */}
          <div className="rounded-xl border bg-muted/40 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Authorized Institutional Accounts (Password: password)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setRoleTab("student");
                  setStudentId("STU-2026-001");
                  setStudentEmail("student@example.test");
                  setStudentPassword("password");
                }}
              >
                Student Account
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setRoleTab("officer");
                  setOfficerEmail("officer@example.test");
                  setOfficerPassword("password");
                }}
              >
                SSC Officer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setRoleTab("officer");
                  setOfficerEmail("admin@example.test");
                  setOfficerPassword("password");
                }}
              >
                System Admin
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
