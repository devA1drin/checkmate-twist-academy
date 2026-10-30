import { Puzzle, Swords, Cpu, Camera } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ToolGrid } from "@/components/ui/tool-grid";
import { Curriculum } from "@/components/lesson/curriculum";
import { CHESS_LESSONS } from "@/data/chess-lessons";

export const metadata = { title: "Chess Academy" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Chess Academy" title="From first moves to master technique" desc="A structured path through rules, openings, tactics, middlegame strategy and endgames. Every board is interactive, every line is validated with chess.js, and key endgame verdicts are confirmed with Stockfish." />
      <ToolGrid tools={[
        { href: "/chess/puzzles", title: "Tactics puzzles", desc: "Real Lichess puzzles (CC0) by theme and rating.", icon: Puzzle },
        { href: "/chess/play", title: "Play vs Stockfish", desc: "Eight strength levels, any starting position.", icon: Swords },
        { href: "/chess/analysis", title: "Analysis board", desc: "FEN/PGN import with live Stockfish evaluation.", icon: Cpu },
        { href: "/chess/scanner", title: "Board from photo", desc: "Set up a position over your photo, then analyse.", icon: Camera },
      ]} />
      <Curriculum lessons={CHESS_LESSONS} kind="chess" />
    </div>
  );
}
