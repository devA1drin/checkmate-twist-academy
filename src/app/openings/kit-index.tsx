"use client";
import Link from "next/link";
import { useState } from "react";

export interface KitRow { slug: string; name: string; family: string; side: "white" | "black"; level: string; first: string; lines: number; games: number; videos: number }
const FAMILIES = [["1.e4", "1.e4 openings"], ["1.d4", "1.d4 openings"], ["1.c4", "1.c4: the English"], ["1.Nf3", "1.Nf3 systems"], ["1.f4", "1.f4: Bird's Opening"]] as const;
const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"] as const;

export function KitIndex({ kits }: { kits: KitRow[] }) {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All");
  const [side, setSide] = useState<"all" | "white" | "black">("all");
  const shown = kits.filter((k) => (level === "All" || k.level === level) && (side === "all" || k.side === side));
  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-3 mb-8">
        <div><p className="label">Level</p><div className="seg" role="group" aria-label="Level">{LEVELS.map((l) => <button key={l} aria-pressed={level === l} onClick={() => setLevel(l)}>{l}</button>)}</div></div>
        <div><p className="label">Side</p><div className="seg" role="group" aria-label="Side">{([["all", "Both"], ["white", "White"], ["black", "Black"]] as const).map(([v, l]) => <button key={v} aria-pressed={side === v} onClick={() => setSide(v)}>{l}</button>)}</div></div>
      </div>
      <p className="text-sm text-muted mb-6" aria-live="polite">{shown.length} of {kits.length} kits</p>
      {FAMILIES.map(([fam, title]) => {
        const list = shown.filter((k) => k.family === fam);
        if (!list.length) return null;
        return (
          <section key={fam} className="mb-12" aria-labelledby={`fam-${fam}`}>
            <h2 id={`fam-${fam}`} className="text-xl font-semibold mb-3">{title} <span className="text-muted font-normal text-base">({list.length})</span></h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Opening</th><th className="hidden sm:table-cell">First moves</th><th>Side</th><th>Level</th><th className="hidden md:table-cell text-right">Lines</th><th className="hidden md:table-cell text-right">Games</th><th className="hidden md:table-cell text-right">Videos</th></tr></thead>
                <tbody>
                  {list.map((k) => (
                    <tr key={k.slug}>
                      <td><Link href={`/openings/${k.slug}`} className="font-medium hover:underline underline-offset-4 block py-1">{k.name}</Link><span className="text-xs text-muted sm:hidden font-mono">{k.first}</span></td>
                      <td className="hidden sm:table-cell font-mono text-[13px] text-muted">{k.first}</td>
                      <td className="text-sm">{k.side === "white" ? "White" : "Black"}</td>
                      <td className="text-sm">{k.level}</td>
                      <td className="hidden md:table-cell text-right font-mono text-sm">{k.lines}</td>
                      <td className="hidden md:table-cell text-right font-mono text-sm">{k.games}</td>
                      <td className="hidden md:table-cell text-right font-mono text-sm">{k.videos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {!shown.length && <p className="text-muted">No kits match. Try another level.</p>}
    </div>
  );
}
