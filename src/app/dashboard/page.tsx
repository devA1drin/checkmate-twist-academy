import { PageHeader } from "@/components/ui/page-header";
import { Dashboard } from "./dashboard";
export const metadata = { title: "Dashboard" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Your progress" title="Dashboard" />
      <Dashboard />
    </div>
  );
}
