"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { NAV, sectionOf } from "./nav-data";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { useAuth } from "@/lib/auth-context";
import { XpPill } from "@/components/game/xp-pill";

export function Navbar() {
  const [open, setOpen] = useState<string | null>(null);
  const path = usePathname();
  const { user, profile, configured } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(null); }, [path]);
  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, []);
  const current = sectionOf(path);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 btn btn-primary">Skip to content</a>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center gap-3" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <Logo />
          <span className="text-[16px] font-semibold tracking-tight whitespace-nowrap">Checkmate &amp; Twist</span>
        </Link>
        <div ref={ref} className="hidden lg:flex items-center ml-6">
          {NAV.map((g) => (
            <div key={g.label} className="relative">
              <div className={`flex items-center h-14 border-b-2 ${current === g.href ? "border-electric" : "border-transparent"}`}>
                <Link href={g.href} className={`pl-3 pr-1 text-[15px] ${current === g.href ? "text-fg font-medium" : "text-muted hover:text-fg"}`}>{g.label}</Link>
                <button onClick={() => setOpen(open === g.label ? null : g.label)} aria-expanded={open === g.label} aria-label={`${g.label} menu`}
                  className="h-9 w-7 grid place-items-center text-muted hover:text-fg"><ChevronDown size={14} aria-hidden /></button>
              </div>
              {open === g.label && (
                <div className="absolute left-0 top-full w-80 card !rounded-t-none border-t-0 py-1 shadow-sm">
                  {g.items.map((i) => (
                    <Link key={i.href} href={i.href} className={`block px-4 py-2.5 hover:bg-surface-2 ${path === i.href ? "bg-surface-2" : ""}`}>
                      <div className="text-sm font-medium">{i.label}</div>
                      {i.desc && <div className="text-xs text-muted">{i.desc}</div>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user && <XpPill />}
          <ThemeToggle />
          {profile?.role === "admin" || profile?.role === "moderator" ? <Link href="/admin" className="hidden sm:inline text-sm text-muted hover:text-fg px-2">Admin</Link> : null}
          {user ? (
            <Link href="/dashboard" className="btn btn-ghost !min-h-9 !py-1.5 max-w-[10rem] truncate">{profile?.display_name || profile?.username || "My page"}</Link>
          ) : configured ? (
            <Link href="/auth" className="btn btn-primary !min-h-9 !py-1.5">Sign in</Link>
          ) : (
            <Link href="/dashboard" className="btn btn-ghost !min-h-9 !py-1.5">My progress</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
