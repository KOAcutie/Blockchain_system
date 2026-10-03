"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  GraduationCap,
  School,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

const UNIVERSITY_COLLEGES = [
  "College of Computer and Information Sciences",
  "College of Engineering",
  "College of Business and Accountancy",
  "College of Education",
  "College of Arts and Letters",
  "College of Science",
  "College of Nursing and Health Sciences",
  "College of Architecture and Fine Arts",
  "College of Social Sciences and Development",
];

const YEAR_LEVELS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
];

export default function StudentRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [college, setCollege] = React.useState(UNIVERSITY_COLLEGES[0]);
  const [program, setProgram] = React.useState("");
  const [yearLevel, setYearLevel] = React.useState(YEAR_LEVELS[0]);
  const [password, setPassword] = React.useState("");
  const [passwordConfirmation, setPasswordConfirmation] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation checks
    if (!name.trim()) {
      setFormError("Please enter your full name as officially enrolled.");
      return;
    }

    if (!studentId.trim()) {
      setFormError("Please enter your student number (e.g. 21-29199).");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid institutional or personal email address.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== passwordConfirmation) {
      setFormError("Passwords do not match. Please re-type your password confirmation.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.register({
        name: name.trim(),
        student_id: studentId.trim(),
        email: email.trim(),
        college,
        program: program.trim() || "Undergraduate Degree",
        year_level: yearLevel,
        password,
        password_confirmation: passwordConfirmation,
      });

      toast({
        title: "Registration Successful!",
        description: `Welcome, ${response.user.name}. Your student account has been created and assigned all semester organization fees.`,
        variant: "verified",
      });

      router.push("/student/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Registration could not be completed. Please check your details and try again.";
      setFormError(msg);
      toast({
        title: "Registration Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-10 bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 10%, hsl(var(--primary) / 0.12) 0%, transparent 80%)",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl space-y-6">
        {/* Top Header / Brand */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md border border-primary/20">
              <Image
                src="/ssc-logo.png"
                alt="Supreme Student Council Seal"
                width={48}
                height={48}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Supreme Student Council
                </h1>
                <Badge variant="outline" className="text-[11px] font-medium text-primary">
                  Student Enrollment
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Financial Transparency, Fee Tracking &amp; Verifiable Digital Receipts Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Sign In
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/transparency">Public Portal</Link>
            </Button>
          </div>
        </div>

        {/* Main Grid: Form (Col 7) + Account Info / Benefits (Col 5) */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Registration Form */}
          <Card className="lg:col-span-7 shadow-sm">
            <form onSubmit={handleRegister}>
              <CardHeader className="space-y-1.5">
                <div className="flex items-center gap-2 text-primary">
                  <UserCheck className="h-5 w-5" />
                  <CardTitle className="text-lg">Create Student Account</CardTitle>
                </div>
                <CardDescription>
                  Enter your official student credentials to register for fee settlements and digital receipts.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input
                    id="reg-name"
                    placeholder="e.g. Maria Clara Santos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Must match your official university registrar records.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reg-student-id">Student Number</Label>
                    <Input
                      id="reg-student-id"
                      placeholder="e.g. 21-29199"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Format: YY-NNNNN (e.g. 21-29199)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email Address</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="student@university.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-college">College / Faculty</Label>
                  <Select
                    id="reg-college"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  >
                    {UNIVERSITY_COLLEGES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reg-program">Degree Program</Label>
                    <Input
                      id="reg-program"
                      placeholder="e.g. BS Computer Science"
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-year">Year Level</Label>
                    <Select
                      id="reg-year"
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                    >
                      {YEAR_LEVELS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm">Confirm Password</Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="Re-type your password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      <span>Creating Account &amp; Provisioning Fees...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Student Registration</span>
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex w-full items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                  <span>Already enrolled with an account?</span>
                  <Link
                    href="/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign In to Portal →
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Account Benefits & Automatic Fee Provisioning */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <GraduationCap className="h-5 w-5" />
                  <CardTitle className="text-base">Automatic Fee Assessment</CardTitle>
                </div>
                <CardDescription>
                  Upon account activation, your student profile is automatically assigned the 5 official student organization fees:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                {[
                  { name: "Supreme Student Council (SSC)", code: "SSC-FEE-26A", amt: "₱100.00" },
                  { name: "Kawasa Student Publication", code: "KAW-PUB-26A", amt: "₱75.00" },
                  { name: "Student Safety Insurance", code: "INS-SAF-26A", amt: "₱50.00" },
                  { name: "Red Cross Youth (RCY)", code: "RCY-HLT-26A", amt: "₱50.00" },
                  { name: "Department & College Council", code: "DEP-COL-26A", amt: "₱100.00" },
                ].map((item) => (
                  <div
                    key={item.code}
                    className="flex items-center justify-between rounded-lg border bg-background/80 p-2.5"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{item.code}</p>
                    </div>
                    <span className="font-bold text-foreground">{item.amt}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-verified">
                  <ShieldCheck className="h-5 w-5" />
                  <CardTitle className="text-base">Institutional Privacy &amp; Trust</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-verified shrink-0 mt-0.5" />
                  <span>
                    <strong>Verifiable Digital Receipts:</strong> Payments submitted via GCash, Maya, LandBank, or Cashier receive an official digital receipt.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-verified shrink-0 mt-0.5" />
                  <span>
                    <strong>Tamper-Proof Verification:</strong> Each receipt is anchored to an official cryptographic hash registry for student auditability.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-verified shrink-0 mt-0.5" />
                  <span>
                    <strong>Zero-PII On-Chain:</strong> Your name, personal contact, and student identification are strictly protected and never published publicly.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
