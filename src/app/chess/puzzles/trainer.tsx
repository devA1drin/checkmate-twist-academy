"use client";
import { Chess } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, Lightbulb, Eye, SkipForward, ExternalLink, Cpu } from "lucide-react";
import Link from "next/link";
import { Board, tryMove } from "@/components/chess/board";
import puzzlesData from "@/data/puzzles.json";
import { useProgress } from "@/lib/progress-context";

interface P { id: string; fen: string; moves: string[]; rating: number; themes: string[]; primary: string; gameUrl: string; opening?: string }
const PUZZLES = puzzlesData as P[];
const THEMES = [...new Set(PUZZLES.map((p) => p.primary))].sort();
const BANDS = [{ label: "All ratings", min: 0, max: 9999 }, { label: "< 1000", min: 0, max: 999 }, { label: "1000–1499", min: 1000, max: 1499 }, { label: "1500–1999", min: 1500, max: 1999 }, { label: "2000+", min: 2000, max: 9999 }];
const pretty = (t: string) => t.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).replace(/ In(\d)/, " in $1");

type State = "playing" | "solved" | "failed";

export function PuzzleTrainer() {
  const { data, addPuzzleAttempt } = useProgress();
  const [theme, setTheme] = useState("all");
  const [band, setBand] = useState(0);
  const pool = useMemo(() => PUZZLES.filter((p) => (theme === "all" || p.primary === theme) && p.rating >= BANDS[band].min && p.rating <= BANDS[band].max), [theme, band]);
  const [puzzle, setPuzzle] = useState<P | null>(null);
  const [step, setStep] = useState(0); // index into moves of the next move to be played
  const [fen, setFen] = useState("");
  const [last, setLast] = useState<[string, string] | null>(null);
  const [state, setState] = useState<State>("playing");
  const [feedback, setFeedback] = useState<string>("");
  const [hint, setHint] = useState(false);
  const recorded = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const solvedIds = useMemo(() => new Set(data.puzzles.filter((a) => a.solved).map((a) => a.puzzleId)), [data.puzzles]);

  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const start = useCallback((p: P) => {
    clearTimers();
    setPuzzle(p); setStep(0); setFen(p.fen); setLast(null); setState("playing"); setHint(false); setFeedback("");
    recorded.current = null;
    // the first move in a Lichess puzzle is the opponent's move that creates the tactic
    later(() => {
      const u = p.moves[0];
      const r = tryMove(p.fen, u.slice(0, 2), u.slice(2, 4), u[4]);
      if (r) { setFen(r.game.fen()); setLast([u.slice(0, 2), u.slice(2, 4)]); setStep(1); setFeedback(`Find the best move for ${r.game.turn() === "w" ? "White" : "Black"}.`); }
    }, 600);
  }, []);

  const pick = useCallback(() => {
    if (!pool.length) { setPuzzle(null); return; }
    const unsolved = pool.filter((p) => !solvedIds.has(p.id) && p.id !== puzzle?.id);
    const from = unsolved.length ? unsolved : pool;
    start(from[Math.floor(Math.random() * from.length)]);
  }, [pool, solvedIds, puzzle?.id, start]);

  // pick a puzzle when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { pick(); return clearTimers; }, [theme, band]);

  const record = (solved: boolean) => {
    if (!puzzle || recorded.current === puzzle.id) return;
    recorded.current = puzzle.id;
    addPuzzleAttempt({ puzzleId: puzzle.id, solved, rating: puzzle.rating, at: new Date().toISOString() });
  };

  const onMove = (from: string, to: string) => {
    if (!puzzle || state !== "playing" || step % 2 === 0 || step >= puzzle.moves.length) return false;
    const expected = puzzle.moves[step];
    const r = tryMove(fen, from, to, expected[4] ?? "q");
    if (!r) return false;
    const uci = from + to + (r.move.promotion ?? "");
    // Accept the expected move, or any move that delivers checkmate (as Lichess does)
    if (uci !== expected && !(r.game.isCheckmate())) {
      setFeedback("Not the best move — try again, or reveal the solution.");
      setHint(true);
      record(false);
      return false;
    }
    setFen(r.game.fen()); setLast([from, to]); setHint(false);
    const nextStep = step + 1;
    if (nextStep >= puzzle.moves.length || r.game.isCheckmate()) {
      setStep(puzzle.moves.length); setState(recorded.current ? "failed" : "solved");
      setFeedback(recorded.current ? "Solved (with a mistake)." : "Solved.");
      record(true);
      return true;
    }
    setFeedback("Correct. Keep going.");
    setStep(nextStep);
    later(() => {
      const u = puzzle.moves[nextStep];
      const rr = tryMove(r.game.fen(), u.slice(0, 2), u.slice(2, 4), u[4]);
      if (rr) { setFen(rr.game.fen()); setLast([u.slice(0, 2), u.slice(2, 4)]); setStep(nextStep + 1); }
    }, 450);
    return true;
  };

  const reveal = () => {
    if (!puzzle) return;
    record(false);
    setState("failed"); setFeedback("Solution:");
    let f = fen;
    puzzle.moves.slice(step).forEach((u, i) => later(() => {
      const r = tryMove(f, u.slice(0, 2), u.slice(2, 4), u[4]);
      if (r) { f = r.game.fen(); setFen(f); setLast([u.slice(0, 2), u.slice(2, 4)]); setStep(step + i + 1); }
    }, 600 * (i + 1)));
  };

  const solverColor = puzzle ? (new Chess(puzzle.fen).turn() === "w" ? "black" : "white") : "white";
  const solutionSan = useMemo(() => {
    if (!puzzle) return [];
    const g = new Chess(puzzle.fen);
    return puzzle.moves.map((u) => g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san);
  }, [puzzle]);
  const hintSq = hint && puzzle && step < puzzle.moves.length ? { [puzzle.moves[step].slice(0, 2)]: { boxShadow: "inset 0 0 0 4px rgba(250,204,21,.9)" } } : undefined;
  const stats = data.puzzles.length ? `${data.puzzles.filter((a) => a.solved).length}/${data.puzzles.length} solved` : "No attempts yet";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div>
        {puzzle ? <Board id="puzzle" fen={fen} orientation={solverColor} onMove={onMove} lastMove={last} highlight={hintSq} /> : <div className="card p-10 text-center text-muted">No puzzles match these filters.</div>}
      </div>
      <div className="space-y-4">
        <div className="card p-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm"><span className="font-semibold block mb-1">Theme</span>
            <select className="input" value={theme} onChange={(e) => setTheme(e.target.value)}><option value="all">All themes</option>{THEMES.map((t) => <option key={t} value={t}>{pretty(t)}</option>)}</select></label>
          <label className="text-sm"><span className="font-semibold block mb-1">Rating</span>
            <select className="input" value={band} onChange={(e) => setBand(+e.target.value)}>{BANDS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}</select></label>
          <div className="text-xs text-muted sm:col-span-2">{pool.length} puzzles in this set · {stats}</div>
        </div>
        {puzzle && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Puzzle #{puzzle.id}</div>
              <span className="chip">Rating {puzzle.rating}</span>
            </div>
            <div className="flex flex-wrap gap-1">{puzzle.themes.slice(0, 6).map((t) => <span key={t} className="chip">{pretty(t)}</span>)}</div>
            <div className={`flex items-center gap-2 text-sm font-medium ${state === "solved" ? "text-ok" : feedback.startsWith("Not") ? "text-bad" : ""}`}>
              {state === "solved" && <CheckCircle2 size={17} />}{feedback.startsWith("Not") && <XCircle size={17} />}{feedback || "Watch the opponent's move…"}
            </div>
            {state !== "playing" && <p className="font-mono text-xs text-muted">{solutionSan.slice(1).join(" ")}</p>}
            <div className="flex flex-wrap gap-2">
              {state === "playing" && <><button className="btn btn-ghost" onClick={() => setHint(true)}><Lightbulb size={15} /> Hint</button><button className="btn btn-ghost" onClick={reveal}><Eye size={15} /> Show solution</button></>}
              <button className="btn btn-primary" onClick={pick}><SkipForward size={15} /> Next puzzle</button>
              {state !== "playing" && <Link className="btn btn-ghost" href={`/chess/analysis?fen=${encodeURIComponent(fen)}`}><Cpu size={15} /> Analyse</Link>}
            </div>
            <a className="text-xs text-muted hover:text-electric inline-flex items-center gap-1" href={`https://lichess.org/training/${puzzle.id}`} target="_blank" rel="noreferrer">View on Lichess <ExternalLink size={11} /></a>
          </div>
        )}
        <p className="text-xs text-muted">Puzzles © Lichess.org contributors, released under CC0. Ratings are Lichess puzzle ratings.</p>
      </div>
    </div>
  );
}
