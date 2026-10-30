"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldAlert, Users, BarChart3, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { BackendRequired } from "@/components/backend-required";

interface U { id: string; email: string; display_name: string | null; username: string | null; role: string; created_at: string }
interface P { id: string; title: string; hidden: boolean; created_at: string; category: string }

export function AdminPanel() {
  const { configured, user, profile, loading } = useAuth();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<U[]>([]);
  const [posts, setPosts] = useState<P[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = profile?.role === "admin";

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb) return;
    const [s, u, p] = await Promise.all([
      sb.rpc("admin_stats"), sb.rpc("admin_list_users", { lim: 200 }),
      sb.from("posts").select("id, title, hidden, created_at, category").order("created_at", { ascending: false }).limit(100),
    ]);
    const err = s.error ?? u.error ?? p.error;
    if (err) setError(err.message);
    setStats(s.data as Record<string, number>); setUsers((u.data as U[]) ?? []); setPosts((p.data as P[]) ?? []);
  }, []);
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  if (!configured) return <BackendRequired feature="Admin tools" />;
  if (loading) return <p className="text-muted flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Checking access…</p>;
  if (!user) return <div className="card p-6 text-center"><ShieldAlert className="mx-auto text-amber-400" /><p className="mt-2">Please <Link href="/auth" className="text-electric hover:underline">sign in</Link> with an admin account.</p></div>;
  if (!isAdmin) return <div className="card p-6 text-center"><ShieldAlert className="mx-auto text-red-400" /><p className="mt-2">Your account does not have the admin role.</p><p className="text-xs text-muted mt-1">Admins are promoted in the database — see the README.</p></div>;
  const sb = getSupabase()!;

  const setRole = async (id: string, role: string) => { const { error } = await sb.rpc("admin_set_role", { target: id, new_role: role }); if (error) setError(error.message); else load(); };
  const hide = async (p: P) => { const { error } = await sb.from("posts").update({ hidden: !p.hidden }).eq("id", p.id); if (error) setError(error.message); else load(); };
  const del = async (p: P) => { if (!confirm(`Delete "${p.title}"?`)) return; const { error } = await sb.from("posts").delete().eq("id", p.id); if (error) setError(error.message); else load(); };

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <section>
        <h2 className="font-semibold mb-3 flex items-center gap-2"><BarChart3 size={17} className="text-aqua" /> Usage</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
          {stats ? Object.entries(stats).map(([k, v]) => <div key={k} className="card p-3"><div className="text-xl font-bold font-mono">{v}</div><div className="text-xs text-muted capitalize">{k.replace(/_/g, " ")}</div></div>) : <Loader2 className="animate-spin" />}
        </div>
      </section>
      <section>
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Users size={17} className="text-aqua" /> Users &amp; roles</h2>
        <div className="card overflow-auto">
          <table className="w-full text-sm"><thead className="bg-surface-2 text-left text-muted"><tr><th className="p-2">Email</th><th className="p-2">Name</th><th className="p-2">Joined</th><th className="p-2">Role</th></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-t border-line"><td className="p-2">{u.email}</td><td className="p-2">{u.display_name ?? u.username ?? "—"}</td><td className="p-2 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-2"><select className="input !py-1 !w-auto" value={u.role} disabled={u.id === user.id} onChange={(e) => setRole(u.id, e.target.value)}><option value="student">student</option><option value="moderator">moderator</option><option value="admin">admin</option></select></td></tr>
            ))}</tbody></table>
        </div>
      </section>
      <section>
        <h2 className="font-semibold mb-3 flex items-center gap-2"><MessageSquare size={17} className="text-aqua" /> Moderation</h2>
        {posts.length === 0 ? <p className="text-sm text-muted">No posts.</p> : (
          <div className="card divide-y divide-line">{posts.map((p) => (
            <div key={p.id} className="p-3 flex items-center gap-3 text-sm"><span className="chip">{p.category}</span><span className={`flex-1 ${p.hidden ? "line-through text-muted" : ""}`}>{p.title}</span>
              <button className="btn btn-ghost !py-1 text-xs" onClick={() => hide(p)}>{p.hidden ? "Unhide" : "Hide"}</button><button className="btn btn-ghost !py-1 text-xs" onClick={() => del(p)}>Delete</button></div>
          ))}</div>
        )}
      </section>
    </div>
  );
}
