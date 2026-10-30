import { PageHeader } from "@/components/ui/page-header";
import { VideoCenter } from "./video-center";
export const metadata = { title: "Video Tutorial Center" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Practice" title="Video lessons" desc="Sixteen tutorials from J Perm, GothamChess, Daniel Naroditsky and other teachers we trust. A script checks every video against YouTube before release. Nothing loads from YouTube until you press play." />
      <VideoCenter />
    </div>
  );
}
