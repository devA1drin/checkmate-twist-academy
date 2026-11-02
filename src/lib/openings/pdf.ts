/**
 * Builds printable opening study guides with pdf-lib. Everything in the PDF is
 * our own content (kit text, verified lines, references and links), and the
 * diagrams are drawn from the move data. Runs in the browser and in Node.
 */
import { PDFDocument, PDFFont, PDFPage, rgb, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { Chess } from "chess.js";
import type { OpeningKit } from "@/data/openings/kits";

export interface PdfGame { white: string; black: string; whiteElo?: number; blackElo?: number; event: string; date: string; result: string; opening: string; eco: string; moves: string; source?: string }
export interface PdfVideo { id: string; title: string; channel: string; kit?: string }
export interface PdfInput {
  kits: OpeningKit[];
  games: Record<string, PdfGame[]>;
  videos: PdfVideo[];
  fonts: { regular: Uint8Array | ArrayBuffer; bold: Uint8Array | ArrayBuffer };
  /** Title for a multi-kit repertoire; omit for a single kit guide. */
  title?: string;
  owner?: string;
}

const SITE = "checkmate-twist-academy.vercel.app";
const W = 595.28, H = 841.89, M = 50, CW = W - 2 * M;
const INK = rgb(0.1, 0.11, 0.14), MUTED = rgb(0.38, 0.4, 0.45), RULE = rgb(0.8, 0.8, 0.82), ACCENT = rgb(0.13, 0.3, 0.75);
const LIGHT = rgb(0.94, 0.91, 0.85), DARK = rgb(0.66, 0.56, 0.44);
const GLYPH: Record<string, [string, string]> = { k: ["\u265A", "\u2654"], q: ["\u265B", "\u2655"], r: ["\u265C", "\u2656"], b: ["\u265D", "\u2657"], n: ["\u265E", "\u2658"], p: ["\u265F", "\u2659"] };

function sanList(moves: string): string[] {
  const g = new Chess();
  return moves.trim().split(/\s+/).filter(Boolean).map((s) => g.move(s).san);
}
export function numberedMoves(moves: string): string {
  return sanList(moves).map((s, i) => (i % 2 === 0 ? `${i / 2 + 1}.${s}` : s)).join(" ");
}
function fenAfter(moves: string): string {
  const g = new Chess();
  for (const s of moves.trim().split(/\s+/).filter(Boolean)) g.move(s);
  return g.fen();
}

class Writer {
  doc: PDFDocument; page!: PDFPage; y = 0; pages: PDFPage[] = []; chars: Set<number>;
  constructor(doc: PDFDocument, public f: PDFFont, public b: PDFFont, public header: string) { this.doc = doc; this.chars = new Set(f.getCharacterSet()); }
  /** Swap characters the font lacks (for example the box-drawing bar some video titles use). */
  clean(s: string) { return Array.from(s.replace(/[\u23B8\u23B9\u2758]/g, "|")).filter((c) => this.chars.has(c.codePointAt(0)!) || c === "\n").join(""); }
  newPage() { this.page = this.doc.addPage([W, H]); this.pages.push(this.page); this.y = H - M; }
  need(h: number) { if (this.y - h < M + 20) this.newPage(); }
  wrap(text: string, size: number, font: PDFFont, width: number): string[] {
    const out: string[] = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const t = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = word; } else line = t;
      }
      out.push(line);
    }
    return out;
  }
  text(text: string, o: { size?: number; bold?: boolean; color?: RGB; x?: number; width?: number; gap?: number; lead?: number } = {}) {
    const size = o.size ?? 10, font = o.bold ? this.b : this.f, x = o.x ?? M, width = o.width ?? CW, lead = o.lead ?? size * 1.4;
    for (const l of this.wrap(this.clean(text), size, font, width)) {
      this.need(lead);
      this.page.drawText(l, { x, y: this.y - size, size, font, color: o.color ?? INK });
      this.y -= lead;
    }
    this.y -= o.gap ?? 0;
  }
  height(text: string, size: number, width: number, bold = false) { return this.wrap(this.clean(text), size, bold ? this.b : this.f, width).length * size * 1.4; }
  rule(gap = 8) { this.need(gap * 2); this.page.drawLine({ start: { x: M, y: this.y - gap / 2 }, end: { x: W - M, y: this.y - gap / 2 }, thickness: 0.6, color: RULE }); this.y -= gap; }
  heading(text: string, size = 15, keep = 60) { this.need(size * 3 + keep); this.y -= 6; this.text(text, { size, bold: true, gap: 4 }); }

  board(fen: string, x: number, top: number, size: number, flip: boolean) {
    const sq = size / 8, p = this.page, rows = fen.split(" ")[0].split("/");
    p.drawRectangle({ x: x - 0.8, y: top - size - 0.8, width: size + 1.6, height: size + 1.6, color: INK });
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const rr = flip ? 7 - r : r, cc = flip ? 7 - c : c;
      p.drawRectangle({ x: x + c * sq, y: top - (r + 1) * sq, width: sq, height: sq, color: (rr + cc) % 2 === 0 ? LIGHT : DARK });
    }
    rows.forEach((row, r) => {
      let c = 0;
      for (const ch of row) {
        if (/\d/.test(ch)) { c += +ch; continue; }
        const [solid, outline] = GLYPH[ch.toLowerCase()], white = ch === ch.toUpperCase();
        const dr = flip ? 7 - r : r, dc = flip ? 7 - c : c, fs = sq * 0.86;
        const gx = x + dc * sq + (sq - this.f.widthOfTextAtSize(solid, fs)) / 2, gy = top - (dr + 1) * sq + sq * 0.16;
        if (white) { p.drawText(solid, { x: gx, y: gy, size: fs, font: this.f, color: rgb(1, 1, 1) }); p.drawText(outline, { x: gx, y: gy, size: fs, font: this.f, color: INK }); }
        else p.drawText(solid, { x: gx, y: gy, size: fs, font: this.f, color: INK });
        c++;
      }
    });
    const files = "abcdefgh", fs = 6.5;
    for (let i = 0; i < 8; i++) {
      p.drawText(flip ? files[7 - i] : files[i], { x: x + i * sq + sq / 2 - 1.8, y: top - size - 9, size: fs, font: this.f, color: MUTED });
      p.drawText(String(flip ? i + 1 : 8 - i), { x: x - 8, y: top - (i + 1) * sq + sq / 2 - 2, size: fs, font: this.f, color: MUTED });
    }
    const turn = fen.split(" ")[1] === "w" ? "White to move" : "Black to move";
    p.drawText(turn, { x, y: top - size - 19, size: 7, font: this.f, color: MUTED });
  }
  /** Diagram on the left, heading and text on the right; kept together on one page. */
  diagramBlock(fen: string, flip: boolean, eyebrow: string, title: string, body: string[], size = 132) {
    const tx = M + size + 18, tw = CW - size - 18;
    const textH = 12 + this.height(title, 11, tw, true) + body.reduce((a, t) => a + this.height(t, 9, tw) + 4, 0);
    const h = Math.max(size + 26, textH) + 14;
    this.need(h);
    const top = this.y;
    this.board(fen, M + 8, top, size, flip);
    this.y = top;
    this.text(eyebrow, { size: 7.5, color: ACCENT, x: tx, width: tw, bold: true });
    this.text(title, { size: 11, bold: true, x: tx, width: tw, gap: 2 });
    for (const t of body) this.text(t, { size: 9, x: tx, width: tw, gap: 4 });
    this.y = Math.min(this.y, top - size - 26) - 14;
  }
}

