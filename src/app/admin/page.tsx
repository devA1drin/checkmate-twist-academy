import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "./admin-panel";
export const metadata = { title: "Admin", robots: { index: false } };
export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="Admin" title="Admin tools" desc="Usage statistics, user roles and community moderation. Access is enforced by the database (row-level security and admin-only functions), not just by hiding this page." />
      <AdminPanel />
    </div>
  );
}
