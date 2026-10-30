"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X, LogIn, User, Shield } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
      <nav className="mx-auto max-w-7xl px-3 sm:px-4 h-16 flex items-center gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <Logo />
          <span className="font-[family-name:var(--font-display)] font-bold leading-tight text-[14px] sm:text-[15px] whitespace-nowrap">
            Checkmate <span className="text-gradient">&amp; Twist</span><span className="hidden sm:block text-[11px] font-medium text-muted tracking-widest uppercase">Academy</span>
          </span>
        </Link>
        <div className="hidden lg:flex items-center gap-1 ml-6" onMouseLeave={() => setOpen(null)}>
          {NAV.map((g) => (
            <div key={g.label} className="relative" onMouseEnter={() => setOpen(g.label)}>
              <button onClick={() => setOpen(open === g.label ? null : g.label)} aria-expanded={open === g.label}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-surface-2 ${g.items.some((i) => path.startsWith(i.href) && i.href !== "/") ? "text-electric" : ""}`}>
                {g.label} <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {open === g.label && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full pt-2 w-72">
                    <div className="card glow p-2">
                      {g.items.map((i) => (
                        <Link key={i.href} href={i.href} className="block rounded-lg px-3 py-2 hover:bg-surface-2">
                          <div className="text-sm font-semibold">{i.label}</div>
                          {i.desc && <div className="text-xs text-muted">{i.desc}</div>}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {profile?.role === "admin" && (
            <Link href="/admin" className="hidden sm:grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface-2" aria-label="Admin"><Shield size={17} /></Link>
          )}
          {user ? (
            <Link href="/dashboard" className="btn btn-ghost hidden sm:inline-flex"><User size={16} /> {profile?.display_name || profile?.username || "Dashboard"}</Link>
          ) : (
            <Link href="/auth" className="btn btn-primary hidden sm:inline-flex"><LogIn size={16} /> {configured ? "Sign in" : "Guest mode"}</Link>
          )}
          <button className="lg:hidden h-9 w-9 grid place-items-center rounded-xl border border-line bg-surface-2" onClick={() => setMobile(!mobile)} aria-label="Menu">
            {mobile ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {mobile && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden overflow-hidden border-t border-line bg-bg">
            <div className="px-4 py-4 grid sm:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
              {NAV.map((g) => (
                <div key={g.label}>
                  <div className="text-xs uppercase tracking-widest text-muted mb-1">{g.label}</div>
                  {g.items.map((i) => (
                    <Link key={i.href} href={i.href} className="block py-1.5 text-sm font-medium hover:text-electric">{i.label}</Link>
                  ))}
                </div>
              ))}
              <Link href={user ? "/dashboard" : "/auth"} className="btn btn-primary sm:col-span-2">{user ? "Dashboard" : configured ? "Sign in" : "About guest mode"}</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
