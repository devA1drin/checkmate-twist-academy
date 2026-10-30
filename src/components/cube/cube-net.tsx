import { STICKER_COLORS_2D } from "./colors";

/** Unfolded cube net (U on top, L F R B in the middle row, D below), drawn from facelets. */
export function CubeNet({ state, size = 14, onSticker, highlight }: { state: string; size?: number; onSticker?: (i: number) => void; highlight?: number[] }) {
  const layout: Record<string, [number, number]> = { U: [3, 0], L: [0, 3], F: [3, 3], R: [6, 3], B: [9, 3], D: [3, 6] };
  const faces = "URFDLB";
  const s = size;
  return (
    <svg viewBox={`0 0 ${12 * s + 4} ${9 * s + 4}`} className="w-full h-auto max-w-[420px]" role="img" aria-label="Cube net">
      {faces.split("").map((f, fi) => {
        const [ox, oy] = layout[f];
        return Array.from({ length: 9 }, (_, k) => {
          const i = fi * 9 + k;
          const x = 2 + (ox + (k % 3)) * s, y = 2 + (oy + Math.floor(k / 3)) * s;
          return (
            <rect key={i} x={x + 0.6} y={y + 0.6} width={s - 1.2} height={s - 1.2} rx={s * 0.15}
              fill={STICKER_COLORS_2D[state[i]] ?? "#3a4466"} stroke={highlight?.includes(i) ? "#22d3ee" : "#060a18"} strokeWidth={highlight?.includes(i) ? 2 : 0.8}
              onClick={onSticker ? () => onSticker(i) : undefined} style={onSticker ? { cursor: "pointer" } : undefined} />
          );
        });
      })}
    </svg>
  );
}
