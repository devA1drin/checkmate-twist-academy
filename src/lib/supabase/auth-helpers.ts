"use client";
/** Small helpers around Supabase Auth used by the sign-in page and the callback page. */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface AuthSettings { google: boolean; email: boolean; signupDisabled: boolean; autoconfirm: boolean }

/** Reads the public /auth/v1/settings endpoint so we can tell whether a provider is switched on
 *  before sending the user away to it (a disabled provider otherwise ends on a raw JSON error page). */
export async function fetchAuthSettings(): Promise<AuthSettings | null> {
  if (!url || !anon) return null;
  try {
    const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anon } });
    if (!r.ok) return null;
    const j = await r.json();
    return { google: !!j.external?.google, email: !!j.external?.email, signupDisabled: !!j.disable_signup, autoconfirm: !!j.mailer_autoconfirm };
  } catch { return null; }
}

export function callbackUrl(next?: string): string {
  const base = `${window.location.origin}/auth/callback`;
  return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

/** Turns Supabase Auth error codes/messages into plain-language sentences. */
export function friendlyAuthError(e: { message?: string; code?: string; status?: number } | null | undefined): string {
  if (!e) return "Something went wrong. Please try again.";
  const code = e.code ?? "";
  const m = (e.message ?? "").toLowerCase();
  if (code === "invalid_credentials" || m.includes("invalid login credentials")) return "That email and password don't match. Check for typos, or use \"Email me a code\" instead.";
  if (code === "email_not_confirmed" || m.includes("email not confirmed")) return "Your email address isn't confirmed yet. Use the button below to send a new confirmation email.";
  if (code === "over_email_send_rate_limit" || m.includes("rate limit") || e.status === 429) return "Too many emails were sent in a short time. Please wait a few minutes and try again, or use Continue with Google.";
  if (code === "otp_expired" || m.includes("expired") || m.includes("invalid")) return "That code or link has expired or was already used. Request a new one.";
  if (code === "user_already_exists" || m.includes("already registered")) return "An account with this email already exists. Sign in instead.";
  if (code === "weak_password" || m.includes("password should")) return "Choose a longer password (at least 8 characters).";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) return "Google sign-in isn't switched on for this site yet. Use email for now.";
  if (code === "signup_disabled") return "New sign-ups are closed right now.";
  return e.message || "Something went wrong. Please try again.";
}
