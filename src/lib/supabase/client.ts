"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the Supabase backend is configured via env vars. */
export const backendConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!backendConfigured) return null;
  if (!client) client = createClient(url!, anon!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}
