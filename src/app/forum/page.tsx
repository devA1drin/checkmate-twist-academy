import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Forum } from "./forum";
export const metadata = { title: "Forum" };
export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Community" title="Forum" desc="Questions, games and solves. Be kind; moderators hide posts that aren't." section="none" />
      <Suspense><Forum /></Suspense>
    </div>
  );
}
