import { PageHeader } from "@/components/ui/page-header";
import { Daily } from "./daily";
export const metadata = { title: "Daily puzzle and scramble" };
export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Practice" section="none" title="Daily puzzle and scramble" desc="One chess puzzle and one cube scramble, the same for everyone. They change at midnight UTC (8:00 a.m. in Manila)." />
      <Daily />
    </div>
  );
}
