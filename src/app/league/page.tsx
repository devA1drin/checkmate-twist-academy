import { PageHeader } from "@/components/ui/page-header";
import { League } from "./league";
export const metadata = { title: "Weekly league" };
export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Community" section="none" title="Weekly league" desc="Earn XP by learning and playing. Your league depends on this week's XP, and the week restarts every Monday at 00:00 UTC (8:00 a.m. in Manila)." />
      <League />
    </div>
  );
}
