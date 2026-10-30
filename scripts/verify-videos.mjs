// Re-checks every embedded YouTube video with YouTube's public oEmbed endpoint:
// the video must exist (HTTP 200) and the channel (author_name) must match videos.json.
import { readFileSync } from "node:fs";
const vids = JSON.parse(readFileSync(new URL("../src/data/videos.json", import.meta.url), "utf8"));
let bad = 0;
const seen = new Set();
for (const v of vids) {
  if (seen.has(v.id)) { bad++; console.log(`DUP ${v.id}`); continue; }
  seen.add(v.id);
  const r = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${v.id}`);
  const meta = r.status === 200 ? await r.json() : null;
  const ok = !!meta && meta.author_name === v.channel;
  if (!ok) bad++;
  console.log(`${ok ? "OK " : "BAD"} ${r.status} ${v.id} ${meta ? `${meta.title} | ${meta.author_name}` : ""}${meta && !ok ? ` (expected ${v.channel})` : ""}`);
}
console.log(`${vids.length - bad}/${vids.length} video IDs verified via oEmbed (status 200 + matching channel)`);
process.exit(bad ? 1 : 0);
