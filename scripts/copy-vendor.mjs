// Copies browser-side engine files (Stockfish WASM + cubejs solver) into /public.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nm = join(root, "node_modules");
const copies = [
  ["stockfish/bin/stockfish-19-lite-single.js", "public/stockfish/stockfish-19-lite-single.js"],
  ["stockfish/bin/stockfish-19-lite-single.wasm", "public/stockfish/stockfish-19-lite-single.wasm"],
  ["stockfish/Copying.txt", "public/stockfish/COPYING-GPLv3.txt"],
  ["cubejs/lib/cube.js", "public/vendor/cubejs/cube.js"],
  ["cubejs/lib/solve.js", "public/vendor/cubejs/solve.js"],
  ["cubejs/LICENSE", "public/vendor/cubejs/LICENSE.txt"],
];
for (const [from, to] of copies) {
  mkdirSync(dirname(join(root, to)), { recursive: true });
  copyFileSync(join(nm, from), join(root, to));
}
console.log(`copied ${copies.length} vendor files to public/`);
