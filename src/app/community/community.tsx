"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, Send, Trash2, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { BackendRequired } from "@/components/backend-required";

interface Author { display_name: string | null; username: string | null }
interface Post { id: string; user_id: string; category: string; title: string; body: string; hidden: boolean; created_at: string; profiles: Author | null }
interface Comment { id: string; user_id: string; body: string; hidden: boolean; created_at: string; profiles: Author | null }
const who = (a: Author | null) => a?.display_name || a?.username || "Student";
const when = (s: string) => new Date(s).toLocaleString();

export function Community() {
  const { configured, user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [cat, setCat] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", body: "", category: "general" });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reply, setReply] = useState("");
  const staff = profile?.role === "admin" || profile?.role === "moderator";

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb) return;
    let q = sb.from("posts").select("id, user_id, category, title, body, hidden, created_at, profiles(display_name, username)").order("created_at", { ascending: false }).limit(50);
    if (cat !== "all") q = q.eq("category", cat);
    const { data, error } = await q;
    if (error) setError(error.message); else { setError(null); setPosts(data as unknown as Post[]); }
  }, [cat]);
  useEffect(() => { load(); }, [load]);

  const loadComments = async (id: string) => {
    const sb = getSupabase(); if (!sb) return;
    const { data } = await sb.from("comments").select("id, user_id, body, hidden, created_at, profiles(display_name, username)").eq("post_id", id).order("created_at");
    setComments((data as unknown as Comment[]) ?? []);
  };

  if (!configured) return <BackendRequired feature="The community board" />;
  const sb = getSupabase()!;

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await sb.from("posts").insert({ title: draft.title.trim(), body: draft.body.trim(), category: draft.category });
    setBusy(false);
    if (error) setError(error.message); else { setDraft({ title: "", body: "", category: draft.category }); load(); }
  };
  const del = async (table: "posts" | "comments", id: string) => {
    if (!confirm("Delete this permanently?")) return;
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) setError(error.message); else if (table === "posts") load(); else if (open) loadComments(open);
  };
  const toggleHide = async (p: Post) => { const { error } = await sb.from("posts").update({ hidden: !p.hidden }).eq("id", p.id); if (error) setError(error.message); else load(); };
  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault(); if (!open || !reply.trim()) return;
    const { error } = await sb.from("comments").insert({ post_id: open, body: reply.trim() });
    if (error) setError(error.message); else { setReply(""); loadComments(open); }
  };

  return (
    <div className="space-y-6">
      {user ? (
        <form onSubmit={createPost} className="card p-4 space-y-3">
          <div className="flex gap-2">
            <input className="input" required minLength={3} maxLength={120} placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <select className="input !w-auto" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option value="general">General</option><option value="chess">Chess</option><option value="cube">Cube</option></select>
          </div>
          <textarea className="input h-24" required maxLength={5000} placeholder="What would you like to share or ask?" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          <button className="btn btn-primary" disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Post</button>
        </form>
      ) : <div className="card p-4 text-sm"><Link href="/auth" className="text-electric hover:underline">Sign in</Link> to post and reply.</div>}
      <div className="flex gap-2">{["all", "general", "chess", "cube"].map((c) => <button key={c} onClick={() => setCat(c)} className={`btn ${cat === c ? "btn-primary" : "btn-ghost"} capitalize`}>{c}</button>)}</div>
      {error && <p className="text-sm text-bad">{error}</p>}
      {posts === null ? (error ? null : <p className="text-muted flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Loading…</p>) : posts.length === 0 ? <p className="text-muted text-center py-8">No posts yet. Start the first discussion!</p> : (
        <div className="space-y-3">
          {posts.map((p) => (
            <article key={p.id} className={`card p-4 ${p.hidden ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-2 text-xs text-muted"><span className="chip capitalize">{p.category}</span>{who(p.profiles)} · {when(p.created_at)}{p.hidden && <span className="chip">hidden</span>}</div>
              <h3 className="font-semibold mt-2">{p.title}</h3>
              <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{p.body}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button className="btn btn-ghost !py-1 text-xs" onClick={() => { const n = open === p.id ? null : p.id; setOpen(n); if (n) loadComments(n); }}><MessageSquare size={13} /> Replies</button>
                {(user?.id === p.user_id || staff) && <button className="btn btn-ghost !py-1 text-xs" onClick={() => del("posts", p.id)}><Trash2 size={13} /> Delete</button>}
                {staff && <button className="btn btn-ghost !py-1 text-xs" onClick={() => toggleHide(p)}><EyeOff size={13} /> {p.hidden ? "Unhide" : "Hide"}</button>}
              </div>
              {open === p.id && (
                <div className="mt-3 border-t border-line pt-3 space-y-2">
                  {comments.length === 0 && <p className="text-xs text-muted">No replies yet.</p>}
                  {comments.map((c) => (
                    <div key={c.id} className="text-sm rounded-lg bg-surface-2 p-2">
                      <div className="text-xs text-muted flex justify-between">{who(c.profiles)} · {when(c.created_at)}{(user?.id === c.user_id || staff) && <button aria-label="Delete reply" onClick={() => del("comments", c.id)}><Trash2 size={12} /></button>}</div>
                      <p className="whitespace-pre-wrap mt-1">{c.body}</p>
                    </div>
                  ))}
                  {user && <form onSubmit={sendReply} className="flex gap-2"><input className="input" maxLength={2000} placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} /><button className="btn btn-primary"><Send size={15} /></button></form>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
