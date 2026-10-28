import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { AuthUser, DEMO_USERS, UserRole } from "@/lib/auth/session";

export interface ServerAuthContext {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: UserRole | null;
  clientGroupId?: string;
  clientEntityId?: string;
  firmId?: string;
  authUserId?: string;
  isSandboxMode: boolean;
  error?: string;
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

/** Creates a request-bound Supabase client. Auth is always verified against Supabase. */
export function createRequestSupabaseClient(request: NextRequest) {
  const config = getSupabaseConfig();
  if (!config) return null;

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      // Middleware owns cookie refresh. API handlers must not mutate headers here.
      setAll: () => undefined,
    },
  });
}

function mapRole(role: string): UserRole | null {
  switch (role) {
    case "SUPER_ADMIN":
    case "PARTNER":
      return "PARTNER";
    case "PAID_CA_MANAGER":
    case "ARTICLE_TRAINEE":
      return "ARTICLE";
    case "CLIENT_PROMOTER":
    case "CLIENT_ACCOUNTANT":
      return "CLIENT";
    default:
      return null;
  }
}

/**
 * Only Supabase Auth sessions plus an active server-managed users profile are trusted.
 * No client-supplied role, unsigned token, or sandbox header can authenticate in production.
 */
export async function authenticateServerRequest(request: NextRequest): Promise<ServerAuthContext> {
  // Local-only demo compatibility. This branch is compiled out of production behavior;
  // it must never be used with real or shared data.
  if (process.env.NODE_ENV !== "production") {
    const demoToken = request.cookies.get("bt_session_token")?.value ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const demoUser = Object.values(DEMO_USERS).find((candidate) => candidate.token === demoToken) ||
      (demoToken?.startsWith("tok_client_") ? DEMO_USERS.client : null);
    if (demoUser) {
      return {
        isAuthenticated: true,
        user: demoUser,
        role: demoUser.role,
        clientGroupId: demoUser.clientGroupId,
        clientEntityId: demoUser.clientEntityId,
        firmId: demoUser.firmId,
        isSandboxMode: true,
      };
    }
  }

  const supabase = createRequestSupabaseClient(request);
  if (!supabase) {
    return { isAuthenticated: false, user: null, role: null, isSandboxMode: false, error: "Supabase is not configured." };
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { isAuthenticated: false, user: null, role: null, isSandboxMode: false, error: "A valid Supabase session is required." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, auth_user_id, firm_id, email, phone, full_name, role, membership_number, articleship_reg_no, client_group_id, client_entity_id, is_active")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (profileError || !profile) {
      return { isAuthenticated: false, user: null, role: null, isSandboxMode: false, error: "No active firm user profile is linked to this account." };
    }

    const role = mapRole(profile.role);
    if (!role || !profile.firm_id) {
      return { isAuthenticated: false, user: null, role: null, isSandboxMode: false, error: "The firm user profile has no supported role or firm." };
    }

    // A client must be assigned to an entity or an explicitly authorized group.
    if (role === "CLIENT" && !profile.client_entity_id && !profile.client_group_id) {
      return { isAuthenticated: false, user: null, role: null, isSandboxMode: false, error: "The client account has no assigned entity or group." };
    }

    const { data: firm } = await supabase.from("firms").select("firm_name, frn").eq("id", profile.firm_id).maybeSingle();
    const appUser: AuthUser = {
      // Use the firm profile id for foreign keys; retain the Auth id separately for auth-scoped RLS.
      id: profile.id,
      name: profile.full_name || user.email || "Firm user",
      email: profile.email || user.email || "",
      phone: profile.phone || user.phone || "",
      role,
      designation: profile.role,
      firmId: profile.firm_id,
      firmName: firm?.firm_name || process.env.NEXT_PUBLIC_FIRM_NAME || "CA Practice",
      firmFrn: firm?.frn || process.env.NEXT_PUBLIC_FIRM_FRN || "",
      membershipNo: profile.membership_number || undefined,
      articleshipRegNo: profile.articleship_reg_no || undefined,
      clientGroupId: profile.client_group_id || undefined,
      clientEntityId: profile.client_entity_id || undefined,
      token: "",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    return {
      isAuthenticated: true,
      user: appUser,
      role,
      firmId: profile.firm_id,
      authUserId: user.id,
      clientGroupId: profile.client_group_id || undefined,
      clientEntityId: profile.client_entity_id || undefined,
      isSandboxMode: false,
    };
  } catch {
    return { isAuthenticated: false, user: null, role: null, isSandboxMode: false, error: "Unable to verify the Supabase session." };
  }
}

export async function enforceApiRole(
  request: NextRequest,
  allowedRoles: UserRole[],
): Promise<{ auth: ServerAuthContext; errorResponse?: NextResponse }> {
  const auth = await authenticateServerRequest(request);
  if (!auth.isAuthenticated || !auth.user || !auth.role) {
    return {
      auth,
      errorResponse: NextResponse.json({ success: false, error: "Authentication required.", code: "AUTH_REQUIRED" }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(auth.role)) {
    return {
      auth,
      errorResponse: NextResponse.json({ success: false, error: "This action is not permitted for your role.", code: "FORBIDDEN" }, { status: 403 }),
    };
  }

  return { auth };
}

export async function writeServerAuditLog(
  request: NextRequest,
  auth: ServerAuthContext,
  entry: { entityName: string; entityId?: string; action: string; details: string; category: string },
) {
  if (!auth.isAuthenticated || !auth.user || !auth.firmId) return { error: new Error("Authenticated firm context is required for audit logging.") };
  const client = createRequestSupabaseClient(request);
  if (!client) return { error: new Error("Supabase is not configured.") };
  const { data, error } = await client.rpc("append_audit_event", {
    p_entity_id: entry.entityId || null,
    p_action: entry.action.slice(0, 100),
    p_details: entry.details.slice(0, 4000),
    p_category: entry.category.slice(0, 50),
  });
  return { data, error };
}
