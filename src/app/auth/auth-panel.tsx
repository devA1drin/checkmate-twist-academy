"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, KeyRound, LogOut, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { callbackUrl, fetchAuthSettings, friendlyAuthError, type AuthSettings } from "@/lib/supabase/auth-helpers";
import { BackendRequired } from "@/components/backend-required";

type Mode = "signin" | "signup" | "code";
/** "verify" = waiting for the user to confirm a new account; "code" = waiting for a sign-in code. */
type Pending = { kind: "verify" | "code"; email: string } | null;
type Msg = { ok: boolean; text: string } | null;

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function AuthPanel() {
  const { configured, user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [settings, setSettings] = useState<AuthSettings | null>(null);
  const [form, setForm] = useState({ display_name: "", username: "", show_on_leaderboard: true });

  useEffect(() => { fetchAuthSettings().then(setSettings); }, []);
  useEffect(() => { if (cooldown <= 0) return; const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); }, [cooldown]);
  useEffect(() => {
    if (!profile || !user) return;
    getSupabase()?.from("profiles").select("display_name, username, show_on_leaderboard").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({ display_name: data.display_name ?? "", username: data.username ?? "", show_on_leaderboard: data.show_on_leaderboard ?? true });
    });
  }, [profile, user]);

  if (!configured) return <BackendRequired feature="Accounts" />;
  if (loading) return <p className="text-muted flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Loading…</p>;
  const sb = getSupabase()!;

  const google = async () => {
    setMsg(null); setBusy(true);
    const s = settings ?? (await fetchAuthSettings());
    if (s && !s.google) {
      setBusy(false);
      setMsg({ ok: false, text: "Google sign-in isn't switched on for this site yet. Please use email below for now." });
      return;
    }
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl(next) } });
    if (error) { setBusy(false); setMsg({ ok: false, text: friendlyAuthError(error) }); }
  };

  const resend = async () => {
    if (!pending && !email) return;
    const target = pending?.email ?? email;
    setBusy(true); setMsg(null);
    const { error } = pending?.kind === "code"
      ? await sb.auth.signInWithOtp({ email: target, options: { emailRedirectTo: callbackUrl(next) } })
      : await sb.auth.resend({ type: "signup", email: target, options: { emailRedirectTo: callbackUrl(next) } });
    setBusy(false);
    if (error) setMsg({ ok: false, text: friendlyAuthError(error) });
    else { setMsg({ ok: true, text: `Sent a new email to ${target}. Check your spam or Promotions folder if it isn't in your inbox.` }); setCooldown(60); if (!pending) setPending({ kind: "verify", email: target }); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null); setNeedsConfirm(false);
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) { if (error.code === "email_not_confirmed") setNeedsConfirm(true); throw error; }
        router.push(next);
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: callbackUrl(next), data: { display_name: name.trim() || undefined } } });
        if (error) throw error;
        if (data.session) router.push(next);
        else { setPending({ kind: "verify", email }); setCooldown(60); }
      } else {
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl(next) } });
        if (error) throw error;
        setPending({ kind: "code", email }); setCooldown(60);
      }
    } catch (err) { setMsg({ ok: false, text: friendlyAuthError(err as { message?: string; code?: string; status?: number }) }); }
    finally { setBusy(false); }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault(); if (!pending) return;
    setBusy(true); setMsg(null);
    const token = code.replace(/\D/g, "");
    const { error } = await sb.auth.verifyOtp({ email: pending.email, token, type: pending.kind === "verify" ? "signup" : "email" });
    setBusy(false);
    if (error) setMsg({ ok: false, text: friendlyAuthError(error) });
    else router.push(next);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return; setBusy(true); setMsg(null);
    const { error } = await sb.from("profiles").update({ display_name: form.display_name.trim() || null, username: form.username.trim() || null, show_on_leaderboard: form.show_on_leaderboard }).eq("id", user.id);
    setBusy(false);
    if (error) setMsg({ ok: false, text: error.code === "23505" ? "That username is taken." : error.code === "23514" ? "Username must be 3–24 letters, numbers or underscores." : error.message });
    else { setMsg({ ok: true, text: "Profile saved." }); refreshProfile(); }
  };

  const Message = () => msg && (
    <p role={msg.ok ? "status" : "alert"} className={`text-sm flex gap-2 ${msg.ok ? "text-ok" : "text-bad"}`}>
      {msg.ok ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}<span>{msg.text}</span>
    </p>
  );

  if (user) return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="text-sm text-muted">Signed in as</div>
        <div className="font-semibold break-all">{user.email}</div>
        {profile && <span className="chip mt-2">{profile.role}</span>}
      </div>
      <form onSubmit={saveProfile} className="card p-5 space-y-3">
        <div className="font-semibold">Public profile</div>
        <label className="block text-sm">Display name<input className="input mt-1" maxLength={40} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></label>
        <label className="block text-sm">Username<input className="input mt-1" maxLength={24} pattern="[A-Za-z0-9_]{3,24}" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="letters, numbers, _" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.show_on_leaderboard} onChange={(e) => setForm({ ...form, show_on_leaderboard: e.target.checked })} /> Show me on public leaderboards</label>
        <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 size={15} className="animate-spin" />} Save</button>
      </form>
      <Message />
      <div className="flex gap-2"><Link href="/dashboard" className="btn btn-ghost">Dashboard</Link><button className="btn btn-ghost" onClick={async () => { await signOut(); router.push("/"); }}><LogOut size={15} /> Sign out</button></div>
    </div>
  );

  if (pending) return (
    <div className="max-w-md space-y-5">
      <button className="text-sm text-muted hover:text-fg inline-flex items-center gap-1" onClick={() => { setPending(null); setMsg(null); setCode(""); }}><ArrowLeft size={14} /> Use a different email</button>
      <div>
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed">We sent an email to <strong className="break-all">{pending.email}</strong>. {pending.kind === "verify" ? "Open it and press the confirmation link, or type the 6-digit code from the email below." : "Open it and press the sign-in link, or type the 6-digit code from the email below."}</p>
        <p className="mt-2 text-sm text-muted leading-relaxed">Not there after a minute? Look in Spam and, in Gmail, the Promotions tab. The sender is <span className="font-mono text-xs">noreply@mail.app.supabase.io</span>.</p>
      </div>
      <form onSubmit={verifyCode} className="space-y-3">
        <label className="block text-sm font-medium">6-digit code
          <input className="input mt-1 font-mono text-lg tracking-[0.3em]" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" maxLength={8} required value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
        </label>
        <button className="btn btn-primary w-full !py-2.5" disabled={busy || code.replace(/\D/g, "").length < 6}>{busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} {pending.kind === "verify" ? "Confirm my account" : "Sign in"}</button>
      </form>
      <button className="btn btn-ghost w-full" onClick={resend} disabled={busy || cooldown > 0}>{cooldown > 0 ? `Resend email (wait ${cooldown}s)` : pending.kind === "verify" ? "Resend confirmation email" : "Send a new code"}</button>
      <Message />
    </div>
  );

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-2">
        <button type="button" onClick={google} disabled={busy} className="btn w-full !py-2.5 bg-surface border-line hover:border-fg text-fg">
          <GoogleMark /> Continue with Google
        </button>
        {settings && !settings.google && <p className="text-xs text-muted">Google sign-in is being set up. Email works now.</p>}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted" aria-hidden><span className="flex-1 rule" />or use your email<span className="flex-1 rule" /></div>
      <div className="grid grid-cols-3 border border-line rounded-md overflow-hidden text-sm" role="tablist" aria-label="Email sign-in options">
        {([["signin", "Sign in"], ["signup", "New account"], ["code", "Email me a code"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => { setMode(k); setMsg(null); setNeedsConfirm(false); }} role="tab" aria-selected={mode === k}
            className={`py-2.5 px-1 font-medium border-r border-line last:border-r-0 ${mode === k ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}>{l}</button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && <label className="block text-sm">Your name (shown to others)<input className="input mt-1" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} /></label>}
        <label className="block text-sm">Email<input className="input mt-1" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {mode !== "code" && <label className="block text-sm">Password{mode === "signup" && <span className="text-muted"> (8 or more characters)</span>}<input className="input mt-1" type="password" required minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
        {mode === "code" && <p className="text-xs text-muted leading-relaxed">No password needed. We email you a sign-in link and a 6-digit code. If you don&apos;t have an account yet, this creates one.</p>}
        <button className="btn btn-primary w-full !py-2.5" disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : mode === "code" ? <Mail size={15} /> : <KeyRound size={15} />}{mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Email me a code"}</button>
      </form>
      <Message />
      {needsConfirm && <button className="btn btn-ghost w-full" onClick={resend} disabled={busy || cooldown > 0}>{cooldown > 0 ? `Resend (wait ${cooldown}s)` : "Resend confirmation email"}</button>}
      <p className="text-xs text-muted leading-relaxed">Progress you made as a guest stays in this browser. After you sign in you can copy it to your account from the dashboard. Read our <Link href="/privacy" className="link">privacy notes</Link>.</p>
    </div>
  );
}
