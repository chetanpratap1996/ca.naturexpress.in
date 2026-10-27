import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/utils/supabase/server";

const CLIENT_ROLES = ["CLIENT_PROMOTER", "CLIENT_ACCOUNTANT"] as const;
type ClientRole = (typeof CLIENT_ROLES)[number];

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createSupabaseClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

async function requirePartner() {
  const sessionClient = createSessionClient(await cookies());
  const { data: authData, error: authError } = await sessionClient.auth.getUser();
  if (authError || !authData.user) return { error: NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 }) };
  const { data: profile, error: profileError } = await sessionClient
    .from("users")
    .select("id,firm_id,role,full_name,is_active")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileError) return { error: NextResponse.json({ success: false, error: "Workspace access could not be verified." }, { status: 503 }) };
  if (!profile?.is_active || !profile.firm_id || !["SUPER_ADMIN", "PARTNER"].includes(profile.role)) {
    return { error: NextResponse.json({ success: false, error: "Partner authorization is required." }, { status: 403 }) };
  }
  const admin = createAdminClient();
  if (!admin) return { error: NextResponse.json({ success: false, error: "Client access administration is not configured." }, { status: 503 }) };
  return { admin, profile, user: authData.user };
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL;
  const expectedOrigin = configuredSite ? new URL(configuredSite).origin : new URL(request.url).origin;
  return origin === expectedOrigin;
}

function normalizeEntityIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) return null;
  const ids = [...new Set(value)];
  if (ids.length !== value.length || ids.some((id) => typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) return null;
  return ids;
}

