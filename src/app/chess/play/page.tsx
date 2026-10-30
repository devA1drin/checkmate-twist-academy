import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PlayVsEngine } from "./play";
export const metadata = { title: "Play vs Stockfish" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Chess Academy" title="Play vs Stockfish" desc="Choose a strength level (1–8) and a color. Lower levels use Stockfish's built-in Skill Level with shallow search, so they really do make human-like mistakes. The engine runs locally in your browser." />
      <Suspense><PlayVsEngine /></Suspense>
    </div>
  );
}
