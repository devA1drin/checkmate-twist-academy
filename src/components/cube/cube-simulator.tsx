"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Shuffle, Keyboard, CheckCircle2, Loader2, Undo2, Redo2, Paintbrush, Eraser, Crosshair, ChevronsLeft } from "lucide-react";
import type { CubeHandle, MoveSource } from "./cube3d";
import { normalizeToCenters, SOLVED } from "@/lib/cube/model";
import { applyMoves, invertNxn, isSolvedState, parseNxn, solvedState } from "@/lib/cube/nxn";
import { validateFacelets } from "@/lib/cube/validate";
import { initSolver, randomStateScramble, solveFacelets } from "@/lib/cube/solver-client";
import { solve2x2 } from "@/lib/cube/solver2";
import { CubeNet } from "./cube-net";
import { COLOR_NAMES, STICKER_COLORS_2D } from "./colors";

const Cube3D = dynamic(() => import("./cube3d").then((m) => m.Cube3D), { ssr: false, loading: () => <div className="h-full grid place-items-center text-muted text-sm"><Loader2 className="animate-spin" /> Loading 3D cube…</div> });

type Kind = "manual" | "fwd" | "back" | "undo" | "redo";
type Move = { text: string };
export interface Sequence { label: string; moves: Move[]; startState: string }

const SIZES = [2, 3, 4, 5, 6, 7];
const SUFFIXES = ["", "'", "2"];
function moveRows(n: number): string[][] {
  const faces = ["U", "D", "R", "L", "F", "B"];
  const rows = [faces];
  if (n >= 3) rows.push(faces.map((f) => (n === 3 ? f.toLowerCase() : f + "w")));
  if (n >= 4) rows.push(["2U", "2D", "2R", "2L", "2F", "2B"]);
  rows.push(n % 2 && n >= 3 ? ["M", "E", "S", "x", "y", "z"] : ["x", "y", "z"]);
  return rows;
}
const rand = (k: number) => Math.floor(Math.random() * k);
/** Random-turn scramble for big cubes (outer and wide turns, no same-axis repeats). */
function bigScramble(n: number, len = n === 3 ? 25 : n === 4 ? 40 : n === 5 ? 60 : n === 6 ? 80 : 100) {
  const out: string[] = []; let lastAxis = -1;
  const faces = ["U", "D", "R", "L", "F", "B"], axisOf = [0, 0, 1, 1, 2, 2];
  while (out.length < len) {
    const f = rand(6); if (axisOf[f] === lastAxis) continue;
    lastAxis = axisOf[f];
    const depth = 1 + rand(Math.floor(n / 2));
    out.push((depth > 2 ? depth : "") + faces[f] + (depth > 1 ? "w" : "") + SUFFIXES[rand(3)]);
  }
  return out.join(" ");
}
/** 2x2 random-state scramble: a long random turn walk, then the inverse of its optimal solution. */
/** Shortest solution of up to 3 face turns, if one exists (two-phase can return long answers for near-solved cubes). */
function shortSolve3(state: string): string | null {
  const faces = ["U", "R", "F", "D", "L", "B"], ms = faces.flatMap((f) => SUFFIXES.map((x) => f + x));
  const go = (s: string, depth: number, path: string[], last: string): string[] | null => {
    if (isSolvedState(3, s)) return path;
    if (!depth) return null;
    for (const m of ms) {
      if (m[0] === last) continue;
      const r = go(applyMoves(3, s, parseNxn(3, m)), depth - 1, [...path, m], m[0]);
      if (r) return r;
    }
    return null;
  };
  for (let d = 1; d <= 3; d++) { const r = go(state, d, [], ""); if (r) return r.join(" "); }
  return null;
}
function scramble2x2() {
  const walk = Array.from({ length: 60 }, () => "URF"[rand(3)] + SUFFIXES[rand(3)]).join(" ");
  const s = applyMoves(2, solvedState(2), parseNxn(2, walk));
  const sol = solve2x2(s);
  return invertNxn(parseNxn(2, sol)).map((m) => m.text).join(" ");
}

