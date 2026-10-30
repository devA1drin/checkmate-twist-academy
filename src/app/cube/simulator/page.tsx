import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SimulatorFromQuery } from "./simulator-client";

export const metadata = { title: "3D Cube Simulator" };

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Cube · Simulator" title="3D cube simulator" desc="Turn the cube with the buttons or your keyboard, scramble it from a random state, or type an algorithm. Press Solve and a two-phase solver finds a solution of about 20 moves that you can step through." />
      <Suspense fallback={null}><SimulatorFromQuery /></Suspense>
    </div>
  );
}
