"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

/** Landing page for email confirmation and magic links. supabase-js reads the token from the URL. */
export default function Callback() {
  const router = useRouter();
  const [msg, setMsg] = useState("Signing you in…");
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setMsg("The backend is not configured."); return; }
    const params = new URLSearchParams(window.location.search);
    const errDesc = params.get("error_description") || new URLSearchParams(window.location.hash.slice(1)).get("error_description");
    if (errDesc) { setMsg(`Sign-in failed: ${errDesc}`); return; }
    const code = params.get("code");
    const done = () => router.replace("/dashboard");
    (async () => {
      if (code) { const { error } = await sb.auth.exchangeCodeForSession(code); if (error) { setMsg(`Sign-in failed: ${error.message}`); return; } }
      const { data } = await sb.auth.getSession();
      if (data.session) done();
      else { const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { if (s) { sub.subscription.unsubscribe(); done(); } }); setTimeout(() => setMsg("This link may have expired. Request a new one from the sign-in page."), 6000); }
    })();
  }, [router]);
  return <div className="mx-auto max-w-xl px-4 py-20 text-center text-muted">{msg}</div>;
}
