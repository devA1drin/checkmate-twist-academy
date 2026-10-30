import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { BattleLobby } from "./battle-lobby";
export const metadata = { title: "Cube battle" };
export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Play" section="none" title="Cube battle" desc="Race 2 to 4 people on the same scramble, round by round. Everyone times their own solve, so results are self-reported and labelled that way." />
      <Suspense><BattleLobby /></Suspense>
    </div>
  );
}
