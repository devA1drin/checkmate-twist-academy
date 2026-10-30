import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PlayVsEngine } from "./play";
export const metadata = { title: "Play vs Stockfish" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Chess · Play" title="Play Stockfish" desc="Pick a level from 1 to 8 and a colour. The lower levels use Stockfish's skill setting with a shallow search, so they make real mistakes for you to punish." />
      <Suspense><PlayVsEngine /></Suspense>
    </div>
  );
}
