import { PageHeader } from "@/components/ui/page-header";
import { AlgorithmLibrary } from "./library";

export const metadata = { title: "Algorithm Library" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Cube Academy" title="Algorithm Library" desc="All 57 OLL and 21 PLL cases plus basic F2L inserts. Every algorithm is machine-checked against our cube model (F2L preserved, correct step solved, every case distinct), and every diagram is generated from the actual cube state the algorithm solves — shown yellow-on-top, green in front." />
      <AlgorithmLibrary />
    </div>
  );
}
