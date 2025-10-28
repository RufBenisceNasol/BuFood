// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// ✅ Load env vars from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🧠 Initialize Supabase client (no side-effects, avoid circular deps)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "delibup-auth",
  },
});

// ✅ Export helper to get current user session easily
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("[Supabase] getCurrentUser error:", error);
    return null;
  }
  return data?.user || null;
}

export async function getCurrentToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[Supabase] getCurrentToken error:", error);
    return null;
  }
  return data?.session?.access_token || null;
}
