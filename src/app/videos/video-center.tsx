"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import videos from "@/data/videos.json";
import { YouTubeLite } from "@/components/video/youtube-lite";

interface V { id: string; title: string; channel: string; category: string; level: string; topic: string }
const ALL = videos as V[];
export function VideoCenter() {
  const [cat, setCat] = useState("all"), [level, setLevel] = useState("all"), [q, setQ] = useState("");
  const list = useMemo(() => ALL.filter((v) => (cat === "all" || v.category === cat) && (level === "all" || v.level === level) && (!q || `${v.title} ${v.channel} ${v.topic}`.toLowerCase().includes(q.toLowerCase()))), [cat, level, q]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex border border-line rounded-md overflow-hidden" role="group" aria-label="Topic">{[["all", "All"], ["chess", "Chess"], ["cube", "Cube"]].map(([k, l]) => <button key={k} onClick={() => setCat(k)} aria-pressed={cat === k} className={`px-3.5 py-1.5 text-sm border-r border-line last:border-r-0 ${cat === k ? "bg-fg text-bg" : "hover:bg-surface-2"}`}>{l}</button>)}</div>
        <select className="input !w-auto" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Level"><option value="all">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        <div className="relative flex-1 min-w-[200px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input !pl-9" aria-label="Search videos" placeholder="Search by title, channel or topic" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      {list.length === 0 ? <p className="text-muted">No videos match.</p> : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => <div key={v.id}><YouTubeLite id={v.id} title={v.title} channel={v.channel} /><div className="flex items-center gap-2 mt-1.5 text-xs text-muted"><span className={`h-2 w-2 ${v.category === "chess" ? "bg-chess" : "bg-cube"}`} aria-hidden />{v.category === "chess" ? "Chess" : "Cube"} · {v.level}</div></div>)}
        </div>
      )}
    </div>
  );
}
