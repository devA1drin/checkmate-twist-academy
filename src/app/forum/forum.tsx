"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowBigUp, Lock, MessageSquare, Pin, Search, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { CATEGORIES, catLabel, ago } from "@/lib/forum";
import { Markdown, MARKDOWN_HELP } from "@/components/forum/markdown";

interface Thread { id: string; user_id: string; author: string; category: string; title: string; body: string; pinned: boolean; locked: boolean; hidden: boolean; created_at: string; votes: number; replies: number; last_activity: string; voted: boolean }

export function Forum() {
  const { user, configured } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const cat = sp.get("cat") ?? "";
  const sort = sp.get("sort") ?? "active";
  const qParam = sp.get("q") ?? "";
  const [q, setQ] = useState(qParam);
  const [rows, setRows] = useState<Thread[] | null>(null);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "", category: cat || "chess" });
  const [preview, setPreview] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v); else n.delete(k);
    router.replace(`/forum${n.toString() ? `?${n}` : ""}`, { scroll: false });
  };

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb) return;
    const { data, error } = await sb.rpc("forum_threads", { p_category: cat || null, p_q: qParam || null, p_sort: sort, p_limit: 50, p_offset: 0 });
    if (error) setErr(error.message); else setRows((data ?? []) as Thread[]);
  }, [cat, qParam, sort]);
  useEffect(() => { load(); }, [load, user]);
  useEffect(() => { const t = setTimeout(() => { if (q !== qParam) setParam("q", q.trim()); }, 350); return () => clearTimeout(t); });

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase(); if (!sb || !user) return;
    if (draft.title.trim().length < 4 || draft.body.trim().length < 2) { setErr("Give your thread a title (at least 4 characters) and some text."); return; }
    setBusy(true); setErr(null);
    const { data, error } = await sb.from("posts").insert({ title: draft.title.trim().slice(0, 140), body: draft.body.trim(), category: draft.category }).select("id").single();
    setBusy(false);
    if (error) setErr(error.message); else router.push(`/forum/${data.id}`);
  };

  if (!configured) return <p className="notice">The forum needs the site&apos;s database.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input !pl-9" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search threads" aria-label="Search threads" /></div>
        {user ? <button className="btn btn-primary" onClick={() => setWriting((w) => !w)} aria-expanded={writing}>{writing ? "Close" : "New thread"}</button>
          : <Link href="/auth?next=/forum" className="btn btn-ghost">Sign in to post</Link>}
      </div>

      {writing && user && (
        <form onSubmit={post} className="border border-ink rounded p-4 sm:p-5 space-y-4">
          <h2 className="text-lg font-semibold">New thread</h2>
          <div className="grid sm:grid-cols-[1fr_12rem] gap-3">
            <label className="block"><span className="label">Title</span><input className="input mt-1" maxLength={140} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required /></label>
            <label className="block"><span className="label">Category</span>
              <select className="input mt-1" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          </div>
          <div>
            <div className="flex items-center justify-between"><span className="label">Post</span>
              <div className="seg" role="group" aria-label="Editor mode"><button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button><button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button></div></div>
            {preview ? <div className="mt-1 min-h-40 border border-line rounded px-4 py-1">{draft.body.trim() ? <Markdown text={draft.body} id="preview" /> : <p className="text-muted my-3">Nothing to preview.</p>}</div>
              : <textarea className="input mt-1 min-h-40 font-mono text-sm" maxLength={8000} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} required />}
            <p className="help mt-1">{MARKDOWN_HELP}</p>
          </div>
          {err && <p role="alert" className="notice notice-bad">{err}</p>}
          <button className="btn btn-primary" disabled={busy}>Post thread</button>
        </form>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Categories" className="flex flex-wrap gap-1.5">
          {[{ id: "", label: "All" }, ...CATEGORIES].map((c) => <button key={c.id} aria-current={cat === c.id ? "true" : undefined} onClick={() => setParam("cat", c.id)} className={`px-3 py-2 min-h-11 rounded text-sm border ${cat === c.id ? "bg-fg text-bg border-fg" : "border-line hover:border-ink"}`}>{c.label}</button>)}
        </nav>
        <div className="seg" role="group" aria-label="Sort">{[["active", "Active"], ["new", "New"], ["top", "Top"]].map(([k, l]) => <button key={k} aria-pressed={sort === k} onClick={() => setParam("sort", k === "active" ? "" : k)}>{l}</button>)}</div>
      </div>

      {rows === null ? <p className="text-muted">Loading…</p> : rows.length === 0 ? <p className="text-muted border-t border-ink pt-4">{qParam ? `No threads match “${qParam}”.` : "No threads here yet. Start one."}</p> : (
        <ul className="border-t border-ink">
          {rows.map((t) => (
            <li key={t.id} className="flex gap-4 py-4 border-b border-line">
              <div className="w-12 shrink-0 text-center text-sm tabular-nums pt-0.5"><ArrowBigUp size={18} aria-hidden className={`mx-auto ${t.voted ? "text-electric fill-current" : "text-muted"}`} /><span aria-label={`${t.votes} votes`}>{t.votes}</span></div>
              <div className="min-w-0 flex-1">
                <Link href={`/forum/${t.id}`} className="font-medium text-[17px] hover:underline flex items-center gap-1.5 flex-wrap">
                  {t.pinned && <Pin size={14} className="text-electric" aria-label="Pinned" />}{t.locked && <Lock size={14} className="text-muted" aria-label="Locked" />}{t.hidden && <EyeOff size={14} className="text-bad" aria-label="Hidden" />}
                  <span>{t.title}</span>
                </Link>
                <p className="text-sm text-muted mt-1 flex flex-wrap gap-x-3"><span className="text-fg/80">{catLabel(t.category)}</span><span>{t.author}</span><span>{ago(t.last_activity)}</span><span className="inline-flex items-center gap-1"><MessageSquare size={13} aria-hidden />{t.replies} {t.replies === 1 ? "reply" : "replies"}</span></p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
