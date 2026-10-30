"use client";
import Link from "next/link";
import { Flame } from "lucide-react";
import { useStats } from "@/lib/stats-context";
import { levelFromXp } from "@/lib/gamify";

export function XpPill() {
  const { stats } = useStats();
  if (!stats) return null;
  const { level } = levelFromXp(stats.xp);
  return (
    <Link href="/dashboard#progress" className="hidden sm:flex items-center gap-3 text-sm px-2 h-9 border border-line rounded" title={`${stats.xp} XP · level ${level} · ${stats.streak_current}-day streak`}>
      <span className="font-mono tabular-nums">Lv {level}</span>
      <span className="flex items-center gap-1 tabular-nums"><Flame size={14} aria-hidden className={stats.streak_current ? "text-warn" : "text-muted"} />{stats.streak_current}<span className="sr-only">day streak</span></span>
    </Link>
  );
}
