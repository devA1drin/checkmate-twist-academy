"use client";
/**
 * Stockfish 19 (lite, single-threaded WASM) running in a Web Worker, spoken to over UCI.
 * The engine files are served from /public/stockfish (copied from the `stockfish` npm package).
 */
export interface EngineLine { multipv: number; depth: number; scoreCp?: number; mate?: number; pv: string[] }
export interface SearchOptions { depth?: number; movetime?: number; multipv?: number; skill?: number }
type InfoCb = (lines: EngineLine[]) => void;

export const ENGINE_PATH = "/stockfish/stockfish-19-lite-single.js";

export class StockfishEngine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private resolveBest: ((m: string) => void) | null = null;
  private onInfo: InfoCb | null = null;
  private lines = new Map<number, EngineLine>();
  private turn: "w" | "b" = "w";
  private searching = false;
  private chain: Promise<unknown> = Promise.resolve();
  public error: string | null = null;

  init(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = new Promise((resolve, reject) => {
      if (typeof WebAssembly !== "object") { this.error = "WebAssembly is not supported in this browser."; reject(new Error(this.error)); return; }
      try { this.worker = new Worker(ENGINE_PATH); } catch (e) { this.error = String(e); reject(e); return; }
      const timer = setTimeout(() => { this.error = "Stockfish did not start (timeout)."; reject(new Error(this.error)); }, 20000);
      this.worker.onerror = (e) => { this.error = e.message || "Stockfish worker crashed"; clearTimeout(timer); reject(new Error(this.error)); };
      this.worker.onmessage = (e: MessageEvent) => {
        const line = String(e.data);
        if (line === "readyok") { clearTimeout(timer); resolve(); return; }
        this.handle(line);
      };
      this.send("uci");
      this.send("isready");
    });
    return this.ready;
  }

  private send(cmd: string) { this.worker?.postMessage(cmd); }

  private handle(line: string) {
    if (line.startsWith("info") && line.includes(" pv ")) {
      const depth = +(line.match(/ depth (\d+)/)?.[1] ?? 0);
      const multipv = +(line.match(/ multipv (\d+)/)?.[1] ?? 1);
      const cp = line.match(/ score cp (-?\d+)/);
      const mate = line.match(/ score mate (-?\d+)/);
      const pv = line.split(" pv ")[1].trim().split(" ");
      const sign = this.turn === "w" ? 1 : -1; // normalize to White's point of view
      this.lines.set(multipv, { multipv, depth, pv, scoreCp: cp ? sign * +cp[1] : undefined, mate: mate ? sign * +mate[1] : undefined });
      this.onInfo?.([...this.lines.values()].sort((a, b) => a.multipv - b.multipv));
    } else if (line.startsWith("bestmove")) {
      this.searching = false;
      const r = this.resolveBest; this.resolveBest = null;
      r?.(line.split(" ")[1]);
    }
  }

  /** Start a search; any running search is stopped first. Resolves with the best move (UCI). */
  search(fen: string, opts: SearchOptions, onInfo?: InfoCb): Promise<string> {
    const run = async () => {
      await this.init();
      if (this.searching) await this.stopAndWait();
      this.lines.clear();
      this.onInfo = onInfo ?? null;
      this.turn = (fen.split(" ")[1] as "w" | "b") ?? "w";
      this.send(`setoption name MultiPV value ${opts.multipv ?? 1}`);
      this.send(`setoption name Skill Level value ${opts.skill ?? 20}`);
      this.send(`position fen ${fen}`);
      this.searching = true;
      const p = new Promise<string>((res) => (this.resolveBest = res));
      this.send(opts.movetime ? `go movetime ${opts.movetime}${opts.depth ? ` depth ${opts.depth}` : ""}` : `go depth ${opts.depth ?? 18}`);
      return p;
    };
    const next = this.chain.then(run, run);
    this.chain = next.catch(() => undefined);
    return next;
  }

  private stopAndWait(): Promise<void> {
    return new Promise((res) => {
      const prev = this.resolveBest;
      this.resolveBest = (m) => { prev?.(m); res(); };
      this.send("stop");
    });
  }

  stop() { if (this.searching) this.send("stop"); }
  newGame() { this.send("ucinewgame"); this.send("isready"); }
  terminate() { this.worker?.terminate(); this.worker = null; this.ready = null; }
}

/** Strength presets for "Play vs Stockfish". Lower levels use Stockfish's Skill Level + shallow depth. */
export const LEVELS = [
  { level: 1, label: "Level 1 · Novice", skill: 0, depth: 1, movetime: 100 },
  { level: 2, label: "Level 2 · Casual", skill: 3, depth: 2, movetime: 150 },
  { level: 3, label: "Level 3 · Club beginner", skill: 6, depth: 4, movetime: 200 },
  { level: 4, label: "Level 4 · Club player", skill: 9, depth: 6, movetime: 300 },
  { level: 5, label: "Level 5 · Strong club", skill: 12, depth: 8, movetime: 400 },
  { level: 6, label: "Level 6 · Expert", skill: 15, depth: 10, movetime: 600 },
  { level: 7, label: "Level 7 · Master", skill: 18, depth: 14, movetime: 900 },
  { level: 8, label: "Level 8 · Full strength", skill: 20, depth: 22, movetime: 1500 },
];

export function formatScore(l?: EngineLine): string {
  if (!l) return "…";
  if (l.mate !== undefined) return `${l.mate > 0 ? "+" : "-"}M${Math.abs(l.mate)}`;
  const v = (l.scoreCp ?? 0) / 100;
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}`;
}
