"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV } from "./nav-data";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const path = usePathname();
  const { user, profile, configured } = useAuth();
  useEffect(() => { setOpen(null); setMobile(false); }, [path]);
  const active = (g: (typeof NAV)[number]) => g.items.some((i) => i.href !== "/" && (path === i.href || path.startsWith(i.href + "/")));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center gap-3" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <Logo />
          <span className="font-display text-[17px] font-semibold whitespace-nowrap">Checkmate <em className="font-normal">&amp;</em> Twist</span>
        </Link>
        <div className="hidden lg:flex items-center ml-8" onMouseLeave={() => setOpen(null)}>
          {NAV.map((g) => (
            <div key={g.label} className="relative" onMouseEnter={() => setOpen(g.label)}>
              <button onClick={() => setOpen(open === g.label ? null : g.label)} aria-expanded={open === g.label}
                className={`px-3 h-14 text-sm flex items-center gap-1 border-b-2 ${active(g) ? "border-electric text-fg font-medium" : "border-transparent text-muted hover:text-fg"}`}>
                {g.label} <ChevronDown size={13} aria-hidden />
              </button>
              {open === g.label && (
                <div className="absolute left-0 top-full w-72 card !rounded-t-none border-t-0 py-1">
                  {g.items.map((i) => (
                    <Link key={i.href} href={i.href} className={`block px-4 py-2 hover:bg-surface-2 ${path === i.href ? "bg-surface-2" : ""}`}>
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
          <ThemeToggle />
          {profile?.role === "admin" && <Link href="/admin" className="hidden sm:inline text-sm text-muted hover:text-fg px-2">Admin</Link>}
          {user ? (
            <Link href="/dashboard" className="btn btn-ghost !py-1.5 hidden sm:inline-flex">{profile?.display_name || profile?.username || "Dashboard"}</Link>
          ) : configured ? (
            <Link href="/auth" className="btn btn-primary !py-1.5 hidden sm:inline-flex">Sign in</Link>
          ) : (
            <Link href="/dashboard" className="hidden sm:inline-flex btn btn-ghost !py-1.5">My progress</Link>
          )}
          <button className="lg:hidden h-8 w-8 grid place-items-center rounded-md border border-line" onClick={() => setMobile(!mobile)} aria-label={mobile ? "Close menu" : "Open menu"} aria-expanded={mobile}>
            {mobile ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>
      {mobile && (
        <div className="lg:hidden border-t border-line bg-bg">
          <div className="px-4 py-4 grid grid-cols-2 gap-x-6 gap-y-5 max-h-[75vh] overflow-y-auto">
            {NAV.map((g) => (
              <div key={g.label}>
                <div className="eyebrow mb-1.5">{g.label}</div>
                {g.items.map((i) => <Link key={i.href} href={i.href} className="block py-1.5 text-sm">{i.label}</Link>)}
              </div>
            ))}
            <Link href={user ? "/dashboard" : configured ? "/auth" : "/dashboard"} className="btn btn-primary col-span-2">{user ? "Dashboard" : configured ? "Sign in" : "My progress"}</Link>
          </div>
        </div>
      )}
    </header>
  );
}
