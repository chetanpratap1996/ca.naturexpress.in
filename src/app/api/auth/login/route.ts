import { NextRequest, NextResponse } from "next/server";
import { 
  authenticateClientEntity, 
  authenticateStaffUser, 
  checkRateLimit 
} from "@/lib/auth/enterpriseAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portalMode, identifier, secret, membershipNo } = body;

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Web Browser";

    // 1. Rate Limiting Check
    const rateCheck = checkRateLimit(`${portalMode}:${identifier}`);
    if (rateCheck.isBlocked) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many failed attempts. Please wait ${rateCheck.retryAfterSec} seconds before trying again.`,
          code: "RATE_LIMITED"
        },
        { status: 429 }
      );
    }

    // 2. Route to respective authentication handler
    let result;
    if (portalMode === "client") {
      result = await authenticateClientEntity(identifier, secret, ip, userAgent);
    } else {
      result = await authenticateStaffUser(identifier, secret, membershipNo, ip, userAgent);
    }

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || "Authentication failed.", code: result.code },
        { status: 401 }
      );
    }

    // 3. Set Session Cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    response.cookies.set("bt_session_token", result.user.token, {
      path: "/",
      maxAge: 30 * 86400,
      sameSite: "lax",
      httpOnly: false, // Accessible to client-side session store
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err: any) {
    console.error("Auth login API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server authentication error." },
      { status: 500 }
    );
  }
}
