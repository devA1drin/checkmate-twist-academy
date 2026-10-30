"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { BackendRequired } from "@/components/backend-required";

interface U { id: string; email: string; display_name: string | null; username: string | null; role: string; created_at: string }
interface P { id: string; title: string; hidden: boolean; pinned: boolean; locked: boolean; created_at: string; category: string }
interface R { id: number; target_type: string; target_id: string; reason: string; details: string | null; status: string; created_at: string; post_id?: string; preview?: string; hidden?: boolean }

export function AdminPanel() {
  const { configured, user, profile, loading } = useAuth();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<U[]>([]);
  const [posts, setPosts] = useState<P[]>([]);
  const [reports, setReports] = useState<R[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = profile?.role === "admin";
  const isStaff = isAdmin || profile?.role === "moderator";

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb) return;
    const none = Promise.resolve({ data: null, error: null });
    const [s, u, p, r] = await Promise.all([
      isAdmin ? sb.rpc("admin_stats") : none, isAdmin ? sb.rpc("admin_list_users", { lim: 200 }) : none,
      sb.from("posts").select("id, title, hidden, pinned, locked, created_at, category").order("created_at", { ascending: false }).limit(100),
      sb.from("reports").select("id, target_type, target_id, reason, details, status, created_at").eq("status", "open").order("created_at").limit(100),
    ]);
    const err = s.error ?? u.error ?? p.error ?? r.error;
    if (err) setError(err.message);
    const reps = (r.data ?? []) as R[];
    // Attach a short preview and a link target for reported posts and replies.
    const postIds = reps.filter((x) => x.target_type === "post").map((x) => x.target_id);
    const commentIds = reps.filter((x) => x.target_type === "comment").map((x) => x.target_id);
    const [rp, rc] = await Promise.all([
      postIds.length ? sb.from("posts").select("id, title, hidden").in("id", postIds) : none,
      commentIds.length ? sb.from("comments").select("id, post_id, body, hidden").in("id", commentIds) : none,
    ]);
    for (const x of reps) {
      const po = (rp.data as { id: string; title: string; hidden: boolean }[] | null)?.find((y) => y.id === x.target_id);
      const co = (rc.data as { id: string; post_id: string; body: string; hidden: boolean }[] | null)?.find((y) => y.id === x.target_id);
      if (x.target_type === "post" && po) Object.assign(x, { post_id: po.id, preview: po.title, hidden: po.hidden });
      if (x.target_type === "comment" && co) Object.assign(x, { post_id: co.post_id, preview: co.body.slice(0, 160), hidden: co.hidden });
    }
    setStats(s.data as Record<string, number> | null); setUsers((u.data as U[] | null) ?? []); setPosts((p.data as P[]) ?? []); setReports(reps);
  }, [isAdmin]);
  useEffect(() => { if (isStaff) load(); }, [isStaff, load]);

  if (!configured) return <BackendRequired feature="Admin tools" />;
  if (loading) return <p className="text-muted flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Checking access…</p>;
  if (!user) return <div className="card p-6 text-center"><ShieldAlert className="mx-auto text-warn" /><p className="mt-2">Please <Link href="/auth" className="text-electric hover:underline">sign in</Link> with an admin account.</p></div>;
  if (!isStaff) return <div className="card p-6 text-center"><ShieldAlert className="mx-auto text-bad" /><p className="mt-2">Your account does not have the admin or moderator role.</p><p className="text-xs text-muted mt-1">Admins are promoted in the database — see the README.</p></div>;
  const sb = getSupabase()!;

  const setRole = async (id: string, role: string) => { const { error } = await sb.rpc("admin_set_role", { target: id, new_role: role }); if (error) setError(error.message); else load(); };
  const hide = async (p: P) => { const { error } = await sb.from("posts").update({ hidden: !p.hidden }).eq("id", p.id); if (error) setError(error.message); else load(); };
  const flag = async (p: P, k: "pinned" | "locked") => { const { error } = await sb.from("posts").update({ [k]: !p[k] }).eq("id", p.id); if (error) setError(error.message); else load(); };
  const close = async (r: R, status: "resolved" | "dismissed", hideTarget = false) => {
    if (hideTarget && (r.target_type === "post" || r.target_type === "comment")) {
      const { error } = await sb.from(r.target_type === "post" ? "posts" : "comments").update({ hidden: true }).eq("id", r.target_id);
      if (error) { setError(error.message); return; }
    }
    const { error } = await sb.from("reports").update({ status, resolved_by: user.id }).eq("id", r.id);
    if (error) setError(error.message); else load();
  };
  const linkFor = (r: R) => r.target_type === "user" ? `/u/${r.target_id}` : r.target_type === "game" ? `/play/online/${r.target_id}`
    : r.post_id ? `/forum/${r.post_id}${r.target_type === "comment" ? `#r-${r.target_id}` : ""}` : r.target_type === "battle_result" ? `/battle/${r.target_id.split(":")[0]}` : null;
  const del = async (p: P) => { if (!confirm(`Delete "${p.title}"?`)) return; const { error } = await sb.from("posts").delete().eq("id", p.id); if (error) setError(error.message); else load(); };

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-bad">{error}</p>}
      <section>
        <h2 className="font-display text-2xl font-semibold mb-3">Reports <span className="text-muted font-normal text-lg">({reports.length} open)</span></h2>
        {reports.length === 0 ? <p className="text-sm text-muted border-t border-ink pt-3">Nothing to review.</p> : (
          <ul className="border-t border-ink">{reports.map((r) => { const href = linkFor(r); return (
            <li key={r.id} className="py-3 border-b border-line text-sm space-y-1.5">
              <p><span className="font-medium capitalize">{r.target_type.replace("_", " ")}</span> · {r.reason.replace("_", " ")} · <span className="text-muted">{new Date(r.created_at).toLocaleString()}</span>{r.hidden && <span className="text-bad ml-2">already hidden</span>}</p>
              {r.preview && <p className="text-muted line-clamp-2">“{r.preview}”</p>}
              {r.details && <p>Reporter says: {r.details}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                {href && <Link href={href} className="btn btn-ghost">Open</Link>}
                {(r.target_type === "post" || r.target_type === "comment") && !r.hidden && <button className="btn btn-ghost" onClick={() => close(r, "resolved", true)}>Hide it and resolve</button>}
                <button className="btn btn-ghost" onClick={() => close(r, "resolved")}>Mark resolved</button>
                <button className="btn btn-ghost" onClick={() => close(r, "dismissed")}>Dismiss</button>
              </div>
            </li>); })}</ul>
        )}
      </section>
      {isAdmin && <section>
        <h2 className="font-display text-2xl font-semibold mb-3">Usage</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
          {stats ? Object.entries(stats).map(([k, v]) => <div key={k} className="border-t border-ink pt-2"><div className="font-display text-2xl tabular-nums">{v}</div><div className="text-xs text-muted capitalize">{k.replace(/_/g, " ")}</div></div>) : <Loader2 className="animate-spin" />}
        </div>
      </section>}
      {isAdmin && <section>
        <h2 className="font-display text-2xl font-semibold mb-3">Users and roles</h2>
        <div className="card overflow-auto">
          <table className="w-full text-sm"><thead className="bg-surface-2 text-left text-muted"><tr><th className="p-2">Email</th><th className="p-2">Name</th><th className="p-2">Joined</th><th className="p-2">Role</th></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-t border-line"><td className="p-2">{u.email}</td><td className="p-2">{u.display_name ?? u.username ?? "—"}</td><td className="p-2 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-2"><select className="input !py-1 !w-auto" value={u.role} disabled={u.id === user.id} onChange={(e) => setRole(u.id, e.target.value)}><option value="student">student</option><option value="moderator">moderator</option><option value="admin">admin</option></select></td></tr>
            ))}</tbody></table>
        </div>
      </section>}
      <section>
        <h2 className="font-display text-2xl font-semibold mb-3">Moderation</h2>
        {posts.length === 0 ? <p className="text-sm text-muted">No posts.</p> : (
          <div className="card divide-y divide-line">{posts.map((p) => (
            <div key={p.id} className="p-3 flex items-center gap-3 text-sm"><span className="chip">{p.category}</span><Link href={`/forum/${p.id}`} className={`flex-1 hover:underline ${p.hidden ? "line-through text-muted" : ""}`}>{p.title}</Link>
              <button className="btn btn-ghost !py-1 text-xs" onClick={() => flag(p, "pinned")}>{p.pinned ? "Unpin" : "Pin"}</button><button className="btn btn-ghost !py-1 text-xs" onClick={() => flag(p, "locked")}>{p.locked ? "Unlock" : "Lock"}</button><button className="btn btn-ghost !py-1 text-xs" onClick={() => hide(p)}>{p.hidden ? "Unhide" : "Hide"}</button><button className="btn btn-ghost !py-1 text-xs" onClick={() => del(p)}>Delete</button></div>
          ))}</div>
        )}
      </section>
    </div>
  );
}
