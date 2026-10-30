import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Lobby } from "./lobby";
export const metadata = { title: "Play online" };
export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Play" section="none" title="Play chess online" desc="Live games against people. Moves are checked on the server and clocks are kept by the server, so both players see the same time." />
      <Suspense><Lobby /></Suspense>
    </div>
  );
}
