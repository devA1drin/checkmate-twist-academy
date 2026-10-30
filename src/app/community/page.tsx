import { PageHeader } from "@/components/ui/page-header";
import { Community } from "./community";
export const metadata = { title: "Community" };
export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Community" title="Discussion" desc="Questions, games, solves. Be kind: moderators can hide posts that break that rule." />
      <Community />
    </div>
  );
}
