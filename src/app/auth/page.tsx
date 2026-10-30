import { PageHeader } from "@/components/ui/page-header";
import { AuthPanel } from "./auth-panel";
export const metadata = { title: "Sign in" };
export default function Page() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <PageHeader eyebrow="Account" title="Your account" />
      <AuthPanel />
    </div>
  );
}
