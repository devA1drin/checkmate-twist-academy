"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowBigUp, ArrowLeft, EyeOff, Lock, Pin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { catLabel, ago } from "@/lib/forum";
import { Markdown, MARKDOWN_HELP } from "@/components/forum/markdown";
import { ReportButton } from "@/components/forum/report-button";

type Author = { display_name: string | null; username: string | null } | null;
interface Post { id: string; user_id: string; category: string; title: string; body: string; pinned: boolean; locked: boolean; hidden: boolean; created_at: string; updated_at: string | null; profiles: Author }
interface Reply { id: string; user_id: string; body: string; hidden: boolean; created_at: string; profiles: Author }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nameOf = (a: Author) => a?.display_name || a?.username || "Member";

export function Thread({ id }: { id: string }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const staff = profile?.role === "admin" || profile?.role === "moderator";
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [votes, setVotes] = useState(0);
  const [voted, setVoted] = useState(false);
  const [reply, setReply] = useState("");
  const [preview, setPreview] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb || !UUID.test(id)) { setPost(null); return; }
    const [p, c, v] = await Promise.all([
      sb.from("posts").select("id, user_id, category, title, body, pinned, locked, hidden, created_at, updated_at, profiles!posts_user_id_fkey(display_name, username)").eq("id", id).maybeSingle(),
      sb.from("comments").select("id, user_id, body, hidden, created_at, profiles!comments_user_id_fkey(display_name, username)").eq("post_id", id).order("created_at"),
      sb.from("post_votes").select("user_id").eq("post_id", id),
    ]);
    setPost((p.data as unknown as Post) ?? null);
    setReplies((c.data ?? []) as unknown as Reply[]);
    setVotes(v.data?.length ?? 0); setVoted(!!user && !!v.data?.some((x) => x.user_id === user.id));
  }, [id, user]);

  useEffect(() => {
    if (loading) return;
    load();
    const sb = getSupabase(); if (!sb || !UUID.test(id)) return;
    const ch = sb.channel(`thread:${id}`).on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${id}` }, () => load()).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [id, loading, load]);

  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    setBusy(true); setErr(null);
    const { error } = await fn();
    setBusy(false);
    if (error) setErr(error.message); else load();
  };
  const sb = getSupabase();

  if (post === undefined) return <p className="text-muted">Loading…</p>;
  if (post === null || !sb) return <div className="space-y-3"><p className="notice">This thread doesn&apos;t exist or was removed.</p><Link href="/forum" className="link">Back to the forum</Link></div>;

  const vote = async () => {
    if (!user) { router.push(`/auth?next=/forum/${id}`); return; }
    setVoted(!voted); setVotes(votes + (voted ? -1 : 1));
    const { error } = voted ? await sb.from("post_votes").delete().eq("post_id", id).eq("user_id", user.id) : await sb.from("post_votes").insert({ post_id: id });
    if (error) { setErr(error.message); load(); }
  };
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    run(async () => { const r = await sb.from("comments").insert({ post_id: id, body: reply.trim() }); if (!r.error) { setReply(""); setPreview(false); } return r; });
  };
  const mine = user?.id === post.user_id;

  return (
    <article className="space-y-8">
      <Link href={`/forum?cat=${post.category}`} className="text-sm link inline-flex items-center gap-1"><ArrowLeft size={14} aria-hidden /> {catLabel(post.category)}</Link>
      <header className="flex gap-4">
        <div className="text-center shrink-0">
          <button onClick={vote} aria-pressed={voted} aria-label={voted ? "Remove your upvote" : "Upvote"} className={`h-11 w-11 grid place-items-center rounded border ${voted ? "border-electric text-electric" : "border-line hover:border-ink"}`}><ArrowBigUp size={22} aria-hidden className={voted ? "fill-current" : ""} /></button>
          <span className="block text-sm tabular-nums mt-1" aria-live="polite">{votes}</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight flex flex-wrap items-center gap-2">
            {post.pinned && <Pin size={18} className="text-electric" aria-label="Pinned" />}{post.locked && <Lock size={18} className="text-muted" aria-label="Locked" />}{post.title}</h1>
          <p className="text-sm text-muted mt-1">{nameOf(post.profiles)} · {ago(post.created_at)}{post.updated_at ? " · edited" : ""}</p>
          {post.hidden && <p className="notice notice-bad mt-2 inline-flex items-center gap-2"><EyeOff size={14} aria-hidden /> Hidden by a moderator. Only you{staff ? " and moderators" : ""} can see it.</p>}
        </div>
      </header>

      <div className="border-b border-line pb-4"><Markdown text={post.body} id="post" /></div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {user && !mine && <ReportButton type="post" id={post.id} reasons={["spam", "abuse", "off_topic", "other"]} />}
        {mine && <button className="text-sm text-muted hover:text-bad min-h-11" onClick={() => { if (confirm("Delete your thread and its replies?")) run(async () => { const r = await sb.from("posts").delete().eq("id", id); if (!r.error) router.push("/forum"); return r; }); }}>Delete thread</button>}
        {staff && <span className="flex flex-wrap gap-2 border-l border-line pl-4"><span className="label self-center">Moderate</span>
          <button className="btn btn-ghost" disabled={busy} onClick={() => run(() => sb.from("posts").update({ pinned: !post.pinned }).eq("id", id))}>{post.pinned ? "Unpin" : "Pin"}</button>
          <button className="btn btn-ghost" disabled={busy} onClick={() => run(() => sb.from("posts").update({ locked: !post.locked }).eq("id", id))}>{post.locked ? "Unlock" : "Lock"}</button>
          <button className="btn btn-ghost" disabled={busy} onClick={() => run(() => sb.from("posts").update({ hidden: !post.hidden }).eq("id", id))}>{post.hidden ? "Unhide" : "Hide"}</button>
        </span>}
      </div>
      {err && <p role="alert" className="notice notice-bad">{err}</p>}

      <section aria-labelledby="replies">
        <h2 id="replies" className="text-lg font-semibold mb-2">{replies.length} {replies.length === 1 ? "reply" : "replies"}</h2>
        <ol className="border-t border-ink">
          {replies.map((r) => (
            <li key={r.id} id={`r-${r.id}`} className={`py-4 border-b border-line ${r.hidden ? "opacity-60" : ""}`}>
              <p className="text-sm"><span className="font-medium">{nameOf(r.profiles)}</span>{r.user_id === post.user_id && <span className="text-xs text-muted ml-1.5">author</span>} <span className="text-muted">· {ago(r.created_at)}</span>{r.hidden && <span className="text-bad text-xs ml-2">hidden</span>}</p>
              <Markdown text={r.body} id={`c-${r.id}`} />
              <div className="flex flex-wrap gap-x-4">
                {user && user.id !== r.user_id && <ReportButton type="comment" id={r.id} reasons={["spam", "abuse", "off_topic", "other"]} />}
                {user?.id === r.user_id && <button className="text-sm text-muted hover:text-bad min-h-11" onClick={() => { if (confirm("Delete your reply?")) run(() => sb.from("comments").delete().eq("id", r.id)); }}>Delete</button>}
                {staff && <button className="text-sm text-muted hover:text-fg min-h-11" onClick={() => run(() => sb.from("comments").update({ hidden: !r.hidden }).eq("id", r.id))}>{r.hidden ? "Unhide" : "Hide"}</button>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {post.locked && !staff ? <p className="notice"><Lock size={14} className="inline mr-1" aria-hidden />This thread is locked. No new replies.</p>
        : !user ? <p className="notice"><Link href={`/auth?next=/forum/${id}`} className="link">Sign in</Link> to reply.</p> : (
          <form onSubmit={send} className="space-y-2">
            <div className="flex items-center justify-between"><label htmlFor="reply" className="font-medium">Your reply</label>
              <div className="seg" role="group" aria-label="Editor mode"><button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button><button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button></div></div>
            {preview ? <div className="min-h-28 border border-line rounded px-4 py-1"><Markdown text={reply || "Nothing to preview."} id="rp" /></div>
              : <textarea id="reply" className="input min-h-28 font-mono text-sm" maxLength={4000} value={reply} onChange={(e) => setReply(e.target.value)} />}
            <p className="help">{MARKDOWN_HELP}</p>
            <button className="btn btn-primary" disabled={busy || !reply.trim()}>Post reply</button>
          </form>
        )}
    </article>
  );
}
