import { PageHeader } from "@/components/ui/page-header";
import { ToolGrid } from "@/components/ui/tool-grid";
import { Curriculum } from "@/components/lesson/curriculum";
import { CUBE_LESSONS } from "@/data/cube-lessons";

export const metadata = { title: "Rubik's Cube Academy" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Rubik's Cube" title="The Rubik's Cube, from first solve to CFOP" desc="Eleven lessons: notation and the layer-by-layer method for your first solve, then CFOP (cross, F2L, 57 OLL and 21 PLL cases), with Roux, ZZ, Petrus and other puzzles after that. Every algorithm is checked on a virtual cube and opens in the 3D simulator." />
      <ToolGrid tools={[
        { href: "/cube/simulator", title: "3D simulator", desc: "Turn, scramble, and auto-solve with animation." },
        { href: "/cube/algorithms", title: "Algorithm library", desc: "57 OLL · 21 PLL · F2L — searchable." },
        { href: "/cube/timer", title: "Speed timer", desc: "WCA scrambles, inspection, ao5/ao12." },
        { href: "/cube/scanner", title: "Camera scanner", desc: "Scan six faces, validate, and solve." },
      ]} />
      <Curriculum lessons={CUBE_LESSONS} kind="cube" />
    </div>
  );
}
