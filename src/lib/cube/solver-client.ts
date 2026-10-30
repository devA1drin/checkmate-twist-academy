"use client";
/** Promise wrapper around the cube solver Web Worker (public/workers/cube-solver.js). */
type Pending = { resolve: (v: Record<string, string>) => void; reject: (e: Error) => void };
let worker: Worker | null = null;
let readyPromise: Promise<number> | null = null;
const pending = new Map<number, Pending>();
let nextId = 1;

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker("/workers/cube-solver.js");
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data;
    if (m.type === "result" || m.type === "error") {
      const p = pending.get(m.id);
      if (!p) return;
      pending.delete(m.id);
      if (m.type === "error") p.reject(new Error(m.error));
      else p.resolve(m);
    }
  };
  worker.onerror = (e) => { pending.forEach((p) => p.reject(new Error(e.message || "Solver worker failed"))); pending.clear(); };
  return worker;
}

/** Builds the pruning tables (~1–4 s). Resolves with init time in ms. */
export function initSolver(): Promise<number> {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve, reject) => {
    const w = getWorker();
    const onMsg = (e: MessageEvent) => { if (e.data.type === "ready") { w.removeEventListener("message", onMsg); resolve(e.data.ms); } };
    w.addEventListener("message", onMsg);
    w.addEventListener("error", (e) => reject(new Error(e.message)), { once: true });
    w.postMessage({ type: "init" });
  });
  return readyPromise;
}

function call(msg: Record<string, unknown>): Promise<Record<string, string>> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...msg, id });
  });
}

/** Solve a valid facelet string (URFDLB). Returns a move sequence (≤ ~22 moves). */
export async function solveFacelets(facelets: string): Promise<string> {
  await initSolver();
  const r = await call({ type: "solve", facelets });
  return r.solution.trim();
}

/** WCA-style random-state scramble: a uniformly random cube state, scramble = inverse of its solution. */
export async function randomStateScramble(): Promise<{ scramble: string; state: string }> {
  await initSolver();
  const r = await call({ type: "scramble" });
  return { scramble: r.scramble, state: r.state };
}
