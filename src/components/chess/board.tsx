"use client";
import { Chessboard } from "react-chessboard";
import { Chess, type Square } from "chess.js";
import { useMemo, useState } from "react";

export interface BoardProps {
  id: string;
  fen: string;
  orientation?: "white" | "black";
  /** Return true if the move was accepted. Omit for a read-only board. */
  onMove?: (from: string, to: string, promotion?: string) => boolean;
  arrows?: { startSquare: string; endSquare: string; color: string }[];
  highlight?: Record<string, React.CSSProperties>;
  lastMove?: [string, string] | null;
  className?: string;
}

const DARK = { backgroundColor: "var(--board-dark)" };
const LIGHT = { backgroundColor: "var(--board-light)" };

/** react-chessboard with drag-and-drop and tap-to-move, legal-move hints and last-move highlight. */
export function Board({ id, fen, orientation = "white", onMove, arrows, highlight, lastMove, className }: BoardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const game = useMemo(() => { try { return new Chess(fen); } catch { return null; } }, [fen]);

  const targets = useMemo(() => {
    if (!selected || !game) return [] as string[];
    try { return game.moves({ square: selected as Square, verbose: true }).map((m) => m.to); } catch { return []; }
  }, [selected, game]);

  const styles: Record<string, React.CSSProperties> = {};
  if (lastMove) for (const s of lastMove) styles[s] = { boxShadow: "inset 0 0 0 100px rgba(230,190,60,.42)" };
  if (selected) styles[selected] = { boxShadow: "inset 0 0 0 3px var(--blue)" };
  for (const t of targets) styles[t] = { ...styles[t], backgroundImage: "radial-gradient(circle, rgba(15,20,32,.38) 18%, transparent 20%)" };
  if (game?.inCheck()) {
    const b = game.board();
    for (const row of b) for (const p of row) if (p && p.type === "k" && p.color === game.turn()) styles[p.square] = { ...styles[p.square], boxShadow: "inset 0 0 0 3px #d93a2b" };
  }
  Object.assign(styles, highlight);

  const ownPiece = (sq: string) => { const p = game?.get(sq as Square); return !!p && p.color === game?.turn(); };

  return (
    <div className={className}>
      <Chessboard options={{
        id, position: fen, boardOrientation: orientation, arrows: arrows ?? [], squareStyles: styles,
        allowDragging: !!onMove, darkSquareStyle: DARK, lightSquareStyle: LIGHT, animationDurationInMs: 180,
        boardStyle: { borderRadius: "2px", overflow: "hidden", border: "1px solid var(--border)" },
        canDragPiece: ({ square }) => !!onMove && !!square && ownPiece(square),
        onPieceDrop: ({ sourceSquare, targetSquare }) => {
          setSelected(null);
          if (!onMove || !targetSquare) return false;
          return onMove(sourceSquare, targetSquare);
        },
        onSquareClick: ({ square }) => {
          if (!onMove) return;
          if (selected && targets.includes(square)) { onMove(selected, square); setSelected(null); return; }
          setSelected(ownPiece(square) && selected !== square ? square : null);
        },
      }} />
    </div>
  );
}

/** Try a move on a copy of `fen`. Auto-promotes to a queen unless `promotion` is given. */
export function tryMove(fen: string, from: string, to: string, promotion = "q") {
  const g = new Chess(fen);
  try {
    const piece = g.get(from as Square);
    const needsPromo = piece?.type === "p" && (to[1] === "8" || to[1] === "1");
    const m = g.move({ from, to, promotion: needsPromo ? promotion : undefined });
    return { game: g, move: m };
  } catch { return null; }
}
