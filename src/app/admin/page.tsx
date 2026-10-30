import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "./admin-panel";
export const metadata = { title: "Admin", robots: { index: false } };
export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Admin" title="Admin" desc="Usage numbers, user roles and post moderation. The database enforces these permissions, not just this page." />
      <AdminPanel />
    </div>
  );
}
