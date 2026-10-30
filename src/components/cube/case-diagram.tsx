import { caseState } from "@/lib/cube/cases";
import { STICKER_COLORS_2D } from "./colors";

/**
 * Last-layer diagram generated from cube state (inverse of the algorithm applied to a solved cube).
 * OLL mode shows only yellow (U) stickers; PLL/F2L modes show full colors. Nothing is hand-drawn.
 */
export function CaseDiagram({ alg, mode, size = 104 }: { alg: string; mode: "OLL" | "PLL" | "F2L"; size?: number }) {
  let s: string;
  try { s = caseState(alg); } catch { return <div className="text-xs text-bad">invalid alg</div>; }
  const color = (i: number) => (s[i] === "U" ? STICKER_COLORS_2D.D : "var(--surface-2)");
  const pal = (i: number) => {
    const c = s[i];
    if (mode === "OLL") return color(i);
    // shown as held with yellow on top / green in front (a z2 rotation of the white-top model)
    const map: Record<string, string> = { U: STICKER_COLORS_2D.D, D: STICKER_COLORS_2D.U, F: STICKER_COLORS_2D.F, B: STICKER_COLORS_2D.B, R: STICKER_COLORS_2D.L, L: STICKER_COLORS_2D.R };
    return map[c];
  };
  const cell = 20, gap = 2, side = 7, o = side + gap + 2;
  const W = o * 2 + cell * 3 + gap * 2;
  const top = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  // side strips as seen from above: back (B top row reversed), front (F top row), left (L top row), right (R top row reversed)
  const back = [47, 46, 45], front = [18, 19, 20], left = [36, 37, 38], right = [11, 10, 9];
  return (
    <svg viewBox={`0 0 ${W} ${W}`} width={size} height={size} role="img" aria-label={`${mode} case diagram`}>
      {top.map((i) => (
        <rect key={i} x={o + (i % 3) * (cell + gap)} y={o + Math.floor(i / 3) * (cell + gap)} width={cell} height={cell} rx={1.5} style={{ fill: pal(i) }} stroke="#0b1220" strokeWidth={0.8} />
      ))}
      {back.map((i, k) => <rect key={`b${i}`} x={o + k * (cell + gap)} y={2} width={cell} height={side} rx={1} style={{ fill: pal(i) }} stroke="#0b1220" strokeWidth={0.6} />)}
      {front.map((i, k) => <rect key={`f${i}`} x={o + k * (cell + gap)} y={o + 3 * cell + 2 * gap + gap} width={cell} height={side} rx={1} style={{ fill: pal(i) }} stroke="#0b1220" strokeWidth={0.6} />)}
      {left.map((i, k) => <rect key={`l${i}`} x={2} y={o + k * (cell + gap)} width={side} height={cell} rx={1} style={{ fill: pal(i) }} stroke="#0b1220" strokeWidth={0.6} />)}
      {right.map((i, k) => <rect key={`r${i}`} x={o + 3 * cell + 2 * gap + gap} y={o + k * (cell + gap)} width={side} height={cell} rx={1} style={{ fill: pal(i) }} stroke="#0b1220" strokeWidth={0.6} />)}
    </svg>
  );
}
