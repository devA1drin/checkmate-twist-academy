import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { KITS } from "@/data/openings/kits";
import videos from "@/data/videos.json";
import games from "@/data/openings/model-games.json";
import { OpeningSearchForm } from "@/components/openings/opening-search-form";
import { KitIndex, type KitRow } from "./kit-index";
export const metadata = { title: "Opening kits" };

const vids = (slug: string) => (videos as { kit?: string }[]).filter((v) => v.kit === slug).length;

export default function Page() {
  const rows: KitRow[] = KITS.map((k) => {
    const main = k.lines.find((l) => l.kind === "main") ?? k.lines[0];
    return { slug: k.slug, name: k.name, family: k.family, side: k.side, level: k.level, first: main.moves.split(" ").slice(0, k.side === "white" ? 5 : 4).join(" "), lines: k.lines.length, games: (games as Record<string, unknown[]>)[k.slug]?.length ?? 0, videos: vids(k.slug) };
  });
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Learn" section="none" title="Opening kits" desc={`${KITS.length} kits. Each one explains the ideas in plain words, shows the main lines, sidelines and traps on a board, walks through real master games, links the best videos, drills the lines until you remember them, and comes as a printable PDF guide.`} />
      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end mb-10 pb-8 border-b border-line">
        <OpeningSearchForm />
        <div className="flex flex-wrap gap-2">
          <Link href="/openings/explorer" className="btn btn-ghost">Search by position</Link>
          <Link href="/openings/repertoire" className="btn btn-ghost">Build a repertoire PDF</Link>
        </div>
      </div>
      <p className="text-sm text-muted mb-6">New to openings? Start with one <strong className="text-fg">Beginner</strong> kit for White and one for Black, for example the Italian Game and the Caro-Kann.</p>
      <KitIndex kits={rows} />
    </div>
  );
}
