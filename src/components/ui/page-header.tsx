export function PageHeader({ eyebrow, title, desc, children }: { eyebrow?: string; title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <div className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua mb-2">{eyebrow}</div>}
      <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
      {desc && <p className="text-muted mt-3 max-w-3xl">{desc}</p>}
      {children}
    </div>
  );
}
