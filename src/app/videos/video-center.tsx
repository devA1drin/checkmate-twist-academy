"use client";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import videos from "@/data/videos.json";
import { KITS } from "@/data/openings/kits";
import { YouTubeLite } from "@/components/video/youtube-lite";

interface V { id: string; title: string; channel: string; category: string; level: string; topic: string; kit?: string }
const ALL = videos as V[];
const TOPICS: Record<string, string> = { openings: "Openings", "model-games": "Model games", tactics: "Tactics", strategy: "Strategy", endgames: "Endgames", fundamentals: "Fundamentals", "beginner-method": "Beginner method", f2l: "F2L", oll: "OLL", pll: "PLL", roux: "Roux", zz: "ZZ", "other-puzzles": "Other puzzles" };
const KIT_NAME = Object.fromEntries(KITS.map((k) => [k.slug, k.short]));
const count = (key: keyof V) => ALL.reduce<Record<string, number>>((m, v) => { const k = v[key]; if (k) m[k] = (m[k] ?? 0) + 1; return m; }, {});
const CHANNELS = Object.entries(count("channel")).sort((a, b) => b[1] - a[1]);
const KIT_COUNTS = Object.entries(count("kit")).sort((a, b) => b[1] - a[1]);

/** Filters live in the URL, so a filtered list can be shared or linked from an opening kit (?kit=italian). */
export function VideoCenter() {
  const sp = useSearchParams(), router = useRouter(), path = usePathname();
  const get = (k: string) => sp.get(k) ?? "";
  const cat = get("cat"), level = get("level"), channel = get("channel"), topic = get("topic"), kit = get("kit"), q = get("q");
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v); else n.delete(k);
    if (k === "cat") { n.delete("topic"); if (v === "cube") n.delete("kit"); }
    router.replace(`${path}${n.size ? `?${n}` : ""}`, { scroll: false });
  };
  const topics = useMemo(() => Object.keys(TOPICS).filter((t) => ALL.some((v) => v.topic === t && (!cat || v.category === cat))), [cat]);
  const list = useMemo(() => ALL.filter((v) => (!cat || v.category === cat) && (!level || v.level === level) && (!channel || v.channel === channel) && (!topic || v.topic === topic) && (!kit || v.kit === kit)
    && (!q || `${v.title} ${v.channel} ${TOPICS[v.topic] ?? v.topic} ${v.kit ? KIT_NAME[v.kit] : ""}`.toLowerCase().includes(q.toLowerCase()))), [cat, level, channel, topic, kit, q]);
  const active = [cat, level, channel, topic, kit, q].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="seg" role="group" aria-label="Subject">
            {[["", "All"], ["chess", "Chess"], ["cube", "Cube"]].map(([k, l]) => <button key={k} onClick={() => set("cat", k)} aria-pressed={cat === k}>{l}</button>)}
          </div>
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input className="input !pl-9" aria-label="Search videos" placeholder="Search title, channel, opening" defaultValue={q} onChange={(e) => set("q", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select className="input" value={topic} onChange={(e) => set("topic", e.target.value)} aria-label="Topic"><option value="">All topics</option>{topics.map((t) => <option key={t} value={t}>{TOPICS[t]}</option>)}</select>
          <select className="input" value={kit} onChange={(e) => set("kit", e.target.value)} aria-label="Opening" disabled={cat === "cube"}><option value="">All openings</option>{KIT_COUNTS.map(([k, n]) => <option key={k} value={k}>{KIT_NAME[k] ?? k} ({n})</option>)}</select>
          <select className="input" value={channel} onChange={(e) => set("channel", e.target.value)} aria-label="Channel"><option value="">All channels</option>{CHANNELS.map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}</select>
          <select className="input" value={level} onChange={(e) => set("level", e.target.value)} aria-label="Level"><option value="">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted" aria-live="polite">
          <span>{list.length} of {ALL.length} videos</span>
          {active > 0 && <button className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-fg min-h-[32px]" onClick={() => router.replace(path, { scroll: false })}><X size={14} aria-hidden />Clear filters</button>}
        </div>
      </div>
      {list.length === 0 ? <p className="text-muted">No videos match these filters.</p> : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <div key={v.id}>
              <YouTubeLite id={v.id} title={v.title} channel={v.channel} />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-muted">
                <span className={`h-2 w-2 ${v.category === "chess" ? "bg-chess" : "bg-cube"}`} aria-hidden />
                <span>{TOPICS[v.topic] ?? v.topic}</span><span aria-hidden>·</span><span>{v.level}</span>
                {v.kit && <><span aria-hidden>·</span><a href={`/openings/${v.kit}`} className="underline underline-offset-2">{KIT_NAME[v.kit]} kit</a></>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
