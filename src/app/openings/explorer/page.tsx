import { PageHeader } from "@/components/ui/page-header";
import { Explorer } from "./explorer";
export const metadata = { title: "Openings explorer", description: "Search 3,865 named chess openings by name, ECO code, moves or position." };

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Chess" title="Openings explorer" desc="Every named opening in the lichess-org/chess-openings list, 3,865 in all. Search by name, ECO code or moves, or play moves on the board to see which openings start from that position. Openings with a kit link to its lessons." />
      <Explorer />
    </div>
  );
}
