export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82ff" /><stop offset=".55" stopColor="#8b5cf6" /><stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#lg)" />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
        <rect key={`${r}${c}`} x={8 + c * 8.5} y={8 + r * 8.5} width="7" height="7" rx="1.6" fill={(r + c) % 2 ? "rgba(255,255,255,.95)" : "rgba(6,10,24,.55)"} />
      )))}
    </svg>
  );
}
