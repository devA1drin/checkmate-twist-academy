import { PageHeader } from "@/components/ui/page-header";
import { ToolGrid } from "@/components/ui/tool-grid";
import { Curriculum } from "@/components/lesson/curriculum";
import { CHESS_LESSONS } from "@/data/chess-lessons";

export const metadata = { title: "Chess Academy" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Chess" title="Chess, from the rules to rook endgames" desc="Thirteen lessons in order: how the pieces move, opening principles and real move orders, tactical patterns, pawn structure and plans, then the endgames every player needs. Each board is interactive and every move in the text has been checked with chess.js." />
      <ToolGrid tools={[
        { href: "/chess/puzzles", title: "Tactics puzzles", desc: "Real Lichess puzzles (CC0) by theme and rating." },
        { href: "/chess/play", title: "Play vs Stockfish", desc: "Eight strength levels, any starting position." },
        { href: "/chess/analysis", title: "Analysis board", desc: "FEN/PGN import with live Stockfish evaluation." },
        { href: "/chess/scanner", title: "Board from photo", desc: "Set up a position over your photo, then analyse." },
      ]} />
      <Curriculum lessons={CHESS_LESSONS} kind="chess" />
    </div>
  );
}
