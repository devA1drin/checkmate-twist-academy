"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useStats } from "@/lib/stats-context";
import { getSupabase } from "@/lib/supabase/client";
import { LEAGUES, leagueFor, XP_RULES } from "@/lib/gamify";
import { LevelBar } from "@/components/game/level-bar";
import { BadgeList } from "@/components/game/badge-list";

interface Row { display_name: string; user_id: string; xp: number }

export function League() {
  const { user, configured } = useAuth();
  const { stats, badges } = useStats();
  const earned = new Set(badges);
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    const sb = getSupabase(); if (!sb) { setRows([]); return; }
    sb.rpc("weekly_league", { lim: 50 }).then(({ data }) => setRows((data ?? []) as Row[]));
  }, [user, stats?.week_xp]);
  const week = stats?.week_xp ?? 0;
  const lg = leagueFor(week);
  const nextLg = LEAGUES.find((l) => l.min > week);
  const myRank = rows && user ? rows.findIndex((r) => r.user_id === user.id) + 1 : 0;

  return (
    <div className="space-y-12">
      {user && stats ? (
        <section className="grid md:grid-cols-[1fr_1fr] gap-8 border-b border-ink pb-10">
          <div>
            <p className="label">Your league this week</p>
            <p className="text-4xl font-semibold mt-1">{lg.name}</p>
            <p className="text-muted mt-1">{week} XP this week{myRank ? ` · rank ${myRank}` : ""}. {nextLg ? `${nextLg.min - week} XP more for ${nextLg.name}.` : "Top league."}</p>
            <ol className="flex mt-5 border border-line rounded overflow-hidden text-sm" aria-label="Leagues">
              {LEAGUES.map((l) => <li key={l.name} aria-current={l.name === lg.name ? "true" : undefined} className={`flex-1 px-2 py-2 text-center border-r border-line last:border-0 ${l.name === lg.name ? "bg-fg text-bg font-semibold" : ""}`}>{l.name}<span className="block text-xs opacity-75">{l.min}+</span></li>)}
            </ol>
          </div>
          <div><LevelBar stats={stats} /><p className="text-sm text-muted mt-3">Current streak {stats.streak_current} days · best {stats.streak_best} · {stats.freezes} streak {stats.freezes === 1 ? "freeze" : "freezes"}</p></div>
        </section>
      ) : configured ? <p className="notice"><Link className="link" href="/auth?next=/league">Sign in</Link> to earn XP and join the league.</p> : null}

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10">
        <section aria-labelledby="table">
          <h2 id="table" className="text-xl font-semibold mb-3">This week&apos;s table</h2>
          {rows === null ? <p className="text-muted">Loading…</p> : rows.length === 0 ? <p className="text-muted border-t border-ink pt-3">Nobody has earned XP yet this week.</p> : (
            <table className="w-full text-[15px]">
              <thead><tr className="text-left text-sm text-muted border-b border-ink"><th className="py-2 w-10 font-normal">#</th><th className="py-2 font-normal">Member</th><th className="py-2 font-normal">League</th><th className="py-2 text-right font-normal">XP</th></tr></thead>
              <tbody>{rows.map((r, i) => (
                <tr key={r.user_id} className={`border-b border-line ${r.user_id === user?.id ? "bg-surface-2 font-semibold" : ""}`}>
                  <td className="py-2.5 tabular-nums text-muted">{i + 1}</td><td className="py-2.5"><Link className="hover:underline" href={`/u/${r.user_id}`}>{r.display_name}</Link>{r.user_id === user?.id && <span className="text-xs text-muted ml-1.5">(you)</span>}</td>
                  <td className="py-2.5">{leagueFor(Number(r.xp)).name}</td><td className="py-2.5 text-right tabular-nums">{r.xp}</td></tr>))}</tbody>
            </table>
          )}
          <p className="text-xs text-muted mt-3">You can hide yourself from public tables in <Link className="link" href="/settings">settings</Link>.</p>
        </section>
        <section aria-labelledby="rules">
          <h2 id="rules" className="text-xl font-semibold mb-3">How to earn XP</h2>
          <dl className="border-t border-ink text-[15px]">{XP_RULES.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5 border-b border-line"><dt>{k}</dt><dd className="text-muted text-right">{v}</dd></div>)}</dl>
          <p className="text-sm text-muted mt-3">XP is counted by the server, so it can&apos;t be edited from the browser. Level n needs 100 × n(n−1)/2 XP in total.</p>
        </section>
      </div>
      {user && <section><h2 className="text-xl font-semibold mb-4">Badges</h2><BadgeList earned={earned} /></section>}
    </div>
  );
}
