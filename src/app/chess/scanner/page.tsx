import { PageHeader } from "@/components/ui/page-header";
import { BoardScanner } from "./board-scanner";
export const metadata = { title: "Chessboard from Photo" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Chess Academy" title="Chessboard from Photo or Camera" desc="Take a snapshot or upload a photo of a real board, line the grid up with it, and set the pieces by tapping squares on top of your photo. Then send the position to Stockfish." />
      <BoardScanner />
    </div>
  );
}
