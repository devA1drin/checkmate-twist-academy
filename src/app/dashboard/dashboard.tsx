"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Timer, Puzzle, Swords, Award, UploadCloud, Trash2, ScanLine, GraduationCap } from "lucide-react";
import { useProgress } from "@/lib/progress-context";
import { useAuth } from "@/lib/auth-context";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { CHESS_LESSONS } from "@/data/chess-lessons";
import { CUBE_LESSONS } from "@/data/cube-lessons";
import { averageOf, effectiveTime, formatTime } from "@/lib/progress-types";

function Stat({ icon: Icon, label, value, sub }: { icon: typeof BookOpen; label: string; value: string; sub?: string }) {
  return <div className="card p-4"><Icon size={18} className="text-aqua" /><div className="text-2xl font-bold mt-2 font-mono">{value}</div><div className="text-sm text-muted">{label}</div>{sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}</div>;
}

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

  if (!ready) return <p className="text-muted">Loading your progress…</p>;
  return (
    <div className="space-y-8">
      <div className="card p-4 flex flex-wrap items-center gap-3 text-sm">
        {mode === "account" ? <span>Signed in as <strong>{profile?.display_name || profile?.username || user?.email}</strong> — progress syncs to your account.</span>
          : <span><strong>Local guest mode:</strong> progress is saved only in this browser{configured ? <> — <Link href="/auth" className="text-electric hover:underline">sign in</Link> to sync it.</> : " (no backend configured)."}</span>}
        {syncError && <span className="text-red-400">Sync error: {syncError}</span>}
        {mode === "account" && guestHasData && <button className="btn btn-ghost ml-auto" onClick={async () => setMsg(await importGuestToAccount())}><UploadCloud size={15} /> Import guest progress</button>}
        {mode === "guest" && <button className="btn btn-ghost ml-auto" onClick={() => { if (confirm("Delete all progress stored in this browser?")) resetLocal(); }}><Trash2 size={15} /> Reset local data</button>}
        {msg && <span className="w-full text-emerald-400">{msg}</span>}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Stat icon={BookOpen} label="Chess lessons" value={`${chessDone}/${CHESS_LESSONS.length}`} />
        <Stat icon={GraduationCap} label="Cube lessons" value={`${cubeDone}/${CUBE_LESSONS.length}`} />
        <Stat icon={Timer} label="Best single" value={formatTime(best)} sub={`ao5 ${formatTime(averageOf(data.solves, 5))} · ao12 ${formatTime(averageOf(data.solves, 12))}`} />
        <Stat icon={Puzzle} label="Puzzles solved" value={`${solvedPuzzles}`} sub={`${data.puzzles.length} attempts`} />
        <Stat icon={Swords} label="Wins vs Stockfish" value={`${wins}`} sub={`${data.games.length} games`} />
        <Stat icon={ScanLine} label="Cubes scanned" value={`${data.scans}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="font-semibold mb-3">Continue learning</div>
          <div className="space-y-2">
            {nextChess ? <Link href={`/chess/lessons/${nextChess.slug}`} className="block rounded-xl bg-surface-2 p-3 hover:ring-1 hover:ring-electric"><div className="text-xs text-muted">Chess · {nextChess.level}</div><div className="font-medium">{nextChess.title}</div></Link> : <p className="text-sm text-emerald-400">All chess lessons complete!</p>}
            {nextCube ? <Link href={`/cube/lessons/${nextCube.slug}`} className="block rounded-xl bg-surface-2 p-3 hover:ring-1 hover:ring-electric"><div className="text-xs text-muted">Cube · {nextCube.level}</div><div className="font-medium">{nextCube.title}</div></Link> : <p className="text-sm text-emerald-400">All cube lessons complete!</p>}
          </div>
        </div>
        <div className="card p-5">
          <div className="font-semibold mb-3">Recent solve times</div>
          {recent.length === 0 ? <p className="text-sm text-muted">No solves yet — <Link className="text-electric hover:underline" href="/cube/timer">open the timer</Link>.</p> : (
            <div className="flex items-end gap-1 h-36" aria-label="Bar chart of recent solve times">
              {recent.map((s) => { const t = effectiveTime(s); const dnf = !isFinite(t); return <div key={s.id} title={dnf ? "DNF" : formatTime(t)} className={`flex-1 rounded-t ${dnf ? "bg-red-400/60" : "bg-gradient-to-t from-electric to-aqua"}`} style={{ height: dnf ? "100%" : `${(t / maxT) * 100}%` }} />; })}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><Award size={18} className="text-aqua" /> Achievements</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => { const on = a.test(data); return (
            <div key={a.id} className={`card p-4 flex gap-3 items-center ${on ? "glow" : "opacity-50 grayscale"}`}>
              <div className="text-3xl" aria-hidden>{a.icon}</div>
              <div><div className="font-semibold text-sm">{a.title}</div><div className="text-xs text-muted">{a.description}</div>{on && <div className="text-[11px] text-emerald-400 mt-0.5">Unlocked</div>}</div>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}
