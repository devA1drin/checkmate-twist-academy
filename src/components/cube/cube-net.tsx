import { STICKER_COLORS_2D } from "./colors";

/** Unfolded cube net (U on top, L F R B in the middle row, D below), drawn from facelets, any size. */
export function CubeNet({ state, n = 3, size, onSticker, highlight, label = "Cube net" }: { state: string; n?: number; size?: number; onSticker?: (i: number) => void; highlight?: number[]; label?: string }) {
  const layout: Record<string, [number, number]> = { U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2] };
  const faces = "URFDLB";
  const s = size ?? 42 / n;
  return (
    <svg viewBox={`0 0 ${4 * n * s + 4 + 6} ${3 * n * s + 4 + 4}`} className="w-full h-auto max-w-[420px]" role="img" aria-label={label}>
      {faces.split("").map((f, fi) => {
        const [fx, fy] = layout[f];
        return Array.from({ length: n * n }, (_, k) => {
          const i = fi * n * n + k;
          const x = 2 + fx * (n * s + 2) + (k % n) * s, y = 2 + fy * (n * s + 2) + Math.floor(k / n) * s;
          const hl = highlight?.includes(i);
          return (
            <rect key={i} x={x + 0.6} y={y + 0.6} width={s - 1.2} height={s - 1.2} rx={s * 0.15}
              fill={STICKER_COLORS_2D[state[i]] ?? "#3a4466"} stroke={hl ? "#22d3ee" : "#060a18"} strokeWidth={hl ? 2 : 0.8}
              onClick={onSticker ? () => onSticker(i) : undefined} style={onSticker ? { cursor: "pointer" } : undefined}
              {...(onSticker ? { role: "button", tabIndex: 0, "aria-label": `${f} face, sticker ${k + 1}`, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSticker(i); } } } : {})}>
              {onSticker && <title>{`${f} face, sticker ${k + 1}`}</title>}
            </rect>
          );
        });
      })}
    </svg>
  );
}
