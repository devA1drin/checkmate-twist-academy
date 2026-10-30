"use client";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Chess } from "chess.js";
import { Board } from "@/components/chess/board";
import { parseAlg } from "@/lib/cube/model";

/*
  A deliberately small Markdown subset rendered to React elements (never to HTML strings),
  so user text can't inject markup. Supported: paragraphs, # headings, **bold**, *italic*,
  `code`, ``` code blocks, > quotes, - and 1. lists, [text](https://link), and two embeds:
  [fen]<FEN>[/fen] shows a chess position, [alg]<moves>[/alg] shows a cube algorithm.
*/

const SAFE_URL = /^(https?:\/\/[^\s<>"']+|\/[^\s<>"']*)$/i;

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)\s]+\))|(https?:\/\/[^\s<>()]+[^\s<>().,!?;:])/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0], k = `${key}-${i++}`;
    if (m[1]) out.push(<code key={k} className="font-mono text-[0.9em] bg-surface-2 px-1 rounded">{t.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={k}>{inline(t.slice(2, -2), k)}</strong>);
    else if (m[3]) out.push(<em key={k}>{inline(t.slice(1, -1), k)}</em>);
    else if (m[4]) {
      const mm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(t)!;
      const href = mm[2];
      if (SAFE_URL.test(href)) out.push(href.startsWith("/") ? <Link key={k} href={href} className="link">{mm[1]}</Link> : <a key={k} href={href} className="link" rel="nofollow noopener noreferrer ugc" target="_blank">{mm[1]}</a>);
      else out.push(t);
    } else out.push(<a key={k} href={t} className="link break-all" rel="nofollow noopener noreferrer ugc" target="_blank">{t}</a>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function FenEmbed({ fen, k }: { fen: string; k: string }) {
  let ok = true; try { new Chess(fen); } catch { ok = false; }
  if (!ok) return <p className="notice notice-bad text-sm">Invalid chess position (FEN): <code className="font-mono">{fen}</code></p>;
  const side = fen.split(" ")[1] === "b" ? "Black" : "White";
  return (
    <figure className="my-4 max-w-sm">
      <Board id={`md-${k}`} fen={fen} />
      <figcaption className="text-sm text-muted mt-1.5 flex justify-between gap-3"><span>{side} to move</span><Link className="link" href={`/chess/analysis?fen=${encodeURIComponent(fen)}`}>Analyse this position</Link></figcaption>
    </figure>
  );
}

function AlgEmbed({ alg }: { alg: string }) {
  let ok = true; try { if (!parseAlg(alg).length) ok = false; } catch { ok = false; }
  if (!ok) return <p className="notice notice-bad text-sm">Not a valid cube algorithm: <code className="font-mono">{alg}</code></p>;
  return (
    <div className="my-4 border-l-2 border-electric pl-4 py-1">
      <p className="font-mono text-lg tracking-wide">{alg}</p>
      <p className="text-sm mt-1"><Link className="link" href={`/cube/simulator?alg=${encodeURIComponent(alg)}`}>Set up this case on the 3D cube</Link> · <Link className="link" href={`/cube/simulator?alg=${encodeURIComponent(alg)}&mode=apply`}>Apply to a solved cube</Link></p>
    </div>
  );
}

export function Markdown({ text, id = "md" }: { text: string; id?: string }) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0, n = 0;
  const key = () => `${id}-${n++}`;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("```")) {
      const buf: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={key()} className="font-mono text-sm bg-surface-2 p-3 rounded overflow-x-auto my-3">{buf.join("\n")}</pre>);
      continue;
    }
    const fen = /^\s*\[fen\]\s*(.+?)\s*\[\/fen\]\s*$/i.exec(line);
    if (fen) { const k = key(); blocks.push(<FenEmbed key={k} k={k} fen={fen[1]} />); i++; continue; }
    const alg = /^\s*\[alg\]\s*(.+?)\s*\[\/alg\]\s*$/i.exec(line);
    if (alg) { blocks.push(<AlgEmbed key={key()} alg={alg[1]} />); i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const k = key(), c = inline(h[2], k);
      blocks.push(h[1].length === 1 ? <h2 key={k} className="text-xl font-semibold mt-5 mb-2">{c}</h2> : h[1].length === 2 ? <h3 key={k} className="text-lg font-semibold mt-4 mb-2">{c}</h3> : <h4 key={k} className="font-semibold mt-3 mb-1">{c}</h4>);
      i++; continue;
    }
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
      const k = key();
      blocks.push(<blockquote key={k} className="border-l-2 border-line pl-4 text-muted my-3">{inline(buf.join(" "), k)}</blockquote>);
      continue;
    }
    const ul = /^\s*[-*]\s+/, ol = /^\s*\d+[.)]\s+/;
    if (ul.test(line) || ol.test(line)) {
      const ordered = ol.test(line), re = ordered ? ol : ul, items: string[] = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ""));
      const k = key();
      const lis = items.map((t, j) => <li key={j}>{inline(t, `${k}-${j}`)}</li>);
      blocks.push(ordered ? <ol key={k} className="list-decimal pl-6 my-3 space-y-1">{lis}</ol> : <ul key={k} className="list-disc pl-6 my-3 space-y-1">{lis}</ul>);
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s|>|\s*[-*]\s+|\s*\d+[.)]\s+|\s*\[(fen|alg)\])/i.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) { buf.push(lines[i++]); }
    const k = key();
    blocks.push(<p key={k} className="my-3 leading-relaxed break-words">{buf.map((b, j) => <Fragment key={j}>{j > 0 && <br />}{inline(b, `${k}-${j}`)}</Fragment>)}</p>);
  }
  return <div className="text-[16px]">{blocks}</div>;
}

export const MARKDOWN_HELP = "**bold**, *italic*, `code`, [link](https://…), - lists, > quotes. Embed a chess position with [fen]FEN[/fen] or a cube algorithm with [alg]R U R' U'[/alg] on its own line.";
