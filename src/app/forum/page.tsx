import { PageHeader } from "@/components/ui/page-header";
import { Community } from "./forum";
export const metadata = { title: "Forum" };
export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Community" title="Forum" desc="Questions, games, solves. Be kind: moderators can hide posts that break that rule." section="none" />
      <Community />
    </div>
  );
}
