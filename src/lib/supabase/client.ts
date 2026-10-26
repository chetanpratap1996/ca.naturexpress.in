import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uesllnkjrbpmynihvlvy.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  "sb_publishable_6gMbtVkt9KiTJrKWCvDJbw_FvSTSWek";

export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== undefined || 
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("taxobrain-demo")
  );
};

export const supabase = createClient(supabaseUrl, supabaseKey);
