"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Search, Swords, Crown, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { RelationButton, useRelationActions, type Relation } from "@/components/social/relation-button";

interface Row { id: string; display_name: string | null; username: string | null; relation: Relation; last_seen?: string | null; show_online?: boolean }
const ONLINE_MS = 2.5 * 60 * 1000;
function seen(last: string | null | undefined, now: number) {
  if (!last) return null;
  const d = now - Date.parse(last);
  if (d < ONLINE_MS) return "Online";
  const m = Math.round(d / 60000);
  return m < 60 ? `Seen ${m} min ago` : m < 1440 ? `Seen ${Math.round(m / 60)} h ago` : `Seen ${Math.round(m / 1440)} d ago`;
}

export function Friends() {
  const { user, loading, configured } = useAuth();
  const [list, setList] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Row[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [menu, setMenu] = useState<string | null>(null);
  const actions = useRelationActions();

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb || !user) return;
    const { data } = await sb.rpc("list_friends");
    setList((data ?? []) as Row[]); setNow(Date.now());
  }, [user]);

  // Realtime: any change to a friendship involving me reloads the list. Online status refreshes every 30 s.
  useEffect(() => {
    const sb = getSupabase(); if (!sb || !user) return;
    load();
    const ch = sb.channel("friends").on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => load()).subscribe();
    const t = setInterval(load, 30000);
    return () => { sb.removeChannel(ch); clearInterval(t); };
  }, [user, load]);

  useEffect(() => {
    const sb = getSupabase(); if (!sb || !user) return;
    if (q.trim().length < 2) { setResults(null); return; }
    const t = setTimeout(async () => { const { data } = await sb.rpc("search_users", { q: q.trim() }); setResults((data ?? []) as Row[]); }, 250);
    return () => clearTimeout(t);
  }, [q, user]);

  if (!configured) return <p className="notice">Friends need the site&apos;s database.</p>;
  if (loading) return <p className="text-muted">Loading…</p>;
  if (!user) return <p className="notice"><Link href="/auth?next=/friends" className="link">Sign in</Link> to add friends.</p>;

  const friends = list.filter((r) => r.relation === "friend").sort((a, b) => Number(!!seen(b.last_seen, now)?.startsWith("Online")) - Number(!!seen(a.last_seen, now)?.startsWith("Online")));
  const incoming = list.filter((r) => r.relation === "received");
  const outgoing = list.filter((r) => r.relation === "sent");
  const blocked = list.filter((r) => r.relation === "blocked");
  const refresh = () => { load(); if (q.trim().length >= 2) setQ((x) => x + ""); };
  const name = (r: Row) => r.display_name || r.username || "Member";

  return (
    <div className="space-y-12">
      <section aria-labelledby="find">
        <h2 id="find" className="text-xl font-semibold mb-3">Find people</h2>
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input !pl-9" placeholder="Name or username (at least 2 letters)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" /></div>
        {results && (results.length === 0 ? <p className="text-sm text-muted mt-3">Nobody found. People with private profiles don&apos;t appear in search.</p> : (
          <ul className="border-t border-line mt-3">{results.map((r) => (
            <li key={r.id} className="list-row flex-wrap">
              <Link href={`/u/${r.id}`} className="flex-1 min-w-0"><span className="font-medium hover:underline">{name(r)}</span>{r.username && <span className="text-sm text-muted ml-2">@{r.username}</span>}</Link>
              {r.relation === "friend" ? <span className="text-sm text-ok">Friends</span> : <RelationButton id={r.id} relation={r.relation} onChange={async () => { const sb = getSupabase()!; const { data } = await sb.rpc("search_users", { q: q.trim() }); setResults((data ?? []) as Row[]); load(); }} />}
            </li>))}</ul>
        ))}
      </section>

      {incoming.length > 0 && (
        <section aria-labelledby="req"><h2 id="req" className="text-xl font-semibold mb-3">Friend requests <span className="text-muted font-normal">({incoming.length})</span></h2>
          <ul className="border-t border-ink">{incoming.map((r) => (
            <li key={r.id} className="list-row flex-wrap"><Link href={`/u/${r.id}`} className="flex-1 font-medium hover:underline">{name(r)}</Link><RelationButton id={r.id} relation="received" onChange={refresh} /></li>))}</ul>
        </section>
      )}

      <section aria-labelledby="fr">
        <div className="flex items-baseline justify-between mb-3"><h2 id="fr" className="text-xl font-semibold">Your friends <span className="text-muted font-normal">({friends.length})</span></h2><Link href="/settings" className="text-sm link">Privacy settings</Link></div>
        {friends.length === 0 ? <p className="text-sm text-muted border-t border-ink pt-3">No friends yet. Search above to add someone.</p> : (
          <ul className="border-t border-ink">{friends.map((r) => {
            const s = seen(r.last_seen, now); const on = s === "Online";
            return (
              <li key={r.id} className="list-row flex-wrap relative">
                <span aria-hidden className={`h-2.5 w-2.5 rounded-full shrink-0 ${on ? "bg-ok" : "border border-muted"}`} />
                <Link href={`/u/${r.id}`} className="flex-1 min-w-0"><span className="font-medium hover:underline">{name(r)}</span><span className="block text-xs text-muted">{s ?? "Status hidden"}</span></Link>
                <Link href={`/play/online?invite=${r.id}`} className="btn btn-ghost"><Crown size={16} aria-hidden /><span className="hidden sm:inline">Chess</span><span className="sr-only sm:hidden">Challenge to chess</span></Link>
                <Link href={`/battle?invite=${r.id}`} className="btn btn-ghost"><Swords size={16} aria-hidden /><span className="hidden sm:inline">Cube race</span><span className="sr-only sm:hidden">Challenge to a cube race</span></Link>
                <button className="btn btn-ghost !px-2" aria-label={`More actions for ${name(r)}`} aria-expanded={menu === r.id} onClick={() => setMenu(menu === r.id ? null : r.id)}><MoreHorizontal size={18} aria-hidden /></button>
                {menu === r.id && (
                  <div className="absolute right-0 top-full z-10 card py-1 w-48">
                    <button className="block w-full text-left px-4 py-2.5 hover:bg-surface-2" onClick={async () => { if (confirm(`Remove ${name(r)} from your friends?`)) { await actions.remove(r.id); setMenu(null); load(); } }}>Remove friend</button>
                    <button className="block w-full text-left px-4 py-2.5 hover:bg-surface-2 text-bad" onClick={async () => { if (confirm(`Block ${name(r)}? They won't be able to find you, message you or challenge you.`)) { await actions.block(r.id); setMenu(null); load(); } }}>Block</button>
                  </div>
                )}
              </li>
            );
          })}</ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section><h2 className="text-lg font-semibold mb-3">Requests you sent</h2>
          <ul className="border-t border-line">{outgoing.map((r) => <li key={r.id} className="list-row"><span className="flex-1">{name(r)}</span><RelationButton id={r.id} relation="sent" onChange={refresh} /></li>)}</ul>
        </section>
      )}
      {blocked.length > 0 && (
        <section><h2 className="text-lg font-semibold mb-3">Blocked</h2>
          <ul className="border-t border-line">{blocked.map((r) => <li key={r.id} className="list-row"><span className="flex-1">{name(r)}</span><RelationButton id={r.id} relation="blocked" onChange={refresh} /></li>)}</ul>
        </section>
      )}
      <p className="text-xs text-muted">Online status is only shown to friends, and only if you allow it in privacy settings.</p>
    </div>
  );
}
