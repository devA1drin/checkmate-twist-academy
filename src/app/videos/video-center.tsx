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
        {[["all", "All"], ["chess", "Chess"], ["cube", "Cube"]].map(([k, l]) => <button key={k} onClick={() => setCat(k)} className={`btn ${cat === k ? "btn-primary" : "btn-ghost"}`}>{l}</button>)}
        <select className="input !w-auto" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Level"><option value="all">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        <div className="relative flex-1 min-w-[200px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input !pl-9" placeholder="Search videos…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      {list.length === 0 ? <p className="text-muted">No videos match.</p> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => <div key={v.id}><YouTubeLite id={v.id} title={v.title} channel={v.channel} /><div className="flex gap-1.5 mt-2"><span className="chip">{v.category === "chess" ? "Chess" : "Cube"}</span><span className="chip">{v.level}</span></div></div>)}
        </div>
      )}
    </div>
  );
}
