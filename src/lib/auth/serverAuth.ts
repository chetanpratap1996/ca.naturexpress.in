// ============================================================================
// ENTERPRISE SERVER-SIDE AUTHENTICATION & RBAC GUARD
// Universal Edge-compatible HMAC-SHA256 tokens, Supabase SSR auth, and strict RBAC
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AuthUser, UserRole } from "@/lib/auth/session";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

const SESSION_COOKIE_NAME = "bt_session_token";
const TOKEN_PREFIX = "bt_v5_";

function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || secret.length < 16 || secret.includes("generate-secure")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: AUTH_SECRET or NEXTAUTH_SECRET (>=16 chars) is required in production.");
    }
    return "dev_only_fallback_secret_change_me_2026";
  }
  return secret;
}

function toBase64Url(uint8: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < uint8.length; i++) {
    bin += String.fromCharCode(uint8[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(base64url: string): Uint8Array {
  const base64 =
    base64url.replace(/-/g, "+").replace(/_/g, "/") +
    "==".slice(0, (4 - (base64url.length % 4)) % 4);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

export interface SessionTokenClaims {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  designation?: string;
  firmId: string;
  firmName?: string;
  firmFrn?: string;
  clientEntityId?: string;
  clientGroupId?: string;
  exp: number; // Unix timestamp in seconds
  iat: number;
}

export interface ServerAuthContext {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: UserRole | null;
  userName?: string;
  userEmail?: string;
  firmId?: string;
  clientGroupId?: string;
  clientEntityId?: string;
  isSandboxMode: boolean;
  error?: string;
}

async function importHmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token (Edge + Node.js compatible).
 */
export async function signSessionTokenAsync(
  claims: Omit<SessionTokenClaims, "exp" | "iat">,
  expiresInSec = 7 * 86400
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSec;
  const fullClaims: SessionTokenClaims = { ...claims, exp, iat };
  const enc = new TextEncoder();
  const payloadB64 = toBase64Url(enc.encode(JSON.stringify(fullClaims)));

  const key = await importHmacKey("sign");
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sigBuffer));

  return `${TOKEN_PREFIX}${payloadB64}.${sigB64}`;
}

/**
 * Cryptographically verifies HMAC-SHA256 signature and expiration of a session token.
 */
export async function verifySessionTokenAsync(token: string): Promise<SessionTokenClaims | null> {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  const parts = token.slice(TOKEN_PREFIX.length).split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  try {
    const key = await importHmacKey("verify");
    const enc = new TextEncoder();
    const sigBytes = fromBase64Url(sigB64);
    const sigArrayBuffer = sigBytes.buffer.slice(
      sigBytes.byteOffset,
      sigBytes.byteOffset + sigBytes.byteLength
    ) as ArrayBuffer;

    const isValidSig = await crypto.subtle.verify(
      "HMAC",
      key,
      sigArrayBuffer,
      enc.encode(payloadB64)
    );
    if (!isValidSig) return null;

    const rawBytes = fromBase64Url(payloadB64);
    const claims = JSON.parse(new TextDecoder().decode(rawBytes)) as SessionTokenClaims;
    const nowSec = Math.floor(Date.now() / 1000);
    if (!claims.exp || claims.exp < nowSec) return null;
    if (!claims.id || !claims.role || !claims.firmId) return null;

    return claims;
  } catch {
    return null;
  }
}

const unauthenticated = (
  error = "Authentication required. Please sign in with an active account."
): ServerAuthContext => ({
  isAuthenticated: false,
  user: null,
  role: null,
  isSandboxMode: false,
  error,
});

function mapRole(role: unknown): UserRole | null {
  switch (role) {
    case "SUPER_ADMIN":
    case "PARTNER":
      return "PARTNER";
    case "PAID_CA_MANAGER":
    case "ARTICLE_TRAINEE":
    case "ARTICLE":
      return "ARTICLE";
    case "TEAM":
      return "TEAM";
    case "CLIENT_PROMOTER":
    case "CLIENT_ACCOUNTANT":
    case "CLIENT":
      return "CLIENT";
    default:
      return null;
  }
}

/**
 * Validates incoming request authorization from:
 * 1. Cryptographically verified HMAC-SHA256 session token (HttpOnly cookie or Bearer header)
 * 2. Active Supabase Auth SSR session with a mandatory linked active public.users profile
 */
export async function authenticateServerRequest(request: NextRequest): Promise<ServerAuthContext> {
  const authHeader = request.headers.get("authorization") || "";
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value || "";

  let rawToken = cookieToken;
  if (authHeader.startsWith("Bearer ")) {
    rawToken = authHeader.slice(7).trim();
  }

  // 1. Verify HMAC-SHA256 Signed Session Token
  if (rawToken && rawToken.startsWith(TOKEN_PREFIX)) {
    const verified = await verifySessionTokenAsync(rawToken);
    if (verified) {
      if (verified.role === "CLIENT" && !verified.clientEntityId && !verified.clientGroupId) {
        return unauthenticated("Client session missing entity scope.");
      }

      const user: AuthUser = {
        id: verified.id,
        name: verified.name,
        email: verified.email,
        phone: verified.phone || "",
        role: verified.role,
        designation:
          verified.designation ||
          (verified.role === "PARTNER"
            ? "Managing Partner (FCA)"
            : verified.role === "ARTICLE" || verified.role === "TEAM"
            ? "Practice Staff"
            : "Client Portal User"),
        firmId: verified.firmId,
        firmName: verified.firmName || DEFAULT_FIRM_BRANDING.firmName,
        firmFrn: verified.firmFrn || DEFAULT_FIRM_BRANDING.frn,
        clientGroupId: verified.clientGroupId,
        clientEntityId: verified.clientEntityId,
        token: "", // Never echo raw session secret unnecessarily
        expiresAt: new Date(verified.exp * 1000).toISOString(),
      };

      return {
        isAuthenticated: true,
        user,
        role: verified.role,
        userName: user.name,
        userEmail: user.email,
        firmId: verified.firmId,
        clientGroupId: verified.clientGroupId,
        clientEntityId: verified.clientEntityId,
        isSandboxMode: false,
      };
    }
  }

  // 2. Check Supabase Auth SSR Session (must have an active linked public.users row)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      });
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (!authError && authUser) {
        const { data: profile } = await supabase
          .from("users")
          .select("id, email, phone, full_name, role, firm_id, is_active, client_group_id, client_entity_id")
          .eq("auth_user_id", authUser.id)
          .eq("is_active", true)
          .maybeSingle();

        // Fail closed: never trust user_metadata or default to PARTNER when profile is missing
        if (!profile || !profile.firm_id) {
          return unauthenticated("User profile is not linked to an active firm account.");
        }

        const role = mapRole(profile.role);
        if (!role) {
          return unauthenticated("Account role is invalid.");
        }

        if (role === "CLIENT" && !profile.client_entity_id && !profile.client_group_id) {
          return unauthenticated("Client account has no assigned entity or group scope.");
        }

        const user: AuthUser = {
          id: profile.id,
          name: profile.full_name || authUser.email || "Authenticated User",
          email: profile.email || authUser.email || "",
          phone: profile.phone || authUser.phone || "",
          role,
          designation:
            role === "PARTNER"
              ? "Managing Partner (FCA)"
              : role === "ARTICLE" || role === "TEAM"
              ? "Practice Staff"
              : "Client Portal User",
          firmId: profile.firm_id,
          firmName: DEFAULT_FIRM_BRANDING.firmName,
          firmFrn: DEFAULT_FIRM_BRANDING.frn,
          clientGroupId: profile.client_group_id || undefined,
          clientEntityId: profile.client_entity_id || undefined,
          token: "",
          expiresAt: authUser.last_sign_in_at || new Date(Date.now() + 86400000).toISOString(),
        };

        return {
          isAuthenticated: true,
          user,
          role: user.role,
          userName: user.name,
          userEmail: user.email,
          firmId: profile.firm_id,
          clientGroupId: user.clientGroupId,
          clientEntityId: user.clientEntityId,
          isSandboxMode: false,
        };
      }
    } catch {
      // Supabase verification error
    }
  }

  return unauthenticated("Authentication required. Please sign in with valid credentials.");
}

/**
 * Enforces role-based authorization for an API route.
 * Returns 401 if unauthenticated, 403 if role unauthorized.
 */
export async function enforceApiRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ auth: ServerAuthContext; errorResponse?: NextResponse }> {
  const auth = await authenticateServerRequest(request);

  if (!auth.isAuthenticated || !auth.user || !auth.role) {
    return {
      auth,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: auth.error || "Unauthorized: Authentication session required.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(auth.role)) {
    return {
      auth,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Forbidden: Access restricted to [${allowedRoles.join(", ")}].`,
          code: "FORBIDDEN",
        },
        { status: 403 }
      ),
    };
  }

  return { auth };
}
