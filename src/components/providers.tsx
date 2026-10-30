"use client";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import { ProgressProvider } from "@/lib/progress-context";
import { StatsProvider } from "@/lib/stats-context";
import { Heartbeat } from "@/components/social/heartbeat";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <StatsProvider><Heartbeat /><ProgressProvider>{children}</ProgressProvider></StatsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
