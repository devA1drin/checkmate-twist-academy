import { Box, BookOpen, Timer, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ToolGrid } from "@/components/ui/tool-grid";
import { Curriculum } from "@/components/lesson/curriculum";
import { CUBE_LESSONS } from "@/data/cube-lessons";

export const metadata = { title: "Rubik's Cube Academy" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Rubik's Cube Academy" title="Solve it, then solve it fast" desc="Layer-by-layer for your first solve, then CFOP (cross, F2L, 57 OLL, 21 PLL), Roux, ZZ, Petrus and other puzzles. Every algorithm is verified against our cube model and can be played on the 3D simulator." />
      <ToolGrid tools={[
        { href: "/cube/simulator", title: "3D simulator", desc: "Turn, scramble, and auto-solve with animation.", icon: Box },
        { href: "/cube/algorithms", title: "Algorithm library", desc: "57 OLL · 21 PLL · F2L — searchable.", icon: BookOpen },
        { href: "/cube/timer", title: "Speed timer", desc: "WCA scrambles, inspection, ao5/ao12.", icon: Timer },
        { href: "/cube/scanner", title: "Camera scanner", desc: "Scan six faces, validate, and solve.", icon: ScanLine },
      ]} />
      <Curriculum lessons={CUBE_LESSONS} kind="cube" />
    </div>
  );
}
