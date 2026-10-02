"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const root = document.documentElement;
    const saved =
      typeof window !== "undefined" ? localStorage.getItem("ssc-theme") : null;
    const systemPrefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const shouldBeDark =
      saved === "dark" ||
      (!saved && (root.classList.contains("dark") || systemPrefersDark));

    if (shouldBeDark) {
      root.classList.add("dark");
      setIsDark(true);
    } else {
      root.classList.remove("dark");
      setIsDark(false);
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("ssc-theme")) {
        if (e.matches) {
          root.classList.add("dark");
          setIsDark(true);
        } else {
          root.classList.remove("dark");
          setIsDark(false);
        }
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !isDark;
    if (nextDark) {
      root.classList.add("dark");
      localStorage.setItem("ssc-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("ssc-theme", "light");
    }
    setIsDark(nextDark);
    toast({
      title: nextDark
        ? "Magenta Dark Mode Enabled"
        : "Magenta & White Light Mode Enabled",
      description: nextDark
        ? "Switched to adaptive magenta & mulberry dark theme."
        : "Switched to crisp magenta & white institutional light theme.",
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-primary" />
      ) : (
        <Moon className="h-4 w-4 text-primary" />
      )}
    </Button>
  );
}
