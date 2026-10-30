"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Board, tryMove } from "@/components/chess/board";
import { CubeNet } from "@/components/cube/cube-net";
import { SolveTimer, type Penalty } from "@/components/cube/solve-timer";
import { applyAlg, SOLVED } from "@/lib/cube/model";
import { formatTime } from "@/lib/progress-types";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { notifyActivity } from "@/lib/stats-context";
import { dailyPuzzle, dailyScramble, utcDay, untilNext } from "@/lib/daily";

type Kind = "puzzle" | "scramble";
interface Entry { solved: boolean; time_ms: number | null }
interface BoardRow { display_name: string; solved: boolean; time_ms: number | null }
const LOCAL = "ct-daily-v1";
const readLocal = (): Record<string, Entry> => { try { return JSON.parse(localStorage.getItem(LOCAL) ?? "{}"); } catch { return {}; } };

function useDaily(kind: Kind, day: string) {
  const { user } = useAuth();
  const [mine, setMine] = useState<Entry | null | undefined>(undefined);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    const sb = getSupabase();
    const local = readLocal()[`${day}:${kind}`] ?? null;
    if (!sb) { setMine(local); return; }
    const [b, m] = await Promise.all([
      sb.rpc("daily_board", { p_kind: kind, p_day: day }),
      user ? sb.from("daily_entries").select("solved, time_ms").eq("user_id", user.id).eq("day", day).eq("kind", kind).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setBoard((b.data ?? []) as BoardRow[]);
    setMine((m.data as Entry | null) ?? local);
  }, [kind, day, user]);
  useEffect(() => { load(); }, [load]);
  const submit = async (e: Entry) => {
    const all = readLocal(); all[`${day}:${kind}`] = e; localStorage.setItem(LOCAL, JSON.stringify(all));
    setMine(e);
    const sb = getSupabase();
    if (sb && user) {
      const { error } = await sb.rpc("submit_daily", { p_kind: kind, p_solved: e.solved, p_time_ms: e.time_ms });
      if (error) setErr(error.message); else notifyActivity();
      load();
    }
  };
  return { mine, board, submit, err, signedIn: !!user };
}

function Leaderboard({ rows, kind }: { rows: BoardRow[]; kind: Kind }) {
  return (
    <div>
      <h3 className="font-medium mb-2">Today&apos;s results</h3>
      {rows.length === 0 ? <p className="text-sm text-muted">No results yet today.</p> : (
        <ol className="border-t border-line text-sm">{rows.slice(0, 15).map((r, i) => (
          <li key={i} className="flex gap-3 py-2 border-b border-line"><span className="w-6 text-muted tabular-nums">{i + 1}</span><span className="flex-1 truncate">{r.display_name}</span>
            <span className="tabular-nums">{r.solved ? (r.time_ms ? formatTime(r.time_ms) : "Solved") : kind === "puzzle" ? "Missed" : "DNF"}</span></li>))}</ol>
      )}
    </div>
  );
}

