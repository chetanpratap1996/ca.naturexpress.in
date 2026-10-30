import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ success: false, error: "Authentication service is not configured." }, { status: 503 });

  const pendingCookies: Array<{ name: string; value: string; options?: any }> = [];
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => { pendingCookies.push(...cookies); },
    },
  });
  await supabase.auth.signOut();
  const response = NextResponse.json({ success: true });
  for (const cookie of pendingCookies) response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
