"use client";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { CubeSimulator } from "@/components/cube/cube-simulator";
import { ALL_ALGS } from "@/data/algorithms";
import { applyAlg, invertAlg, parseAlg, SOLVED } from "@/lib/cube/model";

export function SimulatorFromQuery() {
  const q = useSearchParams();
  const caseId = q.get("case");
  const alg = q.get("alg");
  const apply = q.get("mode") === "apply"; // play the algorithm on a solved cube instead of setting up its case
  const setup = useMemo(() => {
    try {
      const c = caseId ? ALL_ALGS.find((a) => a.id === caseId) : null;
      const text = c?.alg ?? alg;
      if (!text) return null;
      // hold yellow on top (z2) like standard last-layer diagrams, then set up the case
      const held = applyAlg(SOLVED, "z2");
      const start = apply ? held : applyAlg(held, invertAlg(text));
      return { start, seq: { label: c ? `${c.name}: ${c.alg}` : apply ? `Apply to solved cube: ${text}` : `Algorithm: ${text}`, moves: parseAlg(text), startState: start } };
    } catch { return null; }
  }, [caseId, alg, apply]);
  return <CubeSimulator key={`${caseId ?? alg ?? "free"}-${apply}`} initialState={setup?.start} initialSequence={setup?.seq} />;
}
