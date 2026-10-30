import { PageHeader } from "@/components/ui/page-header";
import { AuthPanel } from "./auth-panel";
export const metadata = { title: "Sign in" };
export default function Page() {
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Account" title="Account" />
      <AuthPanel />
    </div>
  );
}
