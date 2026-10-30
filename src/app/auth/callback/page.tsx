"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/supabase/auth-helpers";

/**
 * Landing page for Google sign-in, email confirmation and magic links. Handles all three shapes Supabase uses:
 *  - ?code=…                      (PKCE / OAuth)            → exchangeCodeForSession
 *  - ?token_hash=…&type=…          (custom email templates) → verifyOtp
 *  - #access_token=…               (implicit flow)          → read automatically by supabase-js
 * and errors in either the query string or the hash.
 */
export default function Callback() {
  const router = useRouter();
  const [state, setState] = useState<{ status: "working" | "error"; text: string }>({ status: "working", text: "Signing you in…" });
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setState({ status: "error", text: "Accounts are not switched on for this copy of the site." }); return; }
    const q = new URLSearchParams(window.location.search);
    const h = new URLSearchParams(window.location.hash.slice(1));
    const rawNext = q.get("next") || "/dashboard";
    const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
    const errCode = q.get("error_code") || h.get("error_code");
    const errDesc = q.get("error_description") || h.get("error_description");
    const done = () => router.replace(next);
    if (errCode || errDesc) {
      const text = errCode === "otp_expired"
        ? "This link has expired or was already used. If you already pressed it once, your email is probably confirmed. Try signing in."
        : friendlyAuthError({ message: errDesc ?? undefined, code: errCode ?? undefined });
      setState({ status: "error", text });
      return;
    }
    (async () => {
      const code = q.get("code");
      const tokenHash = q.get("token_hash");
      const type = q.get("type") as EmailOtpType | null;
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) { const { data } = await sb.auth.getSession(); if (!data.session) { setState({ status: "error", text: friendlyAuthError(error) }); return; } }
      } else if (tokenHash && type) {
        const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) { setState({ status: "error", text: friendlyAuthError(error) }); return; }
      }
      const { data } = await sb.auth.getSession();
      if (data.session) { done(); return; }
      const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { if (s) { sub.subscription.unsubscribe(); done(); } });
      setTimeout(() => setState({ status: "error", text: "We couldn't finish signing you in. The link may have expired. Request a new one from the sign-in page." }), 8000);
    })();
  }, [router]);
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-bad" : "text-muted"}>{state.text}</p>
      {state.status === "error" && <Link href="/auth" className="btn btn-primary mt-6">Go to sign in</Link>}
    </div>
  );
}
