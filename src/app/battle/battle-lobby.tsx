"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { errMsg } from "@/lib/online";
import { ROOM_COLUMNS, type Room } from "@/lib/battle";

interface Preview { id: string; name: string; status: string; rounds: number; inspection_s: number; players: number; host_name: string | null }

export function BattleLobby() {
  const { user, configured } = useAuth();
  const router = useRouter();
  const invite = useSearchParams().get("invite");
  const [inviteName, setInviteName] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", rounds: 5, inspection: 15, visibility: "link" as "public" | "link" });
  const [open, setOpen] = useState<Preview[] | null>(null);
  const [mine, setMine] = useState<Room[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb) return;
    const { data } = await sb.from("battle_rooms").select("id").eq("visibility", "public").eq("status", "lobby").order("created_at", { ascending: false }).limit(20);
    const previews = await Promise.all((data ?? []).map(async (r) => (await sb.rpc("battle_room_preview", { p_room: r.id })).data?.[0] as Preview));
    setOpen(previews.filter((p) => p && p.players < 4));
    if (user) {
      const { data: m } = await sb.from("battle_members").select("room_id").eq("user_id", user.id);
      const ids = (m ?? []).map((x) => x.room_id);
      if (ids.length) { const { data: rs } = await sb.from("battle_rooms").select(ROOM_COLUMNS).in("id", ids).neq("status", "finished").order("created_at", { ascending: false }); setMine((rs ?? []) as Room[]); } else setMine([]);
    }
  }, [user]);
  useEffect(() => {
    load();
    const sb = getSupabase(); if (!sb) return;
    const ch = sb.channel("battle-lobby").on("postgres_changes", { event: "*", schema: "public", table: "battle_rooms" }, () => load()).subscribe();
    const t = setInterval(load, 20000);
    return () => { sb.removeChannel(ch); clearInterval(t); };
  }, [load]);
  useEffect(() => {
    const sb = getSupabase(); if (!sb || !invite) return;
    sb.from("profiles").select("display_name, username").eq("id", invite).maybeSingle().then(({ data }) => setInviteName(data?.display_name || data?.username || null));
  }, [invite]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase(); if (!sb) return;
    setBusy(true); setErr(null);
    const { data, error } = await sb.rpc("create_battle", { p_name: f.name.trim() || (inviteName ? `Race with ${inviteName}` : "Cube battle"), p_rounds: f.rounds, p_inspection: f.inspection, p_visibility: f.visibility });
    setBusy(false);
    if (error) setErr(await errMsg(error)); else router.push(`/battle/${data}`);
  };
  const join = async (id: string) => {
    const sb = getSupabase(); if (!sb) return;
    const { error } = await sb.rpc("join_battle", { p_room: id });
    if (error) setErr(await errMsg(error)); else router.push(`/battle/${id}`);
  };

  if (!configured) return <p className="notice">Battles need the site&apos;s database.</p>;

  return (
    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12">
      <section aria-labelledby="host">
        <h2 id="host" className="text-xl font-semibold mb-3">Host a battle</h2>
        {inviteName && <p className="notice mb-4">Create a room, then send the link to <strong>{inviteName}</strong>.</p>}
        {!user ? <p className="notice"><Link className="link" href="/auth?next=/battle">Sign in</Link> to host or join a battle.</p> : (
          <form onSubmit={create} className="space-y-4 border-t border-ink pt-4">
            <label className="block"><span className="label">Room name</span><input className="input mt-1" maxLength={60} placeholder={inviteName ? `Race with ${inviteName}` : "Cube battle"} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <div><span className="label">Rounds</span><div className="seg mt-1" role="group" aria-label="Rounds">{[1, 3, 5, 12].map((n) => <button key={n} type="button" aria-pressed={f.rounds === n} onClick={() => setF({ ...f, rounds: n })}>{n === 1 ? "1" : `Best of ${n}`}</button>)}</div></div>
            <div><span className="label">Inspection</span><div className="seg mt-1" role="group" aria-label="Inspection">{[0, 8, 15].map((n) => <button key={n} type="button" aria-pressed={f.inspection === n} onClick={() => setF({ ...f, inspection: n })}>{n ? `${n} s` : "None"}</button>)}</div></div>
            <div><span className="label">Who can join</span><div className="seg mt-1" role="group" aria-label="Who can join"><button type="button" aria-pressed={f.visibility === "link"} onClick={() => setF({ ...f, visibility: "link" })}>People with the link</button><button type="button" aria-pressed={f.visibility === "public"} onClick={() => setF({ ...f, visibility: "public" })}>Anyone (listed)</button></div></div>
            {err && <p role="alert" className="notice notice-bad">{err}</p>}
            <button className="btn btn-primary" disabled={busy}>Create room</button>
          </form>
        )}
        <div className="mt-8 text-sm text-muted space-y-2">
          <h3 className="font-medium text-fg">How it works</h3>
          <ol className="list-decimal pl-5 space-y-1"><li>The host starts a round. Everyone gets the same random-state scramble.</li><li>Scramble your cube, inspect, and solve. Your timer runs on your device.</li><li>Times appear live. Fastest time wins the round; most round wins takes the battle.</li></ol>
          <p>Times are self-reported. The server rejects anything under 2.5 s or longer than the round has been running, and players can report a time that looks wrong.</p>
        </div>
      </section>
      <div className="space-y-10">
        {mine.length > 0 && <section><h2 className="text-xl font-semibold mb-3">Your rooms</h2>
          <ul className="border-t border-ink">{mine.map((r) => <li key={r.id} className="list-row"><Link className="flex-1 font-medium hover:underline" href={`/battle/${r.id}`}>{r.name}</Link><span className="text-sm text-muted">{r.status === "lobby" ? "Waiting to start" : `Round ${r.current_round} of ${r.rounds}`}</span></li>)}</ul></section>}
        <section aria-labelledby="open"><h2 id="open" className="text-xl font-semibold mb-3">Open rooms</h2>
          {open === null ? <p className="text-muted">Loading…</p> : open.length === 0 ? <p className="text-muted border-t border-ink pt-3">No public rooms right now. Host one and share the link.</p> : (
            <ul className="border-t border-ink">{open.map((r) => (
              <li key={r.id} className="list-row flex-wrap"><div className="flex-1 min-w-0"><p className="font-medium">{r.name}</p><p className="text-sm text-muted">{r.host_name ?? "Host"} · {r.players}/4 players · {r.rounds} round{r.rounds > 1 ? "s" : ""} · {r.inspection_s ? `${r.inspection_s} s inspection` : "no inspection"}</p></div>
                <button className="btn btn-ghost" disabled={!user} onClick={() => join(r.id)}>Join</button></li>))}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
