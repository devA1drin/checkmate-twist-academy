// Usage: node scripts/sf-eval.cjs "<fen>" [depth]  -> prints final score + pv
const fen = process.argv[2], depth = process.argv[3] || 22;
const sf = require("stockfish")("lite-single", (line) => {
  if (line.startsWith("info") && line.includes(" pv ")) last = line;
  if (line.startsWith("bestmove")) { const m = last.match(/score (cp|mate) (-?\d+).* pv (.*)/); console.log(`${m[1]} ${m[2]} | ${m[3].split(" ").slice(0, 8).join(" ")}`); sf.terminate(); }
});
let last = "";
sf.processCommand("uci"); sf.processCommand(`position fen ${fen}`); sf.processCommand(`go depth ${depth}`);
