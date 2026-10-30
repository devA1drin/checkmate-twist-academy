import { Chess } from "chess.js";

export interface Ply { san: string; from: string; to: string; fen: string }
export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Play a space-separated SAN string from the start position. Throws on an illegal move (data is verified at build time). */
export function playSan(moves: string): Ply[] {
  const g = new Chess();
  return moves.trim().split(/\s+/).filter(Boolean).map((san) => { const m = g.move(san); return { san: m.san, from: m.from, to: m.to, fen: g.fen() }; });
}

/** "1. e4 e5 2. Nf3" style text. */
export function numbered(plies: { san: string }[], startPly = 0): string {
  return plies.map((p, i) => { const n = startPly + i; return n % 2 === 0 ? `${n / 2 + 1}. ${p.san}` : p.san; }).join(" ");
}

/** Link that opens a move list in the analysis board. */
export const analysisHref = (moves: string) => `/chess/analysis?pgn=${encodeURIComponent(numbered(moves.trim().split(/\s+/).map((san) => ({ san }))))}`;
