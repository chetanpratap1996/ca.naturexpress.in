import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl && supabaseKey) &&
    !supabaseUrl?.includes("taxobrain-demo")
  );
};

// Never silently connect to a hard-coded project when environment configuration is absent.
export const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseKey || "missing-supabase-publishable-key",
);
