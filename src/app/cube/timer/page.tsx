import { PageHeader } from "@/components/ui/page-header";
import { CubeTimer } from "./cube-timer";
export const metadata = { title: "Speedcubing Timer" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Practice" title="Speedcubing Timer" desc="Random-state scrambles (a uniformly random cube, solved by the two-phase solver and inverted — the same principle the WCA uses), optional 15-second WCA inspection with automatic +2/DNF, and ao5/ao12 computed by dropping the best and worst times." />
      <CubeTimer />
    </div>
  );
}
