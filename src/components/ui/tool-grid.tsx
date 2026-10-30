import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
/** Compact list of tools: a ruled row per tool rather than a grid of icon cards. */
export function ToolGrid({ tools, label = "Tools" }: { tools: { href: string; title: string; desc: string }[]; label?: string }) {
  return (
    <section className="mb-14">
      <div className="eyebrow mb-2">{label}</div>
      <ul className="border-t border-ink grid sm:grid-cols-2">
        {tools.map((t) => (
          <li key={t.href} className="border-b border-line sm:odd:border-r sm:odd:pr-6 sm:even:pl-6">
            <Link href={t.href} className="group flex items-baseline gap-4 py-3.5">
              <span className="font-medium group-hover:underline underline-offset-4 shrink-0">{t.title}</span>
              <span className="text-sm text-muted flex-1">{t.desc}</span>
              <ArrowUpRight size={15} className="text-muted group-hover:text-fg shrink-0 self-center" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
