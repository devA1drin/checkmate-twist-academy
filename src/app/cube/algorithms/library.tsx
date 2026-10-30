"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Copy, Check, PlayCircle } from "lucide-react";
import { ALL_ALGS, AlgSet } from "@/data/algorithms";
import { CaseDiagram } from "@/components/cube/case-diagram";

const SETS: ("All" | AlgSet)[] = ["All", "OLL", "PLL", "F2L"];

export function AlgorithmLibrary() {
  const [q, setQ] = useState("");
  const [set, setSet] = useState<(typeof SETS)[number]>("All");
  const [group, setGroup] = useState("All");
  const [copied, setCopied] = useState<string | null>(null);
  const groups = useMemo(() => ["All", ...Array.from(new Set(ALL_ALGS.filter((a) => set === "All" || a.set === set).map((a) => a.group)))], [set]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ALL_ALGS.filter((a) => (set === "All" || a.set === set) && (group === "All" || a.group === group) &&
      (!t || a.name.toLowerCase().includes(t) || a.group.toLowerCase().includes(t) || a.alg.toLowerCase().includes(t) || a.id.includes(t)));
  }, [q, set, group]);

  const copy = async (id: string, alg: string) => {
    try { await navigator.clipboard.writeText(alg); setCopied(id); setTimeout(() => setCopied(null), 1200); } catch { /* clipboard blocked */ }
  };

  return (
    <div>
      <div className="card p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center sticky top-16 z-20">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !pl-9" placeholder="Search by number, name, group or moves (e.g. 'sune', 'T perm', 'r U R')" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search algorithms" />
        </div>
        <div className="flex gap-1">
          {SETS.map((s) => (
            <button key={s} onClick={() => { setSet(s); setGroup("All"); }} className={`btn ${set === s ? "btn-primary" : "btn-ghost"} !py-1.5`}>{s}</button>
          ))}
        </div>
        <select className="input md:!w-56" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Group">
          {groups.map((g) => <option key={g}>{g}</option>)}
        </select>
      </div>
      <p className="text-sm text-muted mb-4">{list.length} algorithm{list.length === 1 ? "" : "s"}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((a) => (
          <div key={a.id} className="card p-4 flex flex-col hover:border-electric/60 transition">
            <div className="flex items-start gap-3">
              <CaseDiagram alg={a.alg} mode={a.set} size={92} />
              <div className="min-w-0">
                <div className="font-semibold text-sm">{a.name}</div>
                <div className="chip mt-1">{a.set} · {a.group}</div>
                {a.probability && <div className="text-xs text-muted mt-1">Probability {a.probability}</div>}
              </div>
            </div>
            <div className="mt-3 font-mono text-[13px] leading-relaxed break-words">{a.alg}</div>
            {a.alts && a.alts.length > 0 && <div className="mt-1 text-xs text-muted font-mono">alt: {a.alts.join(" · ")}</div>}
            {a.notes && <div className="mt-1 text-xs text-muted">{a.notes}</div>}
            <div className="mt-auto pt-3 flex gap-2">
              <Link href={`/cube/simulator?case=${a.id}`} className="btn btn-primary !py-1.5 !text-xs"><PlayCircle size={14} /> Play on cube</Link>
              <button onClick={() => copy(a.id, a.alg)} className="btn btn-ghost !py-1.5 !text-xs">{copied === a.id ? <Check size={14} /> : <Copy size={14} />} Copy</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
