"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KIT_BY_SLUG } from "@/data/openings/kits";
import allGames from "@/data/openings/model-games.json";
import videos from "@/data/videos.json";
import { MoveViewer } from "@/components/chess/move-viewer";
import { Board } from "@/components/chess/board";
import { Drill } from "@/components/openings/drill";
import { YouTubeLite } from "@/components/video/youtube-lite";
import { playSan } from "@/lib/chess/san";

interface Game { white: string; black: string; whiteElo?: number; blackElo?: number; event: string; date: string; result: string; opening: string; eco: string; moves: string; source?: string }
interface V { id: string; title: string; channel: string; kit?: string; level: string }
const TABS = [["overview", "Overview"], ["lines", "Lines"], ["traps", "Traps"], ["games", "Model games"], ["videos", "Videos"], ["drill", "Drill"]] as const;
type Tab = (typeof TABS)[number][0];

export function KitView({ slug }: { slug: string }) {
  const kit = KIT_BY_SLUG[slug];
  const games = ((allGames as Record<string, Game[]>)[slug] ?? []);
  const vids = (videos as V[]).filter((v) => v.kit === slug);
  const [tab, setTab] = useState<Tab>("overview");
  const [line, setLine] = useState(0), [trap, setTrap] = useState(0), [game, setGame] = useState(0);
  useEffect(() => { const h = window.location.hash.slice(1) as Tab; if (TABS.some(([k]) => k === h)) setTab(h); }, []);
  const pick = (t: Tab) => { setTab(t); history.replaceState(null, "", `#${t}`); };
  const structFens = useMemo(() => kit.structures.map((s) => playSan(s.moves).at(-1)!.fen), [kit]);

  return (
    <div>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-8 border-b border-line">
        <div role="tablist" aria-label="Kit sections" className="flex min-w-max">
          {TABS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} aria-controls={`panel-${k}`} id={`tab-${k}`} onClick={() => pick(k)}
              className={`px-4 h-12 text-[15px] border-b-2 -mb-px ${tab === k ? "border-electric font-medium" : "border-transparent text-muted hover:text-fg"}`}>
              {l}{k === "lines" ? ` (${kit.lines.length})` : k === "games" ? ` (${games.length})` : k === "videos" ? ` (${vids.length})` : k === "traps" ? ` (${kit.traps.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "overview" && (
          <div className="space-y-10">
            <p className="notice"><strong>Good for:</strong> {kit.goodFor}</p>
            <section><h2 className="text-xl font-semibold mb-3">Key ideas</h2>
              <ol className="space-y-3 max-w-3xl">{kit.ideas.map((t, i) => <li key={i} className="grid grid-cols-[1.75rem_1fr] leading-relaxed"><span className="font-mono text-muted">{i + 1}.</span><span>{t}</span></li>)}</ol>
            </section>
            <section><h2 className="text-xl font-semibold mb-3">Plans</h2>
              <div className="grid md:grid-cols-2 gap-8">{kit.plans.map((p) => (
                <div key={p.side}><h3 className="font-medium mb-2 flex items-center gap-2"><span aria-hidden className={`h-3 w-3 border border-ink ${p.side === "White" ? "bg-[#f4efe4]" : "bg-[#1b2130]"}`} />{p.side}</h3>
                  <ul className="space-y-2 border-t border-line pt-2">{p.points.map((x, i) => <li key={i} className="leading-relaxed">{x}</li>)}</ul></div>
              ))}</div>
            </section>
            <section><h2 className="text-xl font-semibold mb-3">Typical pawn structures</h2>
              <div className="grid md:grid-cols-2 gap-8">{kit.structures.map((s, i) => (
                <div key={s.name} className="grid grid-cols-[minmax(0,180px)_1fr] gap-4 items-start">
                  <Board id={`st-${i}`} fen={structFens[i]} orientation={kit.side} />
                  <div><h3 className="font-medium">{s.name}</h3><p className="text-sm text-muted mt-1 leading-relaxed">{s.text}</p></div>
                </div>
              ))}</div>
            </section>
            <div className="flex flex-wrap gap-3"><button className="btn btn-primary" onClick={() => pick("lines")}>Study the lines</button><button className="btn btn-ghost" onClick={() => pick("drill")}>Drill from memory</button></div>
          </div>
        )}

        {tab === "lines" && (
          <div className="space-y-6">
            <div className="seg flex-wrap !flex" role="group" aria-label="Choose a line">
              {kit.lines.map((l, i) => <button key={l.id} aria-pressed={line === i} onClick={() => setLine(i)}>{l.name}</button>)}
            </div>
            <MoveViewer id="kit-line" moves={kit.lines[line].moves} orientation={kit.side}
              note={<div className="mb-3"><p className="eyebrow">{kit.lines[line].kind === "main" ? "Main line" : "Sideline"} · {kit.lines[line].eco}</p><h2 className="text-lg font-semibold">{kit.lines[line].name}</h2><p className="text-sm leading-relaxed mt-1">{kit.lines[line].note}</p></div>} />
          </div>
        )}

        {tab === "traps" && (
          <div className="space-y-6">
            <div className="seg flex-wrap !flex" role="group" aria-label="Choose a trap">
              {kit.traps.map((t, i) => <button key={t.name} aria-pressed={trap === i} onClick={() => setTrap(i)}>{t.name}</button>)}
            </div>
            <MoveViewer id="kit-trap" moves={kit.traps[trap].moves} orientation={kit.side}
              note={<div className="mb-3"><p className="eyebrow">{kit.traps[trap].kind === "trap" ? "Trap" : "Common mistake"}</p><h2 className="text-lg font-semibold">{kit.traps[trap].name}</h2><p className="text-sm leading-relaxed mt-1">{kit.traps[trap].text}</p></div>} />
          </div>
        )}

        {tab === "games" && (games.length === 0 ? <p className="text-muted">No model games for this kit yet.</p> : (
          <div className="space-y-6">
            <ul className="border-t border-line">
              {games.map((g, i) => (
                <li key={i}><button onClick={() => setGame(i)} aria-pressed={game === i} className={`w-full text-left py-3 px-2 border-b border-line min-h-[56px] ${game === i ? "bg-surface-2" : "hover:bg-surface"}`}>
                  <span className="font-medium">{g.white}{g.whiteElo ? ` (${g.whiteElo})` : ""} – {g.black}{g.blackElo ? ` (${g.blackElo})` : ""}</span>
                  <span className="font-mono text-sm ml-2">{g.result}</span>
                  <span className="block text-xs text-muted">{g.event}, {g.date.slice(0, 4)} · {g.opening} · {g.eco}</span>
                </button></li>
              ))}
            </ul>
            <MoveViewer id="kit-game" moves={games[game].moves} orientation={kit.side} startAt={Math.min(16, games[game].moves.split(" ").length)}
              footer={games[game].source ? <a href={games[game].source} target="_blank" rel="noreferrer" className="link">Source</a> : null} />
          </div>
        ))}

        {tab === "videos" && (vids.length === 0 ? <p className="text-muted">No videos linked to this kit yet. <Link href="/videos?topic=openings" className="link">See all opening videos</Link>.</p> : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {vids.map((v) => <YouTubeLite key={v.id} id={v.id} title={v.title} channel={v.channel} />)}
          </div>
        ))}

        {tab === "drill" && <Drill kit={kit} />}
      </div>
    </div>
  );
}
