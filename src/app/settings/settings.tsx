"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth, type Profile } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";

type Form = Pick<Profile, "display_name" | "username" | "interests" | "skill_level" | "allow_friend_requests" | "allow_challenges" | "profile_visibility" | "show_online" | "show_on_leaderboard">;

export function Settings() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [f, setF] = useState<Form | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (profile) setF({ display_name: profile.display_name ?? "", username: profile.username ?? "", interests: profile.interests, skill_level: profile.skill_level, allow_friend_requests: profile.allow_friend_requests, allow_challenges: profile.allow_challenges, profile_visibility: profile.profile_visibility, show_online: profile.show_online, show_on_leaderboard: profile.show_on_leaderboard }); }, [profile]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (!user) return <p className="notice">Please <Link href="/auth" className="link">sign in</Link> to change your profile.</p>;
  if (!f) return <p className="text-muted">Loading…</p>;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF({ ...f, [k]: v });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const sb = getSupabase()!;
    const { error } = await sb.from("profiles").update({ ...f, display_name: f.display_name?.trim() || null, username: f.username?.trim() || null, onboarded: !!(f.interests && f.skill_level) || profile?.onboarded }).eq("id", user.id);
    setBusy(false);
    if (error) setMsg({ ok: false, text: error.code === "23505" ? "That username is taken. Try another." : error.message.includes("username") ? "Usernames are 3 to 24 letters, numbers or underscores." : "Could not save. Please try again." });
    else { setMsg({ ok: true, text: "Saved." }); refreshProfile(); }
  };

  return (
    <form onSubmit={save} className="space-y-10">
      <header className="pb-6 border-b border-line">
        <p className="eyebrow">Account</p>
        <h1 className="font-display text-3xl font-semibold mt-2">Profile and privacy</h1>
        <p className="text-muted mt-2">Signed in as <span className="text-fg">{user.email}</span>. Your email is never shown to other people.</p>
      </header>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold mb-2">Public name</legend>
        <div><label className="label" htmlFor="dn">Display name</label><input id="dn" className="input" maxLength={40} value={f.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} /></div>
        <div><label className="label" htmlFor="un">Username</label><input id="un" className="input" maxLength={24} pattern="[A-Za-z0-9_]{3,24}" value={f.username ?? ""} onChange={(e) => set("username", e.target.value)} aria-describedby="un-help" /><p id="un-help" className="help">Friends can find you by this. 3 to 24 letters, numbers or underscores.</p></div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold mb-2">Goals</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label" htmlFor="in">I want to learn</label><select id="in" className="input" value={f.interests ?? ""} onChange={(e) => set("interests", (e.target.value || null) as Form["interests"])}><option value="">Not set</option><option value="chess">Chess</option><option value="cube">Rubik&apos;s Cube</option><option value="both">Both</option></select></div>
          <div><label className="label" htmlFor="lv">My level</label><select id="lv" className="input" value={f.skill_level ?? ""} onChange={(e) => set("skill_level", (e.target.value || null) as Form["skill_level"])}><option value="">Not set</option><option value="new">Completely new</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold mb-2">Privacy</legend>
        <div><label className="label" htmlFor="pv">Who can see my profile page</label><select id="pv" className="input" value={f.profile_visibility} onChange={(e) => set("profile_visibility", e.target.value as Form["profile_visibility"])}><option value="public">Everyone</option><option value="friends">Friends only</option><option value="private">Only me</option></select></div>
        <div><label className="label" htmlFor="ac">Who can challenge me to a game or battle</label><select id="ac" className="input" value={f.allow_challenges} onChange={(e) => set("allow_challenges", e.target.value as Form["allow_challenges"])}><option value="everyone">Everyone</option><option value="friends">Friends only</option><option value="nobody">Nobody</option></select></div>
        {([["allow_friend_requests", "Allow friend requests"], ["show_online", "Show friends when I'm online"], ["show_on_leaderboard", "Show me on leaderboards and the weekly league"]] as const).map(([k, l]) => (
          <label key={k} className="flex items-center gap-3 min-h-[44px] cursor-pointer"><input type="checkbox" className="h-5 w-5 accent-[var(--blue)]" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />{l}</label>
        ))}
      </fieldset>

      <div className="flex items-center gap-4 border-t border-line pt-6">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        {msg && <span role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-ok" : "text-bad"}>{msg.text}</span>}
      </div>
    </form>
  );
}
