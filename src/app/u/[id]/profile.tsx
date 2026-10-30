"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Crown, Swords } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { RelationButton, type Relation } from "@/components/social/relation-button";
import { BadgeList } from "@/components/game/badge-list";
import { levelFromXp } from "@/lib/gamify";

interface P {
  id: string; display_name: string | null; username: string | null; interests: string[] | null; joined: string;
  restricted: boolean; relation: Relation; allow_challenges: string; xp: number; streak_best: number;
  achievements: string[] | null; games: number; wins: number; lessons: number;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function Profile({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const [p, setP] = useState<P | null | undefined>(undefined);
  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb || !UUID.test(id)) { setP(null); return; }
    const { data } = await sb.rpc("public_profile", { p_user: id });
    setP((data as P) ?? null);
  }, [id]);
  useEffect(() => { if (!loading) load(); }, [loading, load]);

  if (p === undefined) return <p className="text-muted">Loading…</p>;
  if (p === null) return <p className="notice">This profile doesn&apos;t exist.</p>;
  const name = p.display_name || p.username || "Member";
  const isMe = user?.id === p.id;
  const lvl = levelFromXp(p.xp ?? 0);
  const canChallenge = !!user && !isMe && p.relation !== "blocked" && (p.allow_challenges === "everyone" || (p.allow_challenges === "friends" && p.relation === "friend"));

  return (
    <div className="space-y-10">
      <header className="border-b border-ink pb-6">
        <p className="label">Member since {new Date(p.joined).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
        <h1 className="font-display text-4xl font-semibold mt-1">{name}</h1>
        {p.username && <p className="text-muted">@{p.username}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {isMe ? <Link href="/settings" className="btn btn-ghost">Edit profile</Link>
            : user ? <RelationButton id={p.id} relation={p.relation} onChange={load} />
              : <Link href={`/auth?next=/u/${p.id}`} className="btn btn-ghost">Sign in to add friend</Link>}
          {p.relation === "friend" && <span className="self-center text-sm text-ok">You are friends</span>}
          {canChallenge && <>
            <Link href={`/play/online?invite=${p.id}`} className="btn btn-ghost"><Crown size={16} aria-hidden /> Challenge to chess</Link>
            <Link href={`/battle?invite=${p.id}`} className="btn btn-ghost"><Swords size={16} aria-hidden /> Cube race</Link>
          </>}
        </div>
      </header>
      {p.restricted ? <p className="notice">{name}&apos;s profile is private.</p> : (
        <>
          <dl className="grid grid-cols-2 sm:grid-cols-5 gap-y-6 border-b border-line pb-8">
            {[["Level", lvl.level], ["Best streak", `${p.streak_best ?? 0} d`], ["Online games", p.games], ["Wins", p.wins], ["Lessons", p.lessons]].map(([k, v]) => (
              <div key={k as string}><dt className="text-sm text-muted">{k}</dt><dd className="text-3xl font-semibold tabular-nums">{v}</dd></div>
            ))}
          </dl>
          <section><h2 className="text-xl font-semibold mb-4">Badges</h2><BadgeList earned={new Set(p.achievements ?? [])} compact /></section>
        </>
      )}
    </div>
  );
}