export function CubeSimulator({ initialState = SOLVED, initialSequence, compact, onSolvedChange }: { initialState?: string; initialSequence?: Sequence | null; compact?: boolean; onSolvedChange?: (s: boolean) => void }) {
  const cube = useRef<CubeHandle>(null);
  const [n, setN] = useState(3);
  const nRef = useRef(3);
  const [state, setState] = useState(initialState);
  const stateRef = useRef(initialState);
  const [seq, setSeq] = useState<Sequence | null>(initialSequence ?? null);
  const seqStates = useRef<string[]>([]);
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const [offTrack, setOffTrack] = useState(false);
  const kinds = useRef<Kind[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [redo, setRedo] = useState<string[]>([]);
  const doneRef = useRef<string[]>([]); const redoRef = useRef<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [algText, setAlgText] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [solverState, setSolverState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [scramble, setScramble] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [paint, setPaint] = useState<string | null>(null); // selected colour while painting

  const setHistory = (d: string[], r: string[]) => { doneRef.current = d; redoRef.current = r; setDone(d); setRedo(r); };
  const setSeqFull = useCallback((s: Sequence | null, at = 0) => {
    setSeq(s);
    seqStates.current = [];
    if (s) { let st = s.startState; seqStates.current.push(st); for (const m of s.moves) { st = applyMoves(nRef.current, st, parseNxn(nRef.current, m.text)); seqStates.current.push(st); } }
    posRef.current = at; setPos(at); setOffTrack(false);
  }, []);
  useEffect(() => { if (initialSequence) setSeqFull(initialSequence); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const solved = isSolvedState(n, state);
  useEffect(() => { onSolvedChange?.(solved); }, [solved, onSolvedChange]);

  const warmSolver = useCallback(() => {
    if (solverState !== "idle" || nRef.current !== 3) return;
    setSolverState("loading");
    initSolver().then(() => setSolverState("ready")).catch(() => setSolverState("error"));
  }, [solverState]);

  const enqueue = useCallback((moves: Move[], kind: Kind) => {
    if (!moves.length) return;
    kinds.current.push(...moves.map(() => kind));
    cube.current?.enqueue(moves);
    setBusy(true);
  }, []);

  /** Every finished turn (queued or dragged) updates the model, history and the playback position. */
  const onMoveDone = useCallback((m: Move, source: MoveSource) => {
    const kind: Kind = source === "queue" ? kinds.current.shift() ?? "manual" : "manual";
    const N = nRef.current;
    stateRef.current = applyMoves(N, stateRef.current, parseNxn(N, m.text));
    setState(stateRef.current);
    if (kind === "undo") setHistory(doneRef.current.slice(0, -1), [...redoRef.current, doneRef.current[doneRef.current.length - 1]]);
    else if (kind === "redo") setHistory([...doneRef.current, m.text], redoRef.current.slice(0, -1));
    else setHistory([...doneRef.current, m.text], []);
    const ss = seqStates.current;
    if (ss.length) {
      const p = posRef.current;
      const near = [p + 1, p - 1, p].find((i) => i >= 0 && i < ss.length && ss[i] === stateRef.current);
      const at = near ?? ss.indexOf(stateRef.current);
      if (at >= 0) { posRef.current = at; setPos(at); setOffTrack(false); } else setOffTrack(true);
    }
  }, []);
  const onIdle = useCallback(() => setBusy(false), []);

  const hardReset = useCallback((s: string, keepHistory = false) => {
    cube.current?.reset(s);
    kinds.current = [];
    stateRef.current = s;
    setState(s);
    setBusy(false);
    if (!keepHistory) setHistory([], []);
  }, []);

  const manual = useCallback((text: string) => {
    try { enqueue(parseNxn(nRef.current, text), "manual"); } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); }
  }, [enqueue]);

  const undo = useCallback(() => { const d = doneRef.current; if (!d.length || cube.current?.busy()) return; enqueue(invertNxn(parseNxn(nRef.current, d[d.length - 1])).map((m) => ({ text: m.text })).slice(0, 1), "undo"); }, [enqueue]);
  const redoMove = useCallback(() => { const r = redoRef.current; if (!r.length || cube.current?.busy()) return; enqueue([{ text: r[r.length - 1] }], "redo"); }, [enqueue]);

  // keyboard notation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redoMove(); else undo(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey || paint) return;
      const k = e.key.toUpperCase();
      if (k.length !== 1 || !"URFDLBMESXYZ".includes(k)) return;
      if ("MES".includes(k) && nRef.current % 2 === 0) return;
      e.preventDefault();
      manual(("XYZ".includes(k) ? k.toLowerCase() : k) + (e.shiftKey ? "'" : ""));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [manual, undo, redoMove, paint]);

  const play = () => { if (!seq) return; enqueue(seq.moves.slice(pos), "fwd"); };
  const pause = () => { const inflight = cube.current?.clearQueue() ?? 0; kinds.current = kinds.current.slice(0, inflight); if (!inflight) setBusy(false); };
  const stepF = () => { if (seq && !busy && pos < seq.moves.length) enqueue([seq.moves[pos]], "fwd"); };
  const stepB = () => { if (seq && !busy && pos > 0) enqueue(invertNxn(parseNxn(n, seq.moves[pos - 1].text)).map((m) => ({ text: m.text })), "back"); };
  const jumpTo = (i: number) => { if (!seq) return; hardReset(seqStates.current[i], true); posRef.current = i; setPos(i); setOffTrack(false); };

  const changeSize = (k: number) => {
    if (k === n) return;
    nRef.current = k; setN(k); setSeqFull(null); setScramble(null); setMsg(null); setPaint(null);
    const s = solvedState(k); stateRef.current = s; setState(s); kinds.current = []; setBusy(false); setHistory([], []);
  };

  const doScramble = async () => {
    setMsg(null); setWorking(true); setSeqFull(null); setPaint(null);
    try {
      const N = nRef.current;
      let text: string, note: string;
      if (N === 3) {
        try {
          setSolverState((s) => (s === "ready" ? s : "loading"));
          text = (await randomStateScramble()).scramble; setSolverState("ready");
          note = "Random-state scramble (WCA style) generated by the two-phase solver.";
        } catch { text = bigScramble(3); note = "Solver unavailable, so this is a 25-move random-turn scramble."; }
      } else if (N === 2) { text = scramble2x2(); note = "Random-state 2×2 scramble (inverse of an optimal solution)."; }
      else { text = bigScramble(N); note = `${text.split(" ").length}-move random-turn scramble.`; }
      setScramble(text);
      hardReset(applyMoves(N, solvedState(N), parseNxn(N, text)));
      setMsg({ kind: "info", text: note });
    } finally { setWorking(false); }
  };

  const doReset = () => { setSeqFull(null); setScramble(null); setMsg(null); hardReset(solvedState(nRef.current)); cube.current?.resetView(); };

  const doSolve = async () => {
    setMsg(null);
    if (busy) return;
    const N = nRef.current, cur = stateRef.current;
    const blanks = [...cur].filter((c) => c === "X").length;
    if (blanks) { setMsg({ kind: "error", text: `${blanks} sticker${blanks > 1 ? "s are" : " is"} still blank. Paint every sticker first.` }); return; }
    if (isSolvedState(N, cur)) { setMsg({ kind: "info", text: "The cube is already solved." }); return; }
    setWorking(true);
    try {
      const t0 = performance.now();
      let sol: string, label: string;
      if (N === 3) {
        const norm = normalizeToCenters(cur);
        const v = validateFacelets(norm);
        if (!v.ok) { setMsg({ kind: "error", text: v.errors.join(" ") }); return; }
        const short = shortSolve3(cur);
        if (short) { sol = short; label = "shortest"; }
        else {
          setSolverState((s) => (s === "ready" ? s : "loading"));
          sol = await solveFacelets(norm); setSolverState("ready");
          label = "Kociemba two-phase";
        }
      } else if (N === 2) {
        await new Promise((r) => setTimeout(r, 20));
        sol = solve2x2(cur); label = "optimal";
      } else { setMsg({ kind: "info", text: "Automatic solving is available for 2×2 and 3×3." }); return; }
      const moves = parseNxn(N, sol).map((m) => ({ text: m.text }));
      // every solution is replayed on our own model before it is shown
      if (!isSolvedState(N, applyMoves(N, cur, parseNxn(N, sol)))) throw new Error("the solution failed verification, so it is not shown");
      setPaint(null);
      setSeqFull({ label: `Solution: ${moves.length} move${moves.length === 1 ? "" : "s"} (${label})`, moves, startState: cur });
      setMsg({ kind: "info", text: `Found in ${Math.round(performance.now() - t0)} ms and verified on the cube model. Press play or step through it.` });
    } catch (e) {
      if (N === 3 && solverState !== "ready") setSolverState("error");
      setMsg({ kind: "error", text: N === 2 ? (e as Error).message : `Solver error: ${(e as Error).message}` });
    } finally { setWorking(false); }
  };

  const doApplyAlg = () => {
    setMsg(null);
    try {
      const moves = parseNxn(n, algText).map((m) => ({ text: m.text }));
      if (!moves.length) return;
      setSeqFull({ label: "Algorithm", moves, startState: stateRef.current });
      enqueue(moves, "fwd");
    } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); }
  };

  // colour painting
  const centreOf = useMemo(() => { const c = new Set<number>(); if (n % 2) for (let f = 0; f < 6; f++) c.add(f * n * n + (n * n - 1) / 2); return c; }, [n]);
  const paintSticker = useCallback((i: number) => {
    if (!paint) return;
    if (nRef.current === 3 && centreOf.has(i)) { setMsg({ kind: "info", text: "Centres stay fixed and define each face's colour. Paint the other stickers." }); return; }
    const s = stateRef.current.slice(0, i) + paint + stateRef.current.slice(i + 1);
    setSeqFull(null); setScramble(null);
    hardReset(s);
  }, [paint, centreOf, hardReset, setSeqFull]);
  const clearToBlank = () => {
    const N = nRef.current;
    const s = [...solvedState(N)].map((c, i) => (N === 3 && centreOf.has(i) ? c : "X")).join("");
    setSeqFull(null); setScramble(null); setMsg(null); hardReset(s);
  };
  const counts = useMemo(() => { const c: Record<string, number> = {}; for (const ch of state) c[ch] = (c[ch] ?? 0) + 1; return c; }, [state]);
  const checkPaint = () => {
    const N = nRef.current, cur = stateRef.current;
    const bad = "URFDLB".split("").filter((f) => (counts[f] ?? 0) !== N * N);
    if (counts.X) { setMsg({ kind: "error", text: `${counts.X} sticker${counts.X > 1 ? "s are" : " is"} still blank.` }); return; }
    if (bad.length) { setMsg({ kind: "error", text: `Each colour must appear ${N * N} times: ${bad.map((f) => `${COLOR_NAMES[f].toLowerCase()} has ${counts[f] ?? 0}`).join(", ")}.` }); return; }
    if (N === 3) { const v = validateFacelets(normalizeToCenters(cur)); setMsg(v.ok ? { kind: "info", text: "This is a valid, solvable cube. Press Solve." } : { kind: "error", text: v.errors.join(" ") }); return; }
    if (N === 2) { try { solve2x2(cur); setMsg({ kind: "info", text: "This is a valid, solvable cube. Press Solve." }); } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); } return; }
    setMsg({ kind: "info", text: "Colour counts are right. Full validation and solving are available for 2×2 and 3×3." });
  };

  const canSolve = n <= 3;
  const stage = compact ? "h-[340px]" : "h-[380px] sm:h-[480px]";

  return (
    <div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-[1.4fr_1fr]"}`}>
      <div className={`card relative overflow-hidden ${compact ? "" : "lg:sticky lg:top-20 lg:self-start"}`}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
          <div role="radiogroup" aria-label="Cube size" className="flex rounded-sm border border-line">
            {SIZES.map((k) => (
              <button key={k} role="radio" aria-checked={n === k} onClick={() => changeSize(k)} disabled={busy || working}
                className={`min-w-11 min-h-11 sm:min-h-9 px-2 text-xs font-mono ${n === k ? "bg-fg text-bg" : "hover:bg-surface-2"}`}>{k}×{k}</button>
            ))}
          </div>
          <span className="ml-auto text-xs font-mono text-muted" aria-live="polite">Moves: <strong className="text-fg">{done.length}</strong></span>
          {solved ? <span className="chip !text-ok !border-ok"><CheckCircle2 size={12} /> Solved</span> : <span className="chip">{state.includes("X") ? "Painting" : "Scrambled"}</span>}
        </div>
        <div className="relative bg-surface-2/40">
          {solverState === "loading" && <span className="chip bg-surface absolute top-3 left-3 z-10"><Loader2 size={12} className="animate-spin" /> Building solver tables…</span>}
          <Cube3D key={n} ref={cube} size={n} initialState={state} speed={speed} onMoveDone={onMoveDone} onIdle={onIdle}
            onPaint={paint ? paintSticker : undefined} className={stage} />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-2 text-[11px] text-muted pointer-events-none">
            <span>{paint ? "Tap stickers to paint them" : "Drag a sticker to turn · drag the background to rotate"}</span>
            <button className="pointer-events-auto btn btn-ghost !min-h-9 !px-2 !py-1" onClick={() => cube.current?.resetView()} aria-label="Reset view"><Crosshair size={14} /></button>
          </div>
        </div>
        {done.length > 0 && !seq && (
          <div className="border-t border-line px-4 py-2 text-xs font-mono text-muted truncate" aria-label="Move history" data-testid="history">{done.slice(-40).join(" ")}</div>
        )}
        {seq && (
          <div className="border-t border-line p-4 bg-surface">
            <div className="text-xs text-muted mb-2 font-mono flex flex-wrap gap-x-3">{seq.label}<span>step {pos}/{seq.moves.length}</span></div>
            <ol className="flex flex-wrap gap-1 mb-3 max-h-28 overflow-y-auto" aria-label="Move timeline">
              <li><button onClick={() => jumpTo(0)} disabled={busy} className={`font-mono text-[13px] px-1.5 min-h-8 rounded-sm ${pos === 0 ? "bg-cube text-bg" : "text-muted hover:bg-surface-2"}`} aria-label="Go to start"><ChevronsLeft size={13} /></button></li>
              {seq.moves.map((m, i) => (
                <li key={i}><button onClick={() => jumpTo(i + 1)} disabled={busy} aria-label={`Go to after move ${i + 1}: ${m.text}`}
                  className={`font-mono text-[13px] px-1.5 min-h-8 rounded-sm ${i < pos ? "text-muted" : ""} ${i === pos ? "bg-cube text-bg" : "hover:bg-surface-2"}`}>{m.text}</button></li>
              ))}
            </ol>
            {offTrack && <p className="text-xs text-bad mb-2" role="status">The cube left this sequence. <button className="underline" onClick={() => jumpTo(pos)}>Return to step {pos}</button></p>}
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-ghost" onClick={() => jumpTo(0)} disabled={busy} aria-label="Restart"><RotateCcw size={16} /></button>
              <button className="btn btn-ghost" onClick={stepB} disabled={busy || pos === 0 || offTrack} aria-label="Step back"><SkipBack size={16} /></button>
              {busy ? <button className="btn btn-primary" onClick={pause}><Pause size={16} /> Pause</button>
                : <button className="btn btn-primary" onClick={play} disabled={pos >= seq.moves.length || offTrack}><Play size={16} /> Play</button>}
              <button className="btn btn-ghost" onClick={stepF} disabled={busy || pos >= seq.moves.length || offTrack} aria-label="Step forward"><SkipForward size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="card p-4 space-y-3" onMouseEnter={warmSolver} onFocus={warmSolver}>
          <div className="grid grid-cols-3 gap-2">
            <button className="btn btn-ghost" onClick={doScramble} disabled={busy || working}><Shuffle size={16} /> Scramble</button>
            <button className="btn btn-primary" onClick={doSolve} disabled={busy || working || !canSolve} title={canSolve ? undefined : "Solving is available for 2×2 and 3×3"}>{working && <Loader2 size={16} className="animate-spin" />} Solve</button>
            <button className="btn btn-ghost" onClick={doReset} disabled={working}><RotateCcw size={16} /> Reset</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={undo} disabled={busy || !done.length} aria-label="Undo (Ctrl+Z)"><Undo2 size={16} /> Undo</button>
            <button className="btn btn-ghost" onClick={redoMove} disabled={busy || !redo.length} aria-label="Redo (Ctrl+Shift+Z)"><Redo2 size={16} /> Redo</button>
          </div>
          {!canSolve && <p className="text-xs text-muted">Automatic solving is available for 2×2 and 3×3. Bigger cubes can be scrambled, turned and painted.</p>}
          {scramble && <div className="text-xs"><span className="eyebrow mr-2">Scramble</span><span className="font-mono break-words">{scramble}</span></div>}
          <div className="flex gap-2">
            <input className="input font-mono" placeholder={n === 3 ? "Algorithm, e.g. R U R' U' R' F R2 U' R' U' R U R' F'" : "Algorithm, e.g. R U R' U'"} value={algText} onChange={(e) => setAlgText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doApplyAlg()} aria-label="Algorithm" />
            <button className="btn btn-ghost" onClick={doApplyAlg} disabled={busy}>Apply</button>
          </div>
          {msg && <p className={`text-xs ${msg.kind === "error" ? "text-bad" : "text-muted"}`} role={msg.kind === "error" ? "alert" : "status"}>{msg.text}</p>}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="eyebrow">Paint a cube</h3>
            <button className={`btn ${paint ? "btn-primary" : "btn-ghost"} !py-1.5`} onClick={() => { setPaint(paint ? null : "U"); setMsg(null); }} aria-pressed={!!paint}><Paintbrush size={15} /> {paint ? "Done painting" : "Paint colours"}</button>
          </div>
          {paint ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Paint colour">
                {"URFDLBX".split("").map((c) => (
                  <button key={c} role="radio" aria-checked={paint === c} onClick={() => setPaint(c)} aria-label={c === "X" ? "Eraser (blank)" : COLOR_NAMES[c]}
                    className={`size-11 rounded-md border-2 grid place-items-center ${paint === c ? "border-fg ring-2 ring-offset-2 ring-offset-surface ring-fg" : "border-line"}`}
                    style={{ background: STICKER_COLORS_2D[c] }}>{c === "X" && <Eraser size={16} className="text-white" />}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-ghost !py-1.5" onClick={clearToBlank}>Start blank</button>
                <button className="btn btn-ghost !py-1.5" onClick={checkPaint}>Check colours</button>
              </div>
              <p className="text-xs text-muted">Copy your real cube: pick a colour, then tap stickers on the 3D cube or the net. {n === 3 && "Centres are fixed. "}Then check and solve.</p>
            </div>
          ) : <p className="text-xs text-muted">Enter the colours of a real cube by hand, then get a verified solution.</p>}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3 gap-2"><h3 className="eyebrow">Turn the cube</h3><span className="text-xs text-muted inline-flex items-center gap-1.5"><Keyboard size={13} aria-hidden /> <kbd className="font-mono">U R F D L B {n % 2 ? "M E S " : ""}X Y Z</kbd>, Shift for prime</span></div>
          {moveRows(n).map((row, ri) => (
            <div key={ri} className="grid grid-cols-6 gap-1.5 mb-1.5">
              {row.map((b) => (
                <div key={b} className="grid grid-rows-3 gap-1">
                  {SUFFIXES.map((s) => b + s).map((m) => (
                    <button key={m} onClick={() => manual(m)} disabled={!!paint} className="rounded-sm border border-line min-h-8 text-xs font-mono hover:border-fg hover:bg-surface-2 disabled:opacity-40">{m}</button>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <div className="flex items-center gap-3 mt-3 text-sm">
            <label htmlFor="speed" className="text-muted">Speed</label>
            <input id="speed" type="range" min={1} max={12} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="flex-1 accent-[var(--blue)]" />
            <span className="w-14 text-right font-mono text-xs">{speed} tps</span>
          </div>
        </div>

        {!compact && (
          <div className="card p-4">
            <h3 className="eyebrow mb-3">Cube net</h3>
            <CubeNet state={state} n={n} onSticker={paint ? paintSticker : undefined} label={paint ? "Cube net: tap a sticker to paint it" : "Cube net"} />
          </div>
        )}
      </div>
    </div>
  );
}
