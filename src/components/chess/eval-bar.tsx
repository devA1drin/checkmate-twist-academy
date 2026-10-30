import type { EngineLine } from "@/lib/chess/engine";
import { formatScore } from "@/lib/chess/engine";
/** Vertical evaluation bar from White's perspective. */
export function EvalBar({ line, orientation = "white" }: { line?: EngineLine; orientation?: "white" | "black" }) {
  let pct = 50;
  if (line?.mate !== undefined) pct = line.mate > 0 ? 100 : 0;
  else if (line?.scoreCp !== undefined) pct = 50 + 50 * (2 / (1 + Math.exp(-line.scoreCp / 400)) - 1);
  const flip = orientation === "black";
  return (
    <div className="relative w-4 sm:w-5 self-stretch rounded-md overflow-hidden bg-[#1a1f33] border border-line" title={`Evaluation ${formatScore(line)}`} aria-label={`Evaluation ${formatScore(line)}`}>
      <div className="absolute inset-x-0 bg-[#eef2ff] transition-all duration-500" style={flip ? { top: 0, height: `${pct}%` } : { bottom: 0, height: `${pct}%` }} />
      <div className={`absolute inset-x-0 text-[9px] font-bold text-center ${pct >= 50 !== flip ? "bottom-1 text-[#1a1f33]" : "top-1 text-white"}`}>{line ? formatScore(line).replace("+", "") : ""}</div>
    </div>
  );
}
