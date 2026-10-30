"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/progress-types";

export type Penalty = null | "+2" | "DNF";
type Phase = "idle" | "inspecting" | "armed" | "running" | "done";
const HOLD_MS = 300;

/**
  Hold-to-start solve timer: hold space (or press and hold the pad) until it turns green, release to start,
  press again to stop. Optional 15 s WCA inspection (+2 after 15 s, DNF after 17 s).
*/
export function SolveTimer({ inspection = true, disabled = false, onDone, resetKey }: {
  inspection?: boolean; disabled?: boolean; resetKey?: string | number;
  onDone: (ms: number, penalty: Penalty) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [display, setDisplay] = useState(0);
  const [left, setLeft] = useState(15);
  const [ready, setReady] = useState(false);
  const start = useRef(0), inspectAt = useRef(0), hold = useRef<ReturnType<typeof setTimeout> | null>(null), raf = useRef(0), pen = useRef<Penalty>(null);
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const readyRef = useRef(ready); readyRef.current = ready;
  const doneRef = useRef(onDone); doneRef.current = onDone;

  useEffect(() => { setPhase("idle"); setDisplay(0); setLeft(15); }, [resetKey]);
  useEffect(() => {
    if (phase === "running") {
      const tick = () => { setDisplay(performance.now() - start.current); raf.current = requestAnimationFrame(tick); };
      raf.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf.current);
    }
    if (phase === "inspecting" || (phase === "armed" && inspectAt.current)) {
      const t = setInterval(() => setLeft(15 - (performance.now() - inspectAt.current) / 1000), 100); return () => clearInterval(t);
    }
  }, [phase]);

  const press = useCallback(() => {
    const p = phaseRef.current;
    if (disabled || p === "done") return;
    if (p === "running") {
      const t = Math.round(performance.now() - start.current);
      setDisplay(t); setPhase("done"); doneRef.current(t, pen.current); return;
    }
    if (p === "idle" && inspection) { inspectAt.current = performance.now(); setLeft(15); setPhase("inspecting"); return; }
    if (p === "idle" || p === "inspecting") {
      if (p === "idle") inspectAt.current = 0;
      setPhase("armed"); setReady(false); hold.current = setTimeout(() => setReady(true), HOLD_MS);
    }
  }, [disabled, inspection]);
  const release = useCallback(() => {
    if (phaseRef.current !== "armed") return;
    if (hold.current) clearTimeout(hold.current);
    if (!readyRef.current) { setPhase(inspectAt.current ? "inspecting" : "idle"); return; }
    pen.current = null;
    if (inspectAt.current) { const used = (performance.now() - inspectAt.current) / 1000; pen.current = used > 17 ? "DNF" : used > 15 ? "+2" : null; }
    start.current = performance.now(); setDisplay(0); setReady(false); setPhase("running");
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code !== "Space" || e.repeat) return; const el = e.target as HTMLElement; if (el.closest("input, textarea, select, button, a")) return; e.preventDefault(); press(); };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); release(); } };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [press, release]);

  const big = phase === "inspecting" || (phase === "armed" && inspectAt.current) ? (left > 0 ? Math.ceil(left).toString() : left > -2 ? "+2" : "DNF") : formatTime(display);
  const color = phase === "armed" ? (ready ? "text-ok" : "text-bad") : phase === "inspecting" ? "text-warn" : "";
  const hint = phase === "done" ? "Done" : disabled ? "Waiting…" : phase === "idle" ? (inspection ? "Press space or tap to start inspection" : "Hold space or press and hold, release to start")
    : phase === "inspecting" ? "Hold, then release to start the solve" : phase === "armed" ? (ready ? "Release to start" : "Keep holding…") : phase === "running" ? "Press space or tap to stop" : "Done";

  return (
    <div role="timer" aria-live="off"
      onPointerDown={(e) => { if (e.pointerType !== "mouse" || e.button === 0) { e.preventDefault(); press(); } }}
      onPointerUp={release} onPointerCancel={release}
      className={`select-none touch-none rounded border border-line py-10 text-center cursor-pointer ${disabled ? "opacity-50" : ""}`}>
      <div className={`font-mono text-6xl sm:text-7xl tabular-nums ${color}`}>{big}</div>
      <p className="text-sm text-muted mt-3">{hint}</p>
    </div>
  );
}