function kitSection(w: Writer, kit: OpeningKit, games: PdfGame[], videos: PdfVideo[]) {
  const flip = kit.side === "black";
  w.newPage();
  w.text(`${kit.family} · ${kit.side === "white" ? "Opening for White" : "Defence for Black"} · ${kit.level} · ECO ${kit.ecoRange}`, { size: 8.5, color: ACCENT, bold: true, gap: 2 });
  w.text(kit.name, { size: 24, bold: true, lead: 30 });
  w.y -= 8;
  const main = kit.lines.find((l) => l.kind === "main") ?? kit.lines[0];
  w.diagramBlock(fenAfter(main.moves.split(" ").slice(0, kit.side === "white" ? 5 : 4).join(" ")), flip, "STARTING POSITION", numberedMoves(main.moves.split(" ").slice(0, kit.side === "white" ? 5 : 4).join(" ")), [kit.summary, `Good for: ${kit.goodFor}`], 170);

  w.heading("Key ideas");
  kit.ideas.forEach((t, i) => w.text(`${i + 1}.  ${t}`, { size: 9.5, gap: 3 }));
  w.heading("Plans");
  for (const p of kit.plans) { w.text(p.side, { size: 10.5, bold: true, gap: 1 }); for (const t of p.points) w.text(`–  ${t}`, { size: 9.5, x: M + 10, width: CW - 10, gap: 2 }); w.y -= 4; }

  w.heading("Pawn structures", 15, 170);
  for (const s of kit.structures) w.diagramBlock(fenAfter(s.moves), flip, "STRUCTURE", s.name, [numberedMoves(s.moves), s.text], 120);

  w.heading("Lines", 15, 170);
  for (const l of kit.lines) w.diagramBlock(fenAfter(l.moves), flip, `${l.kind === "main" ? "MAIN LINE" : "SIDELINE"} · ${l.eco}`, l.name, [numberedMoves(l.moves), l.note]);

  if (kit.traps.length) {
    w.heading("Traps and common mistakes", 15, 170);
    for (const t of kit.traps) w.diagramBlock(fenAfter(t.moves), flip, t.kind === "trap" ? "TRAP" : "COMMON MISTAKE", t.name, [numberedMoves(t.moves), t.text], 120);
  }

  if (games.length) {
    w.heading("Model games");
    w.text("Real games from official broadcasts. Replay them on the kit page or follow the source link.", { size: 9, color: MUTED, gap: 4 });
    for (const g of games) {
      w.need(60);
      w.text(`${g.white}${g.whiteElo ? ` (${g.whiteElo})` : ""} – ${g.black}${g.blackElo ? ` (${g.blackElo})` : ""}   ${g.result}`, { size: 10, bold: true });
      w.text(`${g.event}, ${g.date.replace(/\./g, "-")} · ${g.opening} (${g.eco})`, { size: 8.5, color: MUTED });
      w.text(`Opening moves: ${numberedMoves(g.moves.split(" ").slice(0, 16).join(" "))} …`, { size: 8.5 });
      if (g.source) w.text(g.source, { size: 7.5, color: ACCENT, gap: 6 });
    }
  }
  if (videos.length) {
    w.heading("Videos");
    for (const v of videos) { w.text(`${v.title} — ${v.channel}`, { size: 9.5 }); w.text(`https://www.youtube.com/watch?v=${v.id}`, { size: 7.5, color: ACCENT, gap: 4 }); }
  }
  w.y -= 6;
  w.text(`Interactive version with move-by-move boards and a drill: https://${SITE}/openings/${kit.slug}`, { size: 8.5, color: MUTED });
}

