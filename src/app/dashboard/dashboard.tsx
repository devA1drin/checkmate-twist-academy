"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useProgress } from "@/lib/progress-context";
import { useAuth } from "@/lib/auth-context";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { CHESS_LESSONS } from "@/data/chess-lessons";
import { CUBE_LESSONS } from "@/data/cube-lessons";
import { averageOf, effectiveTime, formatTime } from "@/lib/progress-types";

export function Dashboard() {
  const { data, mode, ready, guestHasData, importGuestToAccount, resetLocal, syncError } = useProgress();
  const { user, profile, configured } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const chessDone = CHESS_LESSONS.filter((l) => data.completedLessons.includes(`chess:${l.slug}`)).length;
  const cubeDone = CUBE_LESSONS.filter((l) => data.completedLessons.includes(`cube:${l.slug}`)).length;
  const best = useMemo(() => { const v = data.solves.filter((s) => s.penalty !== "DNF").map(effectiveTime); return v.length ? Math.min(...v) : null; }, [data.solves]);
  const solvedPuzzles = data.puzzles.filter((p) => p.solved).length;
  const wins = data.games.filter((g) => g.result === "win").length;
  const recent = data.solves.slice(-30);
  const maxT = Math.max(1, ...recent.filter((s) => s.penalty !== "DNF").map(effectiveTime));
  const nextChess = CHESS_LESSONS.find((l) => !data.completedLessons.includes(`chess:${l.slug}`));
  const nextCube = CUBE_LESSONS.find((l) => !data.completedLessons.includes(`cube:${l.slug}`));
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.test(data)).length;

  if (!ready) return <p className="text-muted">Loading your progress…</p>;
  const stats: [string, string, string?][] = [
    [`${chessDone}/${CHESS_LESSONS.length}`, "Chess lessons"],
    [`${cubeDone}/${CUBE_LESSONS.length}`, "Cube lessons"],
    [formatTime(best), "Best single", `ao5 ${formatTime(averageOf(data.solves, 5))} · ao12 ${formatTime(averageOf(data.solves, 12))}`],
    [`${solvedPuzzles}`, "Puzzles solved", `of ${data.puzzles.length} attempts`],
    [`${wins}`, "Wins vs Stockfish", `of ${data.games.length} games`],
    [`${data.scans}`, "Cubes scanned"],
  ];
  return (
    <div className="space-y-14">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm border-l-2 border-ink pl-4">
        {mode === "account" ? <span>Signed in as <strong>{profile?.display_name || profile?.username || user?.email}</strong>. Progress is saved to your account.</span>
          : <span>Guest mode: progress is saved in this browser only{configured ? <>. <Link href="/auth" className="link">Sign in</Link> to keep it.</> : "."}</span>}
        {syncError && <span className="text-bad">Sync error: {syncError}</span>}
        {mode === "account" && guestHasData && <button className="btn btn-ghost !py-1 ml-auto" onClick={async () => setMsg(await importGuestToAccount())}>Import guest progress</button>}
        {mode === "guest" && <button className="text-sm text-muted underline underline-offset-4 hover:text-bad ml-auto" onClick={() => { if (confirm("Delete all progress stored in this browser?")) resetLocal(); }}>Reset local data</button>}
        {msg && <span className="w-full text-ok">{msg}</span>}
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-ink">
        {stats.map(([v, l, sub]) => (
          <div key={l} className="py-4 pr-4 border-b border-line lg:border-b-0">
            <dt className="text-xs text-muted">{l}</dt>
            <dd className="font-display text-3xl font-medium mt-1 tabular-nums">{v}</dd>
            {sub && <dd className="text-xs text-muted mt-1 font-mono">{sub}</dd>}
          </div>
        ))}
      </dl>

      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">Next lessons</h2>
          <ul className="border-t border-ink">
            {[["chess", nextChess] as const, ["cube", nextCube] as const].map(([k, l]) => (
              <li key={k} className="border-b border-line py-3">
                <div className="eyebrow flex items-center gap-2"><span className={`h-2 w-2 ${k === "chess" ? "bg-chess" : "bg-cube"}`} aria-hidden />{k === "chess" ? "Chess" : "Cube"}{l ? ` · ${l.level}` : ""}</div>
                {l ? <Link href={`/${k}/lessons/${l.slug}`} className="font-display text-xl hover:underline underline-offset-4 decoration-1">{l.title}</Link>
                  : <p className="text-ok mt-1">Every {k} lesson is complete.</p>}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">Last {recent.length || ""} solves</h2>
          {recent.length === 0 ? <p className="text-sm text-muted border-t border-ink pt-3">No solves yet. <Link className="link" href="/cube/timer">Open the timer</Link>.</p> : (
            <div className="border-t border-ink pt-3">
              <div className="flex items-end gap-[3px] h-36" role="img" aria-label={`Bar chart of your last ${recent.length} solve times`}>
                {recent.map((s) => { const t = effectiveTime(s); const dnf = !isFinite(t); return <div key={s.id} title={dnf ? "DNF" : formatTime(t)} className={`flex-1 ${dnf ? "bg-bad/50" : "bg-cube"}`} style={{ height: dnf ? "100%" : `${(t / maxT) * 100}%` }} />; })}
              </div>
              <div className="flex justify-between text-xs text-muted font-mono mt-1"><span>older</span><span>slowest {formatTime(maxT)}</span><span>latest</span></div>
            </div>
          )}
        </section>
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-4"><h2 className="font-display text-2xl font-semibold">Achievements</h2><span className="text-sm text-muted font-mono">{unlockedCount} of {ACHIEVEMENTS.length}</span></div>
        <ul className="border-t border-ink grid sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => { const on = a.test(data); return (
            <li key={a.id} className="border-b border-line py-3 flex gap-3 items-baseline sm:odd:pr-8 sm:even:pl-8 sm:odd:border-r">
              <span aria-hidden className={`h-2.5 w-2.5 shrink-0 border ${on ? "bg-ok border-ok" : "border-muted"}`} />
              <div className="flex-1"><div className={`text-sm font-medium ${on ? "" : "text-muted"}`}>{a.title}</div><div className="text-xs text-muted">{a.description}</div></div>
              <span className={`text-xs font-mono ${on ? "text-ok" : "text-muted"}`}>{on ? "Unlocked" : "Locked"}</span>
            </li>
          ); })}
        </ul>
      </section>
    </div>
  );
}
