"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Trash2, Eye } from "lucide-react";
import { CubeNet } from "@/components/cube/cube-net";
import { applyAlg, randomMoveScramble, SOLVED } from "@/lib/cube/model";
import { randomStateScramble } from "@/lib/cube/solver-client";
import { useProgress } from "@/lib/progress-context";
import { averageOf, effectiveTime, formatTime, type Penalty, type Solve } from "@/lib/progress-types";

type Phase = "idle" | "inspecting" | "armed" | "running";
const HOLD_MS = 300;

export function CubeTimer() {
  const { data, addSolve, updateSolve, deleteSolve } = useProgress();
  const solves = data.solves;
  const [scramble, setScramble] = useState<{ text: string; kind: "random-state" | "random-move" } | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [display, setDisplay] = useState(0);
  const [inspection, setInspection] = useState(true);
  const [inspectLeft, setInspectLeft] = useState(15);
  const [ready, setReady] = useState(false); // held long enough
  const startRef = useRef(0), inspectStart = useRef(0), holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null), raf = useRef(0);
  const penaltyRef = useRef<Penalty>(null);
  const phaseRef = useRef<Phase>("idle"); phaseRef.current = phase;
  const readyRef = useRef(false); readyRef.current = ready;

  const newScramble = useCallback(async () => {
    setScramble(null);
    try {
      const r = await randomStateScramble();
      setScramble({ text: r.scramble, kind: "random-state" });
    } catch {
      setScramble({ text: randomMoveScramble(25), kind: "random-move" });
    }
  }, []);
  useEffect(() => { newScramble(); }, [newScramble]);

  // timers
  useEffect(() => {
    if (phase === "running") {
      const tick = () => { setDisplay(performance.now() - startRef.current); raf.current = requestAnimationFrame(tick); };
      raf.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf.current);
    }
    if (phase === "inspecting" || (phase === "armed" && inspectStart.current)) {
      const id = setInterval(() => setInspectLeft(15 - (performance.now() - inspectStart.current) / 1000), 100);
      return () => clearInterval(id);
    }
  }, [phase]);

  const finish = useCallback(() => {
    const t = Math.round(performance.now() - startRef.current);
    setDisplay(t); setPhase("idle");
    if (scramble) addSolve({ id: crypto.randomUUID(), timeMs: t, penalty: penaltyRef.current, scramble: scramble.text, at: new Date().toISOString() });
    newScramble();
  }, [scramble, addSolve, newScramble]);

  const press = useCallback(() => {
    const p = phaseRef.current;
    if (p === "running") { finish(); return; }
    if (!scramble) return;
    if (p === "idle" && inspection) { inspectStart.current = performance.now(); setInspectLeft(15); setPhase("inspecting"); return; }
    if (p === "idle" || p === "inspecting") {
      if (p === "idle") inspectStart.current = 0;
      setPhase("armed"); setReady(false);
      holdTimer.current = setTimeout(() => setReady(true), HOLD_MS);
    }
  }, [finish, inspection, scramble]);

  const release = useCallback(() => {
    if (phaseRef.current !== "armed") return;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (!readyRef.current) { setPhase(inspectStart.current ? "inspecting" : "idle"); return; }
    // WCA 10e: over 15 s inspection = +2, over 17 s = DNF
    penaltyRef.current = null;
    if (inspectStart.current) {
      const used = (performance.now() - inspectStart.current) / 1000;
      if (used > 17) penaltyRef.current = "DNF"; else if (used > 15) penaltyRef.current = "+2";
    }
    startRef.current = performance.now(); setDisplay(0); setReady(false); setPhase("running");
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (phaseRef.current === "running") { e.preventDefault(); press(); return; }
      if (e.code === "Space") { e.preventDefault(); if (!e.repeat) press(); }
      if (e.code === "Escape" && phaseRef.current !== "idle") { setPhase("idle"); inspectStart.current = 0; }
    };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); release(); } };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [press, release]);

  const stats = useMemo(() => {
    const valid = solves.filter((s) => s.penalty !== "DNF").map(effectiveTime);
    return {
      best: valid.length ? Math.min(...valid) : null,
      ao5: averageOf(solves, 5), ao12: averageOf(solves, 12),
      mean: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null,
      count: solves.length,
    };
  }, [solves]);

  const state = scramble ? applyAlg(SOLVED, scramble.text) : SOLVED;
  const inspectLabel = inspectLeft > 0 ? Math.ceil(inspectLeft).toString() : inspectLeft > -2 ? "+2" : "DNF";
  const color = phase === "armed" ? (ready ? "text-emerald-400" : "text-red-400") : phase === "inspecting" ? "text-amber-400" : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs text-muted uppercase tracking-wider">Scramble {scramble?.kind === "random-move" && <span className="text-amber-400 normal-case">(random-move fallback — solver unavailable)</span>}</span>
            <button className="btn btn-ghost !py-1" onClick={newScramble} disabled={phase !== "idle"}><RefreshCw size={14} /> New</button>
          </div>
          <div className="font-mono text-lg sm:text-xl leading-relaxed min-h-[3.5rem]">{scramble?.text ?? <span className="text-muted text-base">Generating random-state scramble…</span>}</div>
        </div>
        <div role="button" tabIndex={0} aria-label="Timer: hold space or touch and hold, release to start, press to stop"
          className="card glow select-none touch-none grid place-items-center py-16 sm:py-24 cursor-pointer"
          onTouchStart={(e) => { e.preventDefault(); press(); }} onTouchEnd={(e) => { e.preventDefault(); release(); }}
          onMouseDown={press} onMouseUp={release}>
          <div className={`font-mono font-bold tabular-nums text-6xl sm:text-8xl ${color}`}>
            {phase === "inspecting" || (phase === "armed" && inspectStart.current) ? inspectLabel : formatTime(display)}
          </div>
          <div className="text-sm text-muted mt-4 text-center px-4">
            {phase === "idle" && (inspection ? "Press space / tap to start inspection" : "Hold space / touch, release to start")}
            {phase === "inspecting" && "Inspecting — hold space / touch, release to start"}
            {phase === "armed" && (ready ? "Release to start" : "Keep holding…")}
            {phase === "running" && "Press any key / tap to stop"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={inspection} onChange={(e) => setInspection(e.target.checked)} disabled={phase !== "idle"} /> <Eye size={15} /> WCA inspection (15 s)</label>
        </div>
      </div>
      <div className="space-y-4">
        <div className="card p-4"><div className="text-xs text-muted mb-2">Scrambled state (white top, green front)</div><div className="flex justify-center"><CubeNet state={state} size={13} /></div></div>
        <div className="card p-4 grid grid-cols-2 gap-3 text-sm">
          {[["Best", stats.best], ["Mean", stats.mean], ["ao5", stats.ao5], ["ao12", stats.ao12]].map(([k, v]) => (
            <div key={k as string}><div className="text-xs text-muted">{k}</div><div className="font-mono text-lg font-semibold">{formatTime(v as number | null)}</div></div>
          ))}
          <div className="col-span-2 text-xs text-muted">{stats.count} solves recorded</div>
        </div>
        <div className="card p-2 max-h-80 overflow-auto">
          {solves.length === 0 ? <p className="text-sm text-muted p-3">Your solves will appear here.</p> : (
            <table className="w-full text-sm"><tbody>
              {[...solves].reverse().map((s: Solve, i) => (
                <tr key={s.id} className="border-b border-line/60 last:border-0" title={s.scramble}>
                  <td className="py-1.5 px-2 text-muted text-xs">{solves.length - i}</td>
                  <td className="font-mono">{s.penalty === "DNF" ? `DNF (${formatTime(s.timeMs)})` : formatTime(effectiveTime(s))}{s.penalty === "+2" && <span className="text-amber-400 text-xs">+</span>}</td>
                  <td className="text-right whitespace-nowrap">
                    <button className={`text-xs px-1.5 rounded ${s.penalty === "+2" ? "bg-amber-400/20 text-amber-400" : "text-muted hover:text-fg"}`} onClick={() => updateSolve(s.id, { penalty: s.penalty === "+2" ? null : "+2" })}>+2</button>
                    <button className={`text-xs px-1.5 rounded ${s.penalty === "DNF" ? "bg-red-400/20 text-red-400" : "text-muted hover:text-fg"}`} onClick={() => updateSolve(s.id, { penalty: s.penalty === "DNF" ? null : "DNF" })}>DNF</button>
                    <button className="text-muted hover:text-red-400 px-1" aria-label="Delete solve" onClick={() => deleteSolve(s.id)}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
      </div>
    </div>
  );
}
