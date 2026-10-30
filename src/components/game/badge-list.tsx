"use client";
import { ACHIEVEMENTS } from "@/lib/achievements";

/** Badge list. `earned` is the set of unlocked ids (server list when signed in, local tests for guests). */
export function BadgeList({ earned, compact }: { earned: Set<string>; compact?: boolean }) {
  const list = compact ? ACHIEVEMENTS.filter((a) => earned.has(a.id)) : ACHIEVEMENTS;
  if (compact && list.length === 0) return <p className="text-sm text-muted">No badges yet.</p>;
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-ink">
      {list.map((a) => {
        const on = earned.has(a.id); const Icon = a.icon;
        return (
          <li key={a.id} className="border-b border-line py-3 pr-4 flex gap-3 items-center">
            <span className={`h-10 w-10 shrink-0 grid place-items-center rounded border ${on ? "border-electric text-electric" : "border-line text-muted opacity-60"}`}><Icon size={19} aria-hidden /></span>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${on ? "" : "text-muted"}`}>{a.title}<span className="sr-only">{on ? " (earned)" : " (not earned yet)"}</span></div>
              <div className="text-xs text-muted">{a.description}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
