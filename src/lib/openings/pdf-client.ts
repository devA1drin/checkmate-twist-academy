"use client";
import { KIT_BY_SLUG } from "@/data/openings/kits";

/** Generate a PDF for the given kits in the browser and start the download. pdf-lib loads only when needed. */
export async function downloadKitsPdf(slugs: string[], opts: { title?: string; owner?: string; filename: string }) {
  const [{ buildOpeningsPdf }, games, videos, regular, bold] = await Promise.all([
    import("./pdf"),
    import("@/data/openings/model-games.json").then((m) => m.default),
    import("@/data/videos.json").then((m) => m.default),
    fetch("/fonts/pdf/DejaVuSans.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/pdf/DejaVuSans-Bold.ttf").then((r) => r.arrayBuffer()),
  ]);
  const bytes = await buildOpeningsPdf({ kits: slugs.map((s) => KIT_BY_SLUG[s]), games, videos, fonts: { regular, bold }, title: opts.title, owner: opts.owner });
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url; a.download = opts.filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
