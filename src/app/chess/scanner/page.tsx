import { PageHeader } from "@/components/ui/page-header";
import { BoardScanner } from "./board-scanner";
export const metadata = { title: "Chessboard from Photo" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Chess · Board from photo" title="Set up a position from a photo" desc="Upload a photo or take one with your camera, line the grid up with the board, then tap squares to place the pieces. The app does not recognise pieces for you. When the position is legal, open it in the analysis board." />
      <BoardScanner />
    </div>
  );
}
