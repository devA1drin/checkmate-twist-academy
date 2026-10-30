import { levelFromXp, leagueFor } from "@/lib/gamify";
import type { MyStats } from "@/lib/stats-context";
import { Flame, Snowflake } from "lucide-react";

export function LevelBar({ stats }: { stats: MyStats }) {
  const l = levelFromXp(stats.xp); const league = leagueFor(stats.week_xp);
  const pct = Math.round((l.into / l.need) * 100);
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 border-t border-ink">
      <div className="py-4 pr-4 col-span-2 sm:col-span-1">
        <dt className="text-xs text-muted">Level</dt>
        <dd className="text-3xl font-semibold tabular-nums mt-1">{l.level}</dd>
        <dd className="mt-2"><div className="h-1.5 bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level"><div className="h-full bg-electric" style={{ width: `${pct}%` }} /></div>
          <span className="text-xs text-muted font-mono">{stats.xp} XP · {l.next - stats.xp} to level {l.level + 1}</span></dd>
      </div>
      <div className="py-4 pr-4">
        <dt className="text-xs text-muted">Streak</dt>
        <dd className="text-3xl font-semibold tabular-nums mt-1 flex items-center gap-1.5"><Flame size={22} aria-hidden className={stats.streak_current ? "text-warn" : "text-muted"} />{stats.streak_current} <span className="text-sm font-normal text-muted">days</span></dd>
        <dd className="text-xs text-muted mt-1 flex items-center gap-1"><Snowflake size={12} aria-hidden />{stats.freezes} streak freeze{stats.freezes === 1 ? "" : "s"} · best {stats.streak_best}</dd>
      </div>
      <div className="py-4 pr-4">
        <dt className="text-xs text-muted">This week</dt>
        <dd className="text-3xl font-semibold tabular-nums mt-1">{stats.week_xp} <span className="text-sm font-normal text-muted">XP</span></dd>
        <dd className="text-xs text-muted mt-1">{league.name} league</dd>
      </div>
      <div className="py-4 pr-4">
        <dt className="text-xs text-muted">Last 24 hours</dt>
        <dd className="text-3xl font-semibold tabular-nums mt-1">{stats.today_xp} <span className="text-sm font-normal text-muted">XP</span></dd>
      </div>
    </dl>
  );
}
