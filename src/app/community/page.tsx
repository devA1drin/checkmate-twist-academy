import { PageHeader } from "@/components/ui/page-header";
import { Community } from "./community";
export const metadata = { title: "Community" };
export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow="Community" title="Discussion board" desc="Ask questions, share solves and games. Be kind — moderators can hide posts that break the rules." />
      <Community />
    </div>
  );
}