export async function GET() {
  const context = await requirePartner();
  if ("error" in context) return context.error;
  const { admin, profile } = context;
  try {
    const { data: profiles, error: profileError } = await admin
      .from("users")
      .select("id,email,full_name,role,is_active")
      .eq("firm_id", profile.firm_id)
      .in("role", [...CLIENT_ROLES])
      .order("full_name", { ascending: true });
    if (profileError) throw profileError;
    const userIds = (profiles || []).map((item) => item.id);
    if (!userIds.length) return NextResponse.json({ success: true, users: [] }, { headers: { "Cache-Control": "private, no-store" } });

    const [{ data: assignments, error: assignmentError }, { data: entities, error: entityError }] = await Promise.all([
      admin.from("user_client_entities").select("user_id,entity_id").in("user_id", userIds),
      admin.from("client_entities").select("id,entity_name").eq("firm_id", profile.firm_id),
    ]);
    if (assignmentError || entityError) throw assignmentError || entityError;
    const entityById = new Map((entities || []).map((item) => [item.id, item]));
    const assignmentsByUser = new Map<string, Array<{ id: string; name: string }>>();
    for (const assignment of assignments || []) {
      const entity = entityById.get(assignment.entity_id);
      if (!entity) continue;
      const current = assignmentsByUser.get(assignment.user_id) || [];
      current.push({ id: entity.id, name: entity.entity_name });
      assignmentsByUser.set(assignment.user_id, current);
    }
    const users = (profiles || []).map((item) => ({
      id: item.id,
      email: item.email,
      name: item.full_name,
      role: item.role,
      isActive: item.is_active,
      entities: assignmentsByUser.get(item.id) || [],
    }));
    return NextResponse.json({ success: true, users }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Client access records are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, error: "Request origin could not be verified." }, { status: 403 });
  const context = await requirePartner();
  if ("error" in context) return context.error;
  const { admin, profile } = context;
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const role: ClientRole | null = CLIENT_ROLES.includes(body.role) ? body.role : null;
    const entityIds = normalizeEntityIds(body.entityIds);
    const phoneDigits = phone.replace(/\D/g, "");
    if (!name || name.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255 || !role || !entityIds) {
      return NextResponse.json({ success: false, error: "Enter a name, valid email, client role, and at least one valid client entity." }, { status: 400 });
    }
    if (phone && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
      return NextResponse.json({ success: false, error: "Enter a valid phone number or leave it blank." }, { status: 400 });
    }

    const { data: entities, error: entitiesError } = await admin
      .from("client_entities")
      .select("id")
      .eq("firm_id", profile.firm_id)
      .in("id", entityIds);
    if (entitiesError) throw entitiesError;
    if ((entities || []).length !== entityIds.length) {
      return NextResponse.json({ success: false, error: "One or more selected entities are not in this firm." }, { status: 400 });
    }

    const { data: existingProfile, error: existingProfileError } = await admin
      .from("users")
      .select("id,firm_id,role,is_active")
      .eq("email", email)
      .maybeSingle();
    if (existingProfileError) throw existingProfileError;

    if (existingProfile) {
      if (existingProfile.firm_id !== profile.firm_id || !CLIENT_ROLES.includes(existingProfile.role)) {
        return NextResponse.json({ success: false, error: "This email is already associated with an account that cannot be assigned here." }, { status: 409 });
      }
      const { error: assignmentError } = await admin.rpc("grant_client_entity_access", {
        p_firm_id: profile.firm_id,
        p_actor_id: profile.id,
        p_user_id: existingProfile.id,
        p_entity_ids: entityIds,
      });
      if (assignmentError) throw assignmentError;
      return NextResponse.json({ success: true, invitationSent: false, message: "Entity access was added to the existing client account." });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) return NextResponse.json({ success: false, error: "The public site URL is not configured for invitation links." }, { status: 503 });
    const redirectTo = new URL("/set-password", siteUrl).toString();
    const { data: invitation, error: invitationError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { full_name: name },
    });
    if (invitationError || !invitation.user) {
      return NextResponse.json({ success: false, error: "The invitation email could not be sent. Check the address or contact the workspace administrator." }, { status: 502 });
    }

    const authUserId = invitation.user.id;
    const rollbackInvite = async () => {
      await admin.from("user_client_entities").delete().eq("user_id", authUserId);
      await admin.from("users").delete().eq("id", authUserId).eq("firm_id", profile.firm_id);
      await admin.auth.admin.deleteUser(authUserId);
    };
    const { error: userInsertError } = await admin.from("users").insert({
      id: authUserId,
      firm_id: profile.firm_id,
      email,
      phone,
      full_name: name,
      role,
      is_active: true,
    });
    if (userInsertError) {
      await rollbackInvite();
      return NextResponse.json({ success: false, error: "The invited account profile could not be initialized." }, { status: 503 });
    }
    const { error: assignmentError } = await admin.rpc("grant_client_entity_access", {
      p_firm_id: profile.firm_id,
      p_actor_id: profile.id,
      p_user_id: authUserId,
      p_entity_ids: entityIds,
    });
    if (assignmentError) {
      await rollbackInvite();
      return NextResponse.json({ success: false, error: "Entity access could not be assigned. The incomplete invitation was cancelled." }, { status: 503 });
    }
    return NextResponse.json({ success: true, invitationSent: true }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Client access could not be saved. Refresh and try again." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, error: "Request origin could not be verified." }, { status: 403 });
  const context = await requirePartner();
  if ("error" in context) return context.error;
  const { admin, profile } = context;
  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const entityId = typeof body.entityId === "string" ? body.entityId : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entityId)) {
      return NextResponse.json({ success: false, error: "Choose a valid client account and entity assignment." }, { status: 400 });
    }
    const { data: accountDeactivated, error: revokeError } = await admin.rpc("revoke_client_entity_access", {
      p_firm_id: profile.firm_id,
      p_actor_id: profile.id,
      p_user_id: userId,
      p_entity_id: entityId,
    });
    if (revokeError) throw revokeError;
    return NextResponse.json({ success: true, accountDeactivated: Boolean(accountDeactivated) });
  } catch {
    return NextResponse.json({ success: false, error: "Client access could not be revoked. Refresh and try again." }, { status: 503 });
  }
}
