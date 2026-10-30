import { PageHeader } from "@/components/ui/page-header";
import { CubeTimer } from "./cube-timer";
export const metadata = { title: "Speedcubing Timer" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Cube · Timer" title="Timer" desc="Each scramble is a uniformly random cube state, as in WCA competitions. Hold space (or touch) to start, with optional 15-second inspection, automatic +2 and DNF, and ao5/ao12 averages that drop the best and worst times." />
      <CubeTimer />
    </div>
  );
}