export async function buildOpeningsPdf(input: PdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const f = await doc.embedFont(input.fonts.regular, { subset: true });
  const b = await doc.embedFont(input.fonts.bold, { subset: true });
  const single = input.kits.length === 1 && !input.title;
  const title = single ? `${input.kits[0].name} — study guide` : input.title ?? "Opening repertoire";
  doc.setTitle(title); doc.setAuthor("Checkmate & Twist Academy"); doc.setCreator(SITE); doc.setProducer(SITE);
  const w = new Writer(doc, f, b, title);
  const starts: number[] = [];

  if (!single) {
    w.newPage();
    w.y = H - 150;
    w.text("CHECKMATE & TWIST ACADEMY", { size: 9, bold: true, color: ACCENT, gap: 6 });
    w.text(title, { size: 30, bold: true, lead: 36, gap: 4 });
    if (input.owner) w.text(`Prepared for ${input.owner}`, { size: 11, color: MUTED });
    w.text(`${input.kits.length} opening kits · ${new Date().toISOString().slice(0, 10)}`, { size: 11, color: MUTED, gap: 24 });
    w.text("Contents", { size: 13, bold: true, gap: 4 });
  }
  const tocTop = w.y;
  if (!single) w.y -= input.kits.length * 18 + 10;

  for (const k of input.kits) { starts.push(w.pages.length); kitSection(w, k, input.games[k.slug] ?? [], input.videos.filter((v) => v.kit === k.slug)); }

  if (!single) {
    const p0 = w.pages[0];
    input.kits.forEach((k, i) => {
      const y = tocTop - i * 18 - 12;
      p0.drawText(`${k.name}  (${k.side === "white" ? "White" : "Black"}, ${k.level})`, { x: M, y, size: 10.5, font: f, color: INK });
      const n = String(starts[i] + 1);
      p0.drawText(n, { x: W - M - f.widthOfTextAtSize(n, 10.5), y, size: 10.5, font: f, color: INK });
    });
  }
  const total = w.pages.length;
  w.pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M - 8 }, end: { x: W - M, y: M - 8 }, thickness: 0.5, color: RULE });
    p.drawText(`${title} · ${SITE}`, { x: M, y: M - 22, size: 7.5, font: f, color: MUTED });
    const n = `${i + 1} / ${total}`;
    p.drawText(n, { x: W - M - f.widthOfTextAtSize(n, 7.5), y: M - 22, size: 7.5, font: f, color: MUTED });
  });
  const last = w.pages[total - 1];
  last.drawText("Opening names and ECO codes: lichess-org/chess-openings (CC0). Diagrams generated from verified move data. Font: DejaVu Sans.", { x: M, y: M - 34, size: 6.5, font: f, color: MUTED });
  return doc.save();
}
