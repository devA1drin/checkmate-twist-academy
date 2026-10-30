import Link from "next/link";
import { NAV } from "./nav-data";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-t border-line mt-20 bg-bg-2">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-bold"><Logo size={28} /> Checkmate &amp; Twist Academy</div>
          <p className="text-sm text-muted mt-3 max-w-sm">A learning platform for chess players and speedcubers. Camera images are processed on your device only — nothing is uploaded.</p>
          <p className="text-xs text-muted mt-3">Puzzles: <a className="underline" href="https://database.lichess.org/#puzzles" target="_blank" rel="noreferrer">Lichess puzzle database</a> (CC0). Engine: <a className="underline" href="https://github.com/nmrugg/stockfish.js" target="_blank" rel="noreferrer">Stockfish.js</a> (GPLv3). Cube solver: Kociemba two-phase via <a className="underline" href="https://github.com/ldez/cubejs" target="_blank" rel="noreferrer">cubejs</a> (MIT).</p>
        </div>
        {NAV.map((g) => (
          <div key={g.label}>
            <div className="text-xs uppercase tracking-widest text-muted mb-2">{g.label}</div>
            {g.items.map((i) => <Link key={i.href} href={i.href} className="block text-sm py-1 hover:text-electric">{i.label}</Link>)}
          </div>
        ))}
      </div>
      <div className="border-t border-line text-xs text-muted py-4 text-center">
        © {new Date().getFullYear()} Checkmate &amp; Twist Academy · <Link href="/privacy" className="underline">Privacy</Link>
      </div>
    </footer>
  );
}
