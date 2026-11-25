import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://uesllnkjrbpmynihvlvy.supabase.co";
const supabaseKey = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

export const createClient = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const cookies = request.cookies.getAll();
  const hasSupabaseSession = cookies.some((c) => c.name.startsWith("sb-"));

  // Fast-path: Skip remote Supabase auth.getUser() HTTPS round-trip when no sb-* cookie exists
  if (!supabaseUrl || !supabaseKey || !hasSupabaseSession) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // Refresh auth token safely
  try {
    await supabase.auth.getUser();
  } catch {
    // Session refresh bypass for non-auth requests
  }

  return supabaseResponse;
};
