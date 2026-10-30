"use client";
import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import type { CubeHandle } from "@/components/cube/cube3d";
import { applyAlg, invertAlg, parseAlg, SOLVED } from "@/lib/cube/model";

const Cube3D = dynamic(() => import("@/components/cube/cube3d").then((m) => m.Cube3D), { ssr: false, loading: () => <div className="h-full grid place-items-center text-sm text-muted">Loading 3D cube…</div> });
const T = "R U R' U' R' F R2 U' R' U' R U R' F'";

/** The actual simulator component, set to the T-perm case. Play runs the algorithm move by move. */
export function TPermCube() {
  const cube = useRef<CubeHandle>(null);
  const start = useMemo(() => applyAlg(SOLVED, invertAlg(T)), []);
  const moves = useMemo(() => T.split(" "), []);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const play = () => {
    if (!cube.current || running) return;
    if (step >= moves.length) { cube.current.reset(start); setStep(0); }
    setRunning(true);
    cube.current.enqueue(parseAlg(T));
  };
  const reset = () => { cube.current?.reset(start); setStep(0); setRunning(false); };
  return (
    <div>
      <div className="h-[300px] sm:h-[360px] border border-line bg-surface">
        <Cube3D ref={cube} initialState={start} speed={3} className="h-full w-full"
          onMoveDone={() => setStep((s) => s + 1)} onIdle={() => setRunning(false)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={play} disabled={running} className="btn btn-primary !py-1.5">{step >= moves.length ? "Play again" : "Play T-perm"}</button>
        <button onClick={reset} className="btn btn-ghost !py-1.5">Reset</button>
        <span className="text-xs text-muted ml-1">Drag to turn the view.</span>
      </div>
      <p className="mt-3 font-mono text-sm leading-7" aria-label="T-perm algorithm">
        {moves.map((m, i) => (
          <span key={i} className={`mr-2 ${i < step ? "text-muted" : ""} ${i === step && running ? "bg-cube text-bg px-1" : ""}`}>{m}</span>
        ))}
      </p>
    </div>
  );
}
