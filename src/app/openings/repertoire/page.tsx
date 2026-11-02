import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Builder } from "./builder";
export const metadata = { title: "Repertoire PDF builder", description: "Pick opening kits and download them as one printable PDF study guide." };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-4"><Link href="/learn" className="hover:underline">Learn</Link> / <Link href="/openings" className="hover:underline">Opening kits</Link></nav>
      <PageHeader title="Build your repertoire PDF" desc="Pick the openings you play with White and the defences you use with Black. You get one printable PDF with a contents page, diagrams for every line, the plans, traps, model game references and video links. It is made on your device, nothing is uploaded." />
      <Builder />
    </div>
  );
}
