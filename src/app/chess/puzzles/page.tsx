import { PageHeader } from "@/components/ui/page-header";
import { PuzzleTrainer } from "./trainer";
export const metadata = { title: "Tactics Puzzles" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Chess Academy" title="Tactics Puzzles" desc="236 real puzzles from the Lichess puzzle database (CC0), selected for high popularity and many plays, spread across 16 themes and ratings from ~600 to ~2500. Every solution line was replayed and validated with chess.js." />
      <PuzzleTrainer />
    </div>
  );
}
