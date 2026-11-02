import { notFound } from "next/navigation";
import Link from "next/link";
import { KITS, KIT_BY_SLUG } from "@/data/openings/kits";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KitView } from "./kit-view";
import { PdfButton } from "@/components/openings/pdf-button";

let counts: Record<string, number> | null = null;
function variations(slug: string) {
  if (!counts) {
    counts = {};
    const rows = JSON.parse(readFileSync(join(process.cwd(), "public/data/openings-index.json"), "utf8")).rows as string[][];
    for (const r of rows) if (r[4]) counts[r[4]] = (counts[r[4]] ?? 0) + 1;
  }
  return counts[slug] ?? 0;
}
export const dynamicParams = false;
export function generateStaticParams() { return KITS.map((k) => ({ slug: k.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const k = KIT_BY_SLUG[(await params).slug];
  return { title: k ? `${k.name} kit` : "Opening kit" };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const kit = KIT_BY_SLUG[(await params).slug];
  if (!kit) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-4"><Link href="/learn" className="hover:underline">Learn</Link> / <Link href="/openings" className="hover:underline">Opening kits</Link></nav>
      <header className="pb-6 border-b border-line mb-6">
        <p className="eyebrow">{kit.family} · for {kit.side === "white" ? "White" : "Black"} · {kit.level} · ECO {kit.ecoRange}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2">{kit.name}</h1>
        <p className="mt-3 max-w-3xl leading-relaxed">{kit.summary}</p>
        <div className="flex flex-wrap items-start gap-2 mt-5">
          <PdfButton slugs={[kit.slug]} filename={`${kit.slug}-study-guide.pdf`} />
          {variations(kit.slug) > 0 && <Link href={`/openings/explorer?kit=${kit.slug}`} className="btn btn-ghost">{variations(kit.slug)} named variations</Link>}
        </div>
      </header>
      <KitView slug={kit.slug} />
    </div>
  );
}
