// ============================================================================
// ENTERPRISE LOGIN API ROUTE
// Rate-limited authentication against PostgreSQL (users & client_entities)
// and cryptographically signed HMAC-SHA256 HttpOnly session cookies
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  authenticateClientEntity,
  authenticateStaffUser,
  checkRateLimit,
} from "@/lib/auth/enterpriseAuth";
import { signSessionTokenAsync } from "@/lib/auth/serverAuth";
import { AuthUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const portalMode = body.portalMode === "client" ? "client" : "staff";
    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const secret = typeof body.secret === "string" ? body.secret.trim() : "";
    const membershipNo = typeof body.membershipNo === "string" ? body.membershipNo.trim() : undefined;

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Web Browser";

    if (!identifier || !secret) {
      return NextResponse.json(
        {
          success: false,
          error:
            portalMode === "client"
              ? "Please enter your registered Mobile Number / PAN and 4-Digit Access PIN."
              : "Please enter your registered Email / Phone and Password.",
          code: "MISSING_CREDENTIALS",
        },
        { status: 400 }
      );
    }

    // 1. Rate Limiting Check (per identifier + IP so one user's typo never locks out an entire office Wi-Fi)
    const rateKey = `${portalMode}:${identifier.toLowerCase()}:${ip}`;
    const idRateCheck = checkRateLimit(rateKey);
    if (idRateCheck.isBlocked) {
      const waitSec = idRateCheck.retryAfterSec || 60;
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Please wait ${waitSec} seconds before retrying.`,
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    // 2. Authenticate against PostgreSQL
    const result =
      portalMode === "client"
        ? await authenticateClientEntity(identifier, secret, ip, userAgent)
        : await authenticateStaffUser(identifier, secret, membershipNo, ip, userAgent);

    if (!result.success || !result.user) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Invalid credentials.",
          code: result.code || "AUTH_FAILED",
        },
        { status: 401 }
      );
    }

    // 3. Mint HMAC-SHA256 signed session token
    const signedToken = await signSessionTokenAsync({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      role: result.user.role,
      designation: result.user.designation,
      firmId: result.user.firmId,
      firmName: result.user.firmName,
      firmFrn: result.user.firmFrn,
      clientGroupId: result.user.clientGroupId,
      clientEntityId: result.user.clientEntityId,
    });

    const expiresInSec = result.user.role === "CLIENT" ? 7 * 86400 : 86400;
    const safeUser: AuthUser = {
      ...result.user,
      token: "httpOnly-session",
      expiresAt: new Date(Date.now() + expiresInSec * 1000).toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      user: safeUser,
    });

    response.cookies.set("bt_session_token", signedToken, {
      path: "/",
      maxAge: expiresInSec,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err: any) {
    console.error("Auth login API critical error:", err?.message || err);
    return NextResponse.json(
      { success: false, error: "Internal server authentication error.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
