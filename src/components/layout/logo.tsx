/** Flat mark: a 2×2 board where the purple square is chess and the cyan square is the cube. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="21" height="21" fill="none" stroke="currentColor" />
      <rect x="1" y="1" width="10" height="10" style={{ fill: "var(--purple)" }} />
      <rect x="11" y="11" width="10" height="10" style={{ fill: "var(--cyan)" }} />
    </svg>
  );
}
