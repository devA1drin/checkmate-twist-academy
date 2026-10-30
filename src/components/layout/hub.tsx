import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NAV } from "./nav-data";
import { PageHeader } from "@/components/ui/page-header";

/** A section's index page: one sentence of purpose, then every page in the section as a ruled list. */
export function Hub({ section, title, desc, children }: { section: string; title: string; desc: string; children?: React.ReactNode }) {
  const g = NAV.find((x) => x.label === section)!;
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow={section} title={title} desc={desc} section="none" />
      {children}
      <ul className="border-t border-ink">
        {g.items.map((i) => (
          <li key={i.href} className="border-b border-line">
            <Link href={i.href} className="group grid grid-cols-[1fr_auto] sm:grid-cols-[220px_1fr_auto] gap-x-6 gap-y-0.5 py-4 items-center min-h-[64px]">
              <span className="font-medium text-[17px] group-hover:underline underline-offset-4">{i.label}</span>
              <span className="text-sm text-muted col-start-1 sm:col-start-auto">{i.desc}</span>
              <ArrowRight size={17} className="text-muted group-hover:text-fg row-span-2 sm:row-span-1 col-start-2 sm:col-start-auto row-start-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
