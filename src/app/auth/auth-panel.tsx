"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, LogOut, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { BackendRequired } from "@/components/backend-required";

type Tab = "signin" | "signup" | "magic";

export function AuthPanel() {
  const { configured, user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({ display_name: "", username: "", show_on_leaderboard: true });

  useEffect(() => {
    if (!profile || !user) return;
    const sb = getSupabase();
    sb?.from("profiles").select("display_name, username, show_on_leaderboard").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({ display_name: data.display_name ?? "", username: data.username ?? "", show_on_leaderboard: data.show_on_leaderboard ?? true });
    });
  }, [profile, user]);

  if (!configured) return <BackendRequired feature="Accounts" />;
  if (loading) return <p className="text-muted flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Loading…</p>;
  const sb = getSupabase()!;
  const redirect = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      if (tab === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      } else if (tab === "signup") {
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirect, data: { display_name: name.trim() || undefined } } });
        if (error) throw error;
        if (data.session) router.push("/dashboard");
        else setMsg({ ok: true, text: "Check your inbox to confirm your email address, then sign in." });
      } else {
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
        if (error) throw error;
        setMsg({ ok: true, text: "Magic link sent — open it on this device to sign in." });
      }
    } catch (err) { setMsg({ ok: false, text: (err as Error).message }); }
    finally { setBusy(false); }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return; setBusy(true); setMsg(null);
    const { error } = await sb.from("profiles").update({ display_name: form.display_name.trim() || null, username: form.username.trim() || null, show_on_leaderboard: form.show_on_leaderboard }).eq("id", user.id);
    setBusy(false);
    if (error) setMsg({ ok: false, text: error.message.includes("username") || error.code === "23514" ? "Username must be 3–24 letters, numbers or underscores." : error.code === "23505" ? "That username is taken." : error.message });
    else { setMsg({ ok: true, text: "Profile saved." }); refreshProfile(); }
  };

  if (user) return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="text-sm text-muted">Signed in as</div>
        <div className="font-semibold">{user.email}</div>
        {profile && <span className="chip mt-2">{profile.role}</span>}
      </div>
      <form onSubmit={saveProfile} className="card p-5 space-y-3">
        <div className="font-semibold">Public profile</div>
        <label className="block text-sm">Display name<input className="input mt-1" maxLength={40} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></label>
        <label className="block text-sm">Username<input className="input mt-1" maxLength={24} pattern="[A-Za-z0-9_]{3,24}" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="letters, numbers, _" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.show_on_leaderboard} onChange={(e) => setForm({ ...form, show_on_leaderboard: e.target.checked })} /> Show me on public leaderboards</label>
        <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 size={15} className="animate-spin" />} Save</button>
      </form>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>}
      <div className="flex gap-2"><Link href="/dashboard" className="btn btn-ghost">Dashboard</Link><button className="btn btn-ghost" onClick={async () => { await signOut(); router.push("/"); }}><LogOut size={15} /> Sign out</button></div>
    </div>
  );

  return (
    <div className="card p-5 space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1 text-sm">
        {([["signin", "Sign in"], ["signup", "Create account"], ["magic", "Magic link"]] as const).map(([k, l]) => <button key={k} onClick={() => { setTab(k); setMsg(null); }} className={`rounded-lg py-1.5 font-medium ${tab === k ? "bg-surface shadow text-fg" : "text-muted"}`}>{l}</button>)}
      </div>
      <form onSubmit={submit} className="space-y-3">
        {tab === "signup" && <label className="block text-sm">Display name<input className="input mt-1" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} /></label>}
        <label className="block text-sm">Email<input className="input mt-1" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {tab !== "magic" && <label className="block text-sm">Password<input className="input mt-1" type="password" required minLength={tab === "signup" ? 8 : undefined} autoComplete={tab === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : tab === "magic" ? <Mail size={15} /> : <KeyRound size={15} />}{tab === "signin" ? "Sign in" : tab === "signup" ? "Create account" : "Email me a magic link"}</button>
      </form>
      {msg && <p className={`text-sm flex gap-1.5 ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}{msg.text}</p>}
      <p className="text-xs text-muted">Your guest progress stays in this browser; after signing in you can import it from the dashboard. See our <Link href="/privacy" className="text-electric hover:underline">privacy notes</Link>.</p>
    </div>
  );
}
