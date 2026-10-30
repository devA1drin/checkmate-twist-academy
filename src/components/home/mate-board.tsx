"use client";
import { useState } from "react";
import { Board, tryMove } from "@/components/chess/board";

const START = "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4";

/** A real, playable position: the user has to find the mate. Checked with chess.js, not hard-coded. */
export function MateBoard() {
  const [fen, setFen] = useState(START);
  const [last, setLast] = useState<[string, string] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const reset = () => { setFen(START); setLast(null); setMsg(null); };
  const onMove = (from: string, to: string) => {
    if (fen !== START) return false;
    const r = tryMove(fen, from, to);
    if (!r?.move) return false;
    setFen(r.game.fen()); setLast([from, to]);
    setMsg(r.game.isCheckmate()
      ? { ok: true, text: `${r.move.san}. Checkmate. The queen on f7 is defended by the bishop on c4, so the king cannot take it.` }
      : { ok: false, text: `${r.move.san} is legal, but Black is not mated. Reset and look at f7.` });
    return true;
  };
  return (
    <figure>
      <Board id="home-mate" fen={fen} onMove={onMove} lastMove={last} />
      <figcaption className="mt-3 text-sm flex items-start gap-3 min-h-[3.25rem]">
        <span className="flex-1">
          {msg ? <span className={msg.ok ? "text-ok" : "text-fg"}>{msg.text}</span>
            : <><span className="font-medium">White to move and mate in one.</span> <span className="text-muted">Drag or tap a piece. Black has just played …Nf6?</span></>}
        </span>
        {msg && <button onClick={reset} className="btn btn-ghost !py-1 !px-2.5 text-xs shrink-0">Reset</button>}
      </figcaption>
    </figure>
  );
}
