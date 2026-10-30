import { PageHeader } from "@/components/ui/page-header";
import { PuzzleTrainer } from "./trainer";
export const metadata = { title: "Tactics Puzzles" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Chess · Tactics" title="Puzzles" desc="236 puzzles from the Lichess database (CC0), chosen from the most-played and best-rated, covering 16 themes and ratings from about 600 to 2500. Find the best move; the opponent replies automatically." />
      <PuzzleTrainer />
    </div>
  );
}
