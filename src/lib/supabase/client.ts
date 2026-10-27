import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://") &&
    typeof supabaseKey === "string" &&
    supabaseKey.length > 0 &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("taxobrain-demo")
  );
};

export const supabase = isSupabaseConfigured() && supabaseKey
  ? createClient(supabaseUrl!, supabaseKey)
  : null;
