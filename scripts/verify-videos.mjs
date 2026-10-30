// Re-checks every embedded YouTube video ID with YouTube's public oEmbed endpoint.
import { readFileSync } from "node:fs";
const vids = JSON.parse(readFileSync(new URL("../src/data/videos.json", import.meta.url), "utf8"));
let bad = 0;
for (const v of vids) {
  const r = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${v.id}`);
  const ok = r.status === 200;
  const meta = ok ? await r.json() : null;
  if (!ok) bad++;
  console.log(`${ok ? "OK " : "BAD"} ${r.status} ${v.id} ${meta ? `${meta.title} | ${meta.author_name}` : ""}`);
}
console.log(`${vids.length - bad}/${vids.length} video IDs verified via oEmbed`);
process.exit(bad ? 1 : 0);
