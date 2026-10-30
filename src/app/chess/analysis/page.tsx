import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AnalysisBoard } from "./analysis-board";
export const metadata = { title: "Analysis Board" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Chess · Analysis" title="Analysis board" desc="Paste a FEN or PGN, or just move the pieces. Stockfish 19 runs on this device and shows up to five lines at once. Positions are not sent anywhere." />
      <Suspense><AnalysisBoard /></Suspense>
    </div>
  );
}
