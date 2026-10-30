import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SimulatorFromQuery } from "./simulator-client";

export const metadata = { title: "3D Cube Simulator" };

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Cube Academy" title="Interactive 3D Cube Simulator" desc="Turn with buttons or your keyboard, generate WCA-style random-state scrambles, apply any algorithm, and let the Kociemba two-phase solver find a solution you can step through. Drag to orbit." />
      <Suspense fallback={null}><SimulatorFromQuery /></Suspense>
    </div>
  );
}
