import { Chess } from "chess.js";
/** Convert a UCI principal variation into SAN (stops at the first illegal move). */
export function pvToSan(fen: string, pv: string[], max = 10): string[] {
  const g = new Chess(fen); const out: string[] = [];
  for (const u of pv.slice(0, max)) {
    try { out.push(g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san); } catch { break; }
  }
  return out;
}
/** Human-readable game-over reason, or null. */
export function gameOverText(g: Chess): string | null {
  if (g.isCheckmate()) return `Checkmate — ${g.turn() === "w" ? "Black" : "White"} wins`;
  if (g.isStalemate()) return "Draw by stalemate";
  if (g.isInsufficientMaterial()) return "Draw — insufficient material";
  if (g.isThreefoldRepetition()) return "Draw by threefold repetition";
  if (g.isDraw()) return "Draw (50-move rule)";
  return null;
}
