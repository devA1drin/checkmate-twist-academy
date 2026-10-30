"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV, sectionOf } from "./nav-data";

/** Fixed bottom bar on phones and tablets: five large targets, labels always visible. */
export function BottomNav() {
  const path = usePathname();
  const current = sectionOf(path);
  return (
    <nav aria-label="Sections" className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-line bg-bg" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="grid grid-cols-5">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const on = current === href;
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-medium border-t-2 ${on ? "border-electric text-fg" : "border-transparent text-muted"}`}>
                <Icon size={21} aria-hidden strokeWidth={on ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
