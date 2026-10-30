"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useProgress } from "@/lib/progress-context";
import { useAuth } from "@/lib/auth-context";
import { useStats } from "@/lib/stats-context";
import { usePrefs } from "@/lib/onboarding";
import { nextSteps } from "@/lib/next-steps";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { getSupabase } from "@/lib/supabase/client";
import { CHESS_LESSONS } from "@/data/chess-lessons";
import { CUBE_LESSONS } from "@/data/cube-lessons";
import { averageOf, effectiveTime, formatTime } from "@/lib/progress-types";
import { LevelBar } from "@/components/game/level-bar";
import { BadgeList } from "@/components/game/badge-list";

export function Dashboard() {
  const { data, mode, ready, guestHasData, importGuestToAccount, resetLocal, syncError } = useProgress();
  const { user, profile, configured, signOut } = useAuth();
  const { stats, badges } = useStats();
  const { prefs, ready: prefsReady } = usePrefs();
  const [msg, setMsg] = useState<string | null>(null);
  const [daily, setDaily] = useState<{ puzzle: boolean; scramble: boolean } | undefined>(undefined);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !user) return;
    const day = new Date().toISOString().slice(0, 10);
    sb.from("daily_entries").select("kind").eq("day", day).then(({ data: rows }) => {
      const k = new Set((rows ?? []).map((r: { kind: string }) => r.kind));
      setDaily({ puzzle: k.has("puzzle"), scramble: k.has("scramble") });
    });
  }, [user]);

  const steps = useMemo(() => nextSteps(data, prefs, { signedIn: !!user, dailyDone: user ? daily : { puzzle: false, scramble: false } }), [data, prefs, user, daily]);
  const chessDone = CHESS_LESSONS.filter((l) => data.completedLessons.includes(`chess:${l.slug}`)).length;
  const cubeDone = CUBE_LESSONS.filter((l) => data.completedLessons.includes(`cube:${l.slug}`)).length;
  const best = useMemo(() => { const v = data.solves.filter((s) => s.penalty !== "DNF").map(effectiveTime); return v.length ? Math.min(...v) : null; }, [data.solves]);
  const solvedPuzzles = data.puzzles.filter((p) => p.solved).length;
  const wins = data.games.filter((g) => g.result === "win").length;
  const recent = data.solves.slice(-30);
  const maxT = Math.max(1, ...recent.filter((s) => s.penalty !== "DNF").map(effectiveTime));
  const earned = useMemo(() => new Set(user ? badges : ACHIEVEMENTS.filter((a) => a.test?.(data)).map((a) => a.id)), [user, badges, data]);

  if (!ready) return <p className="text-muted">Loading your progress…</p>;
  const name = profile?.display_name || profile?.username;
  const stat: [string, string, string?][] = [
    [`${chessDone}/${CHESS_LESSONS.length}`, "Chess lessons"],
    [`${cubeDone}/${CUBE_LESSONS.length}`, "Cube lessons"],
    [formatTime(best), "Best solve", `ao5 ${formatTime(averageOf(data.solves, 5))} · ao12 ${formatTime(averageOf(data.solves, 12))}`],
    [`${solvedPuzzles}`, "Puzzles solved", `${data.puzzles.length} tries`],
    [`${wins}`, "Wins vs computer", `${data.games.length} games`],
  ];

  return (
    <div className="space-y-12">
      <header className="pb-6 border-b border-line">
        <p className="eyebrow">{mode === "account" ? "Your page" : "Guest"}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2">{name ? `Hi, ${name}.` : "Your progress"}</h1>
        <p className="text-muted mt-2">
          {mode === "account" ? "Progress is saved to your account and syncs across devices." : <>Progress is saved in this browser only.{configured && <> <Link href="/auth" className="link">Create a free account</Link> to keep it and play online.</>}</>}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm items-center">
          {syncError && <span className="notice notice-bad w-full">Some progress didn&apos;t sync: {syncError}. It is kept on this device and will retry.</span>}
          {mode === "account" && guestHasData && <button className="btn btn-ghost" onClick={async () => setMsg(await importGuestToAccount())}>Import progress from this browser</button>}
          {msg && <span className="text-ok">{msg}</span>}
        </div>
      </header>

      {prefsReady && !prefs && (
        <div className="notice flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>Tell us what you want to learn and we&apos;ll suggest where to start. It takes 20 seconds.</span>
          <Link href="/welcome" className="btn btn-primary">Get started</Link>
        </div>
      )}

      <section aria-labelledby="next">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <h2 id="next" className="text-xl font-semibold">What to do next</h2>
          {prefs && <Link href="/welcome" className="text-sm text-muted underline underline-offset-4">Change goals</Link>}
        </div>
        <ol className="border-t border-ink">
          {steps.map((s, i) => (
            <li key={s.href + s.title} className="border-b border-line">
              <Link href={s.href} className="group grid grid-cols-[2rem_1fr_auto] gap-x-3 py-4 items-center min-h-[72px]">
                <span className="font-mono text-sm text-muted">{i + 1}</span>
                <span>
                  <span className="flex items-center gap-2 font-medium text-[17px] group-hover:underline underline-offset-4">
                    {s.kind !== "any" && <span aria-hidden className={`h-2 w-2 shrink-0 ${s.kind === "chess" ? "bg-chess" : "bg-cube"}`} />}{s.title}
                  </span>
                  <span className="block text-sm text-muted mt-0.5">{s.why}</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-sm text-electric">{s.cta} <ArrowRight size={15} aria-hidden /></span>
                <ArrowRight size={18} className="sm:hidden text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section id="progress" aria-labelledby="xp">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <h2 id="xp" className="text-xl font-semibold">XP and streak</h2>
          {user && <Link href="/league" className="text-sm link">Weekly league</Link>}
        </div>
        {user && stats ? <LevelBar stats={stats} /> : (
          <p className="text-sm text-muted border-t border-ink pt-3">{user ? "Loading…" : "XP, levels, streaks and the weekly league are recorded on the server, so they need a free account."}</p>
        )}
      </section>

      <section aria-labelledby="stats">
        <h2 id="stats" className="text-xl font-semibold mb-3">Your numbers</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-ink">
          {stat.map(([v, l, sub]) => (
            <div key={l} className="py-4 pr-4 border-b border-line lg:border-b-0">
              <dt className="text-xs text-muted">{l}</dt>
              <dd className="text-2xl font-semibold mt-1 tabular-nums">{v}</dd>
              {sub && <dd className="text-xs text-muted mt-1 font-mono">{sub}</dd>}
            </div>
          ))}
        </dl>
        <div className="mt-8">
          <h3 className="text-sm font-medium mb-2">Last {recent.length || ""} solves</h3>
          {recent.length === 0 ? <p className="text-sm text-muted">No solves yet. <Link className="link" href="/cube/timer">Open the timer</Link>.</p> : (
            <div>
              <div className="flex items-end gap-[3px] h-28" role="img" aria-label={`Bar chart of your last ${recent.length} solve times`}>
                {recent.map((s) => { const t = effectiveTime(s); const dnf = !isFinite(t); return <div key={s.id} title={dnf ? "DNF" : formatTime(t)} className={`flex-1 ${dnf ? "bg-bad/50" : "bg-cube"}`} style={{ height: dnf ? "100%" : `${(t / maxT) * 100}%` }} />; })}
              </div>
              <div className="flex justify-between text-xs text-muted font-mono mt-1"><span>older</span><span>slowest {formatTime(maxT)}</span><span>latest</span></div>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="badges">
        <div className="flex items-baseline justify-between mb-3"><h2 id="badges" className="text-xl font-semibold">Badges</h2><span className="text-sm text-muted font-mono">{earned.size} of {ACHIEVEMENTS.length}</span></div>
        <BadgeList earned={earned} />
        {!user && <p className="text-xs text-muted mt-2">Badges for online play, friends, the forum, drills, battles and streaks need an account.</p>}
      </section>

      <section className="flex flex-wrap gap-3 pt-6 border-t border-line">
        {user && <Link href="/settings" className="btn btn-ghost">Profile and privacy</Link>}
        {user && <button className="btn btn-ghost" onClick={() => signOut()}>Sign out</button>}
        {mode === "guest" && <button className="btn btn-ghost hover:!border-bad" onClick={() => { if (confirm("Delete all progress stored in this browser?")) resetLocal(); }}>Reset progress in this browser</button>}
      </section>
    </div>
  );
}