function Puzzle({ day }: { day: string }) {
  const p = dailyPuzzle(day);
  const d = useDaily("puzzle", day);
  const [fen, setFen] = useState(p.fen);
  const [step, setStep] = useState(0);
  const [last, setLast] = useState<[string, string] | null>(null);
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"ready" | "playing" | "done">("ready");
  const mistakes = useRef(0), t0 = useRef(0);

  const begin = () => {
    setState("playing"); mistakes.current = 0;
    const u = p.moves[0]; const r = tryMove(p.fen, u.slice(0, 2), u.slice(2, 4), u[4]);
    if (r) { setFen(r.game.fen()); setLast([u.slice(0, 2), u.slice(2, 4)]); setStep(1); setMsg(`Find the best move for ${r.game.turn() === "w" ? "White" : "Black"}.`); }
    t0.current = performance.now();
  };
  const finish = (solved: boolean) => { setState("done"); d.submit({ solved, time_ms: Math.round(performance.now() - t0.current) }); };
  const onMove = (from: string, to: string) => {
    if (state !== "playing" || step % 2 === 0) return false;
    const exp = p.moves[step]; const r = tryMove(fen, from, to, exp[4] ?? "q");
    if (!r) return false;
    const uci = from + to + (r.move.promotion ?? "");
    if (uci !== exp && !r.game.isCheckmate()) { mistakes.current++; setMsg("Not the best move. Try again (this counts as a miss)."); return false; }
    setFen(r.game.fen()); setLast([from, to]);
    if (step + 1 >= p.moves.length || r.game.isCheckmate()) { setMsg(mistakes.current ? "Solved, with a mistake." : "Solved."); finish(mistakes.current === 0); return true; }
    setMsg("Correct. Keep going."); const n = step + 1; setStep(n);
    setTimeout(() => { const o = p.moves[n]; const rr = tryMove(r.game.fen(), o.slice(0, 2), o.slice(2, 4), o[4]); if (rr) { setFen(rr.game.fen()); setLast([o.slice(0, 2), o.slice(2, 4)]); setStep(n + 1); } }, 450);
    return true;
  };
  const giveUp = () => { setMsg(`The first move was ${p.moves[1]}.`); finish(false); };
  const flip: "white" | "black" = p.fen.split(" ")[1] === "w" ? "black" : "white";
  const done = d.mine && state !== "playing";

  return (
    <section aria-labelledby="dp" className="grid md:grid-cols-[minmax(0,440px)_1fr] gap-8">
      <div>
        <Board id="daily-puzzle" fen={done && state === "ready" ? p.fen : fen} orientation={flip} lastMove={last} onMove={state === "playing" ? onMove : undefined} />
      </div>
      <div className="space-y-5">
        <div><h2 id="dp" className="text-2xl font-semibold">Daily puzzle</h2><p className="text-muted">Rating {p.rating} · {p.primary.replace(/([A-Z])/g, " $1").toLowerCase()} · new puzzle in {untilNext()}</p></div>
        {done && state === "ready" ? (
          <p className="notice notice-ok">You did today&apos;s puzzle: {d.mine!.solved ? `solved in ${formatTime(d.mine!.time_ms)}` : "missed"}. Come back tomorrow.</p>
        ) : state === "ready" ? (
          <><p>Your first attempt counts. A wrong move or giving up marks it as missed.</p><button className="btn btn-primary" onClick={begin}>Start the puzzle</button></>
        ) : <p aria-live="polite" className="font-medium">{msg}</p>}
        {state === "playing" && <button className="btn btn-ghost" onClick={giveUp}>Give up and show the answer</button>}
        {state === "done" && <p className="text-sm"><a className="link" href={p.gameUrl} target="_blank" rel="noopener noreferrer">See the original game on Lichess</a> · <Link className="link" href="/chess/puzzles">More puzzles</Link></p>}
        {!d.signedIn && <p className="text-sm text-muted"><Link className="link" href="/auth?next=/daily">Sign in</Link> to save your result and appear in today&apos;s results.</p>}
        {d.err && <p role="alert" className="notice notice-bad">{d.err}</p>}
        <Leaderboard rows={d.board} kind="puzzle" />
      </div>
    </section>
  );
}

function Scramble({ day }: { day: string }) {
  const scramble = dailyScramble(day);
  const d = useDaily("scramble", day);
  const [result, setResult] = useState<{ ms: number; pen: Penalty } | null>(null);
  const [started, setStarted] = useState(false);
  const onDone = (ms: number, pen: Penalty) => {
    setResult({ ms, pen });
    const final = pen === "+2" ? ms + 2000 : ms;
    d.submit({ solved: pen !== "DNF", time_ms: pen === "DNF" ? null : final });
  };
  const done = !!d.mine && !result;
  return (
    <section aria-labelledby="ds" className="grid md:grid-cols-[minmax(0,440px)_1fr] gap-8">
      <div className="space-y-4">
        <div className="max-w-xs"><CubeNet state={applyAlg(SOLVED, scramble)} /></div>
        <p className="font-mono text-xl leading-relaxed">{scramble}</p>
        <p className="text-xs text-muted">A 25-turn random-move scramble generated from today&apos;s date, so everyone gets the same one. It is not a WCA random-state scramble. Hold white on top and green in front.</p>
      </div>
      <div className="space-y-5">
        <div><h2 id="ds" className="text-2xl font-semibold">Daily scramble</h2><p className="text-muted">One timed attempt with 15 s inspection.</p></div>
        {done ? <p className="notice notice-ok">You did today&apos;s scramble: {d.mine!.solved ? formatTime(d.mine!.time_ms) : "DNF"}.</p>
          : !started ? <><p>Scramble your cube, then start. Times are self-reported on your honour; they are labelled as such.</p><button className="btn btn-primary" onClick={() => setStarted(true)}>I&apos;ve scrambled it</button></>
            : <SolveTimer inspection disabled={!!result} onDone={onDone} />}
        {result && <p className="notice notice-ok">{result.pen === "DNF" ? "DNF (inspection over 17 s)." : `${formatTime(result.pen === "+2" ? result.ms + 2000 : result.ms)}${result.pen === "+2" ? " (includes +2)" : ""}.`}</p>}
        {!d.signedIn && <p className="text-sm text-muted"><Link className="link" href="/auth?next=/daily">Sign in</Link> to save your time.</p>}
        {d.err && <p role="alert" className="notice notice-bad">{d.err}</p>}
        <Leaderboard rows={d.board} kind="scramble" />
        <p className="text-xs text-muted">Self-reported times. Anything under 2.5 s is rejected.</p>
      </div>
    </section>
  );
}

export function Daily() {
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => { setDay(utcDay()); const t = setInterval(() => setDay(utcDay()), 60000); return () => clearInterval(t); }, []);
  if (!day) return <p className="text-muted">Loading…</p>;
  return (
    <div className="space-y-16">
      <Puzzle key={`p-${day}`} day={day} />
      <div className="border-t border-ink" />
      <Scramble key={`s-${day}`} day={day} />
    </div>
  );
}
