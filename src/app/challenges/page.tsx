import { PageHeader } from "@/components/ui/page-header";
import { Challenges } from "./challenges";
export const metadata = { title: "Challenges" };
export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Practice" section="none" title="Challenges" desc="Set a goal with a deadline, share it, and see who finishes. Progress is counted by the server from what you actually do on the site." />
      <Challenges />
    </div>
  );
}
