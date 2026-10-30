import Link from "next/link";
/** Shown in local guest mode for features that need the Supabase backend. Never shows sample data. */
export function BackendRequired({ feature }: { feature: string }) {
  return (
    <div className="max-w-2xl border-l-2 border-ink pl-5 py-1">
      <h2 className="font-display text-2xl font-semibold">{feature} {feature.endsWith("s") ? "are" : "is"} not switched on here</h2>
      <p className="mt-3 leading-relaxed">This copy of the site runs in guest mode, without a database, so there are no other people to show. We won&apos;t fill the page with made-up names or sample numbers instead.</p>
      <p className="mt-3 text-sm text-muted leading-relaxed">Site owners: set <code className="alg">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="alg">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and run the SQL migration. The README has the steps.</p>
      <Link href="/dashboard" className="link text-sm mt-4 inline-block">See your own progress on the dashboard</Link>
    </div>
  );
}
