"use client";
import { useEffect, useState } from "react";
import { KITS } from "@/data/openings/kits";
import { PdfButton } from "@/components/openings/pdf-button";

const KEY = "repertoire-kits";
const SUGGEST: [string, string[]][] = [
  ["Beginner set", ["italian", "london", "caro-kann", "scandinavian"]],
  ["Classical 1.e4 e5", ["ruy-lopez", "italian", "petrov", "queens-gambit"]],
  ["Sharp", ["sicilian", "sicilian-dragon", "kings-indian", "kings-gambit"]],
];

export function Builder() {
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("My opening repertoire"), [owner, setOwner] = useState("");
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(KEY) ?? "[]"); if (Array.isArray(s)) setPicked(s.filter((x) => KITS.some((k) => k.slug === x))); } catch { /* ignore */ } }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(picked)); }, [picked]);
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const ordered = KITS.filter((k) => picked.includes(k.slug)).sort((a, b) => (a.side === b.side ? 0 : a.side === "white" ? -1 : 1));

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
      <div>
        <p className="label">Quick start</p>
        <div className="flex flex-wrap gap-2 mb-8">{SUGGEST.map(([l, s]) => <button key={l} className="btn btn-ghost" onClick={() => setPicked(s)}>{l}</button>)}</div>
        {(["white", "black"] as const).map((side) => (
          <fieldset key={side} className="mb-10">
            <legend className="text-xl font-semibold mb-3">{side === "white" ? "With White" : "With Black"}</legend>
            <ul className="grid sm:grid-cols-2 gap-x-6 border-t border-line">
              {KITS.filter((k) => k.side === side).map((k) => (
                <li key={k.slug} className="border-b border-line">
                  <label className="flex items-center gap-3 min-h-[52px] py-2 cursor-pointer">
                    <input type="checkbox" className="h-5 w-5 shrink-0" checked={picked.includes(k.slug)} onChange={() => toggle(k.slug)} />
                    <span className="min-w-0"><span className="block font-medium leading-snug">{k.name}</span><span className="block text-xs text-muted">{k.family} · {k.level}</span></span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
      </div>
      <aside className="lg:sticky lg:top-20 border-t-2 border-ink pt-4" aria-label="Your PDF">
        <h2 className="text-lg font-semibold">Your PDF</h2>
        <p className="text-sm text-muted mb-4">{ordered.length ? `${ordered.length} kit${ordered.length === 1 ? "" : "s"}, White first, about ${ordered.length * 4} pages.` : "Pick at least one kit."}</p>
        {ordered.length > 0 && <ol className="text-sm space-y-1 mb-5 list-decimal pl-5">{ordered.map((k) => <li key={k.slug}>{k.name}</li>)}</ol>}
        <label htmlFor="rp-title" className="label">Title</label>
        <input id="rp-title" className="input w-full mb-3" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
        <label htmlFor="rp-owner" className="label">Your name (optional)</label>
        <input id="rp-owner" className="input w-full mb-5" value={owner} maxLength={40} onChange={(e) => setOwner(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <PdfButton slugs={ordered.map((k) => k.slug)} title={title.trim() || "My opening repertoire"} owner={owner.trim() || undefined} filename="opening-repertoire.pdf" label="Download PDF" className="btn btn-primary" disabled={!ordered.length} />
          {picked.length > 0 && <button className="btn btn-ghost" onClick={() => setPicked([])}>Clear</button>}
        </div>
      </aside>
    </div>
  );
}
