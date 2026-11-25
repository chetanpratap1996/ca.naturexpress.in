import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Always clear our primary HttpOnly HMAC session cookie
  response.cookies.set("bt_session_token", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (url && key) {
      const pendingCookies: Array<{ name: string; value: string; options?: any }> = [];
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => {
            pendingCookies.push(...cookies);
          },
        },
      });
      await supabase.auth.signOut();
      for (const cookie of pendingCookies) {
        response.cookies.set(cookie.name, cookie.value, cookie.options);
      }
    }
  } catch (err) {
    console.error("[Logout API] Supabase signOut warning:", err);
  }

  return response;
}
