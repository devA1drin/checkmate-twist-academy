import Link from "next/link";
import { Database } from "lucide-react";
/** Shown in local guest mode for features that need the Supabase backend. Never shows sample data. */
export function BackendRequired({ feature }: { feature: string }) {
  return (
    <div className="card p-8 text-center max-w-2xl mx-auto">
      <Database className="mx-auto text-aqua" size={36} />
      <h2 className="text-xl font-semibold mt-3">{feature}: online backend required</h2>
      <p className="text-muted mt-2 text-sm">This copy of Checkmate &amp; Twist Academy is running in <strong>local guest mode</strong> (no Supabase project configured), so there are no other users to show. We don&apos;t display made-up players or sample data. To enable it, set <code className="alg">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="alg">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and run the SQL migration — see the README.</p>
      <Link href="/dashboard" className="btn btn-ghost mt-4">Go to your local dashboard</Link>
    </div>
  );
}
