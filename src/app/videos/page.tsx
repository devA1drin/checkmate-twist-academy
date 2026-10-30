import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { VideoCenter } from "./video-center";
import videos from "@/data/videos.json";
export const metadata = { title: "Videos" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Learn" section="none" title="Videos" desc={`${videos.length} lessons from GothamChess, Hikaru Nakamura, Magnus Carlsen, ChessPage1, Daniel Naroditsky, Hanging Pawns, J Perm and others. A script checks every video against YouTube before release. Nothing loads from YouTube until you press play.`} />
      <Suspense><VideoCenter /></Suspense>
    </div>
  );
}
