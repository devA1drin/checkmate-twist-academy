import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { KITS } from "@/data/openings/kits";
import videos from "@/data/videos.json";
import games from "@/data/openings/model-games.json";
export const metadata = { title: "Opening kits" };

const GROUPS = [
  { title: "Openings for White", test: (s: string) => s === "white" },
  { title: "Defences for Black", test: (s: string) => s === "black" },
];
const vids = (slug: string) => (videos as { kit?: string }[]).filter((v) => v.kit === slug).length;

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Learn" section="none" title="Opening kits" desc="Each kit explains the ideas in plain words, shows the main lines and traps on a board, walks through master games, links the best videos, and drills the lines until you remember them." />
      <p className="text-sm text-muted mb-8">New to openings? Start with one <strong className="text-fg">Beginner</strong> kit for White and one for Black, for example the Italian Game and the Caro-Kann.</p>
      {GROUPS.map((g) => (
        <section key={g.title} className="mb-12">
          <h2 className="text-xl font-semibold mb-3">{g.title}</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Opening</th><th className="hidden sm:table-cell">First moves</th><th>Level</th><th className="hidden md:table-cell text-right">Lines</th><th className="hidden md:table-cell text-right">Games</th><th className="hidden md:table-cell text-right">Videos</th></tr></thead>
              <tbody>
                {KITS.filter((k) => g.test(k.side)).map((k) => (
                  <tr key={k.slug}>
                    <td><Link href={`/openings/${k.slug}`} className="font-medium hover:underline underline-offset-4 block py-1">{k.name}</Link><span className="text-xs text-muted sm:hidden font-mono">{k.lines[0].moves.split(" ").slice(0, 4).join(" ")}</span></td>
                    <td className="hidden sm:table-cell font-mono text-[13px] text-muted">{k.lines[0].moves.split(" ").slice(0, k.side === "white" ? 5 : 4).join(" ")}</td>
                    <td className="text-sm">{k.level}</td>
                    <td className="hidden md:table-cell text-right font-mono text-sm">{k.lines.length}</td>
                    <td className="hidden md:table-cell text-right font-mono text-sm">{(games as Record<string, unknown[]>)[k.slug]?.length ?? 0}</td>
                    <td className="hidden md:table-cell text-right font-mono text-sm">{vids(k.slug)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
