import { PageHeader } from "@/components/ui/page-header";
import { Leaderboard } from "./leaderboard";
export const metadata = { title: "Leaderboards" };
export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow="Community" title="Leaderboards" desc="Real results from signed-in students who opted in. Solve times are self-reported from the in-app timer." />
      <Leaderboard />
    </div>
  );
}
