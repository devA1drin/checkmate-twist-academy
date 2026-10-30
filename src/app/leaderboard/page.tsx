import { PageHeader } from "@/components/ui/page-header";
import { Leaderboard } from "./leaderboard";
export const metadata = { title: "Leaderboards" };
export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Community" title="Leaderboards" desc="Results from signed-in students who chose to appear here. Solve times come from the timer on this site." />
      <Leaderboard />
    </div>
  );
}
