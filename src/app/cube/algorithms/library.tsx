"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
      <div className="sticky top-14 z-20 bg-bg py-3 border-b border-line flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input !pl-9" placeholder="Search by number, name, group or moves: sune, T perm, r U R'" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search algorithms" />
        </div>
        <div className="flex border border-line rounded-md overflow-hidden w-fit" role="group" aria-label="Algorithm set">
          {SETS.map((s) => (
            <button key={s} onClick={() => { setSet(s); setGroup("All"); }} aria-pressed={set === s}
              className={`px-3.5 py-1.5 text-sm font-mono border-r border-line last:border-r-0 ${set === s ? "bg-fg text-bg" : "hover:bg-surface-2"}`}>{s}</button>
          ))}
        </div>
        <select className="input md:!w-56" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Group">
          {groups.map((g) => <option key={g}>{g}</option>)}
        </select>
      </div>
      <p className="text-xs text-muted font-mono mt-4 mb-2">{list.length} case{list.length === 1 ? "" : "s"}</p>
      <div className="hidden sm:grid grid-cols-[84px_190px_1fr_150px] gap-x-5 eyebrow py-2 border-b border-ink">
        <span>Case</span><span>Name</span><span>Algorithm</span><span className="text-right">Use</span>
      </div>
      <ul>
        {list.map((a) => (
          <li key={a.id} className="grid grid-cols-[72px_1fr] sm:grid-cols-[84px_190px_1fr_150px] gap-x-5 gap-y-2 py-3 border-b border-line items-center">
            <div className="row-span-3 sm:row-span-1 self-start sm:self-center"><CaseDiagram alg={a.alg} mode={a.set} size={72} /></div>
            <div>
              <div className="font-medium text-sm">{a.name}</div>
              <div className="text-xs text-muted mt-0.5">{a.set} &middot; {a.group}{a.probability ? ` · ${a.probability}` : ""}</div>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[13.5px] leading-relaxed break-words">{a.alg}</div>
              {a.alts && a.alts.length > 0 && <div className="mt-0.5 text-xs text-muted font-mono break-words">or {a.alts.join(" · ")}</div>}
              {a.notes && <div className="mt-0.5 text-xs text-muted">{a.notes}</div>}
            </div>
            <div className="flex gap-3 sm:justify-end text-sm">
              <Link href={`/cube/simulator?case=${a.id}`} className="link">Try on cube</Link>
              <button onClick={() => copy(a.id, a.alg)} className="text-muted hover:text-fg underline underline-offset-4 decoration-1" aria-label={`Copy ${a.name} algorithm`}>{copied === a.id ? "Copied" : "Copy"}</button>
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="py-10 text-muted">No algorithm matches “{q}”.</p>}
    </div>
  );
}
