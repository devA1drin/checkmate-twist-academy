import Link from "next/link";
import type { LucideIcon } from "lucide-react";
export function ToolGrid({ tools }: { tools: { href: string; title: string; desc: string; icon: LucideIcon }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
      {tools.map((t) => (
        <Link key={t.href} href={t.href} className="card p-4 hover:border-electric transition group">
          <t.icon className="text-aqua" size={22} />
          <div className="mt-2 font-semibold group-hover:text-electric">{t.title}</div>
          <p className="text-sm text-muted mt-1">{t.desc}</p>
        </Link>
      ))}
    </div>
  );
}
