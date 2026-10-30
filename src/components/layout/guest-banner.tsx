"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function GuestBanner() {
  const { configured } = useAuth();
  const [hidden, setHidden] = useState(true);
  useEffect(() => setHidden(sessionStorage.getItem("cta-banner-hidden") === "1"), []);
  if (configured || hidden) return null;
  return (
    <div className="border-b border-line bg-surface-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-1.5 text-xs flex items-center gap-3">
        <span className="font-mono uppercase tracking-wider text-muted">Guest mode</span>
        <span className="text-muted">Progress is kept in this browser only. Accounts, leaderboards and the community board are off until a backend is connected. <Link href="/privacy" className="underline text-fg">Details</Link></span>
        <button className="ml-auto p-1 text-muted hover:text-fg" aria-label="Dismiss notice" onClick={() => { sessionStorage.setItem("cta-banner-hidden", "1"); setHidden(true); }}><X size={13} /></button>
      </div>
    </div>
  );
}
