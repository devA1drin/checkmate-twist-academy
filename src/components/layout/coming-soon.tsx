import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
/** Honest placeholder for a page whose interface is still being built. */
export function ComingSoon({ section, title, desc }: { section: string; title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow={section} title={title} desc={desc} section="none" />
      <p className="notice">This page is being built and will be switched on shortly. Everything else on the site works now.</p>
      <p className="mt-6"><Link href="/dashboard" className="link">Back to your page</Link></p>
    </div>
  );
}
