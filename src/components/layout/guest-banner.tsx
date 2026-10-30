"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function GuestBanner() {
  const { configured } = useAuth();
  const [hidden, setHidden] = useState(true);
  useEffect(() => setHidden(sessionStorage.getItem("cta-banner-hidden") === "1"), []);
  if (configured || hidden) return null;
  return (
    <div className="border-b border-line bg-gradient-to-r from-electric/15 via-violet/15 to-aqua/15">
      <div className="mx-auto max-w-7xl px-4 py-2 text-xs sm:text-sm flex items-center gap-2">
        <Info size={16} className="text-aqua shrink-0" />
        <span><strong>Local guest mode:</strong> your progress is saved only in this browser. Sign-in, leaderboards and community need the Supabase backend to be configured. <Link href="/auth" className="underline">Learn more</Link></span>
        <button className="ml-auto p-1 opacity-70 hover:opacity-100" aria-label="Dismiss" onClick={() => { sessionStorage.setItem("cta-banner-hidden", "1"); setHidden(true); }}><X size={14} /></button>
      </div>
    </div>
  );
}
