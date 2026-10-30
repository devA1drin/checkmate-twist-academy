import { PageHeader } from "@/components/ui/page-header";
import { VideoCenter } from "./video-center";
export const metadata = { title: "Video Tutorial Center" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Practice" title="Video Tutorial Center" desc="Hand-picked lessons from established creators. Every video ID is checked against YouTube's oEmbed endpoint (npm run verify:videos) so removed or non-embeddable videos are dropped. Videos load from youtube-nocookie.com only after you press play." />
      <VideoCenter />
    </div>
  );
}
