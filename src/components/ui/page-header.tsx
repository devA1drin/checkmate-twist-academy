/** Left-aligned editorial page header. The eyebrow gets a colour marker: purple for chess, cyan for cube. */
export function PageHeader({ eyebrow, title, desc, children, section }: { eyebrow?: string; title: string; desc?: string; children?: React.ReactNode; section?: "chess" | "cube" | "none" }) {
  const s = section ?? (eyebrow?.toLowerCase().includes("chess") ? "chess" : eyebrow?.toLowerCase().includes("cube") ? "cube" : "none");
  return (
    <header className="mb-10 pb-6 border-b border-line">
      {eyebrow && (
        <div className="eyebrow flex items-center gap-2 mb-3">
          {s !== "none" && <span aria-hidden className={`inline-block h-2.5 w-2.5 ${s === "chess" ? "bg-chess" : "bg-cube"}`} />}
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.05] max-w-4xl">{title}</h1>
      {desc && <p className="text-muted mt-4 max-w-2xl text-[15px] leading-relaxed">{desc}</p>}
      {children}
    </header>
  );
}
