import { PageHeader } from "@/components/ui/page-header";
import { AlgorithmLibrary } from "./library";

export const metadata = { title: "Algorithm Library" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Cube Academy" title="Algorithm library" desc="57 OLL and 21 PLL cases, plus 12 basic F2L inserts. A script runs every algorithm on a virtual cube and checks that it keeps F2L intact, solves its step, and matches a different case from every other entry. Diagrams are drawn from that cube state, yellow on top and green in front." />
      <AlgorithmLibrary />
    </div>
  );
}
