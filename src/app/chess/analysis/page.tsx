import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AnalysisBoard } from "./analysis-board";
export const metadata = { title: "Analysis Board" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Chess Academy" title="Analysis Board" desc="Import a FEN or PGN, explore moves, and get live evaluations from Stockfish 19 running entirely in your browser (WebAssembly) — no positions are sent to any server." />
      <Suspense><AnalysisBoard /></Suspense>
    </div>
  );
}
