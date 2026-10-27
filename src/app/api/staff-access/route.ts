import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient as createSession } from "@/utils/supabase/server";

const STAFF_ROLES = ["PAID_CA_MANAGER", "ARTICLE_TRAINEE"] as const;
const ASSIGNEE_ROLES = ["SUPER_ADMIN", "PARTNER", ...STAFF_ROLES] as const;
type StaffRole = (typeof STAFF_ROLES)[number];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const adminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, secret = process.env.SUPABASE_SECRET_KEY;
  return url && secret ? createAdmin(url, secret, { auth: { autoRefreshToken: false, persistSession: false } }) : null;
};
const sameOrigin = (request: Request) => {
  try { return request.headers.get("origin") === new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin; } catch { return false; }
};
async function context() {
  const session = createSession(await cookies());
  const { data: auth, error } = await session.auth.getUser();
  if (error || !auth.user) return { response: NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 }) };
  const { data: profile, error: profileError } = await session.from("users").select("id,firm_id,role,is_active").eq("id", auth.user.id).maybeSingle();
  if (profileError) return { response: NextResponse.json({ success: false, error: "Workspace access could not be verified." }, { status: 503 }) };
  if (!profile?.is_active || !profile.firm_id || !["PARTNER", "SUPER_ADMIN"].includes(profile.role)) return { response: NextResponse.json({ success: false, error: "Partner authorization is required." }, { status: 403 }) };
  const admin = adminClient();
  if (!admin) return { response: NextResponse.json({ success: false, error: "Employee access administration is not configured." }, { status: 503 }) };
  return { admin, profile };
}

export async function GET() {
  const ctx = await context(); if ("response" in ctx) return ctx.response;
  try {
    const [{ data: profiles, error: pe }, { data: entities, error: ee }] = await Promise.all([
      ctx.admin.from("users").select("id,email,full_name,role,is_active").eq("firm_id", ctx.profile.firm_id).in("role", [...ASSIGNEE_ROLES]).order("full_name"),
      ctx.admin.from("client_entities").select("id,entity_name").eq("firm_id", ctx.profile.firm_id).order("entity_name"),
    ]);
    if (pe || ee) throw pe || ee;
    const ids = (profiles || []).map(p => p.id);
    const { data: assignments, error: ae } = ids.length ? await ctx.admin.from("user_staff_entities").select("user_id,entity_id").in("user_id", ids) : { data: [], error: null };
    if (ae) throw ae;
    const entityMap = new Map((entities || []).map(e => [e.id, e.entity_name]));
    const byUser = new Map<string, Array<{ id: string; name: string }>>();
    for (const a of assignments || []) { const list = byUser.get(a.user_id) || []; const name = entityMap.get(a.entity_id); if (name) list.push({ id: a.entity_id, name }); byUser.set(a.user_id, list); }
    return NextResponse.json({ success: true, users: (profiles || []).map(p => ({ id: p.id, email: p.email, name: p.full_name, role: p.role, isActive: p.is_active, entities: byUser.get(p.id) || [] })), entities: (entities || []).map(e => ({ id: e.id, name: e.entity_name })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ success: false, error: "Employee access records are temporarily unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: "Request origin could not be verified." }, { status: 403 });
  const ctx = await context(); if ("response" in ctx) return ctx.response;
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const role: StaffRole | null = STAFF_ROLES.includes(body.role) ? body.role : null;
    const entityIds: string[] | null = Array.isArray(body.entityIds) && body.entityIds.length > 0 && body.entityIds.length <= 50 && new Set(body.entityIds).size === body.entityIds.length && body.entityIds.every((id: unknown) => typeof id === "string" && UUID.test(id)) ? body.entityIds : null;
    if (!name || name.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255 || !role || !entityIds) return NextResponse.json({ success: false, error: "Enter a name, valid email, employee role, and at least one client entity." }, { status: 400 });
    if (phone && (phone.replace(/\D/g, "").length < 10 || phone.replace(/\D/g, "").length > 15)) return NextResponse.json({ success: false, error: "Enter a valid phone number or leave it blank." }, { status: 400 });
    const { data: entities, error: entityError } = await ctx.admin.from("client_entities").select("id").eq("firm_id", ctx.profile.firm_id).in("id", entityIds);
    if (entityError) throw entityError;
    if ((entities || []).length !== entityIds.length) return NextResponse.json({ success: false, error: "One or more selected entities are outside this firm." }, { status: 400 });
    const { data: existing, error: lookupError } = await ctx.admin.from("users").select("id,firm_id,role,is_active").eq("email", email).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) {
      if (existing.firm_id !== ctx.profile.firm_id || existing.role !== role || !existing.is_active) return NextResponse.json({ success: false, error: "This email already belongs to an account that cannot be assigned here." }, { status: 409 });
      const { error } = await ctx.admin.rpc("grant_staff_entity_access", { p_firm_id: ctx.profile.firm_id, p_actor_id: ctx.profile.id, p_user_id: existing.id, p_entity_ids: entityIds });
      if (error) throw error;
      return NextResponse.json({ success: true, invitationSent: false, message: "Assigned entities were added to the existing employee account." });
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) return NextResponse.json({ success: false, error: "The public site URL is not configured for invitation links." }, { status: 503 });
    let redirectTo: string; try { redirectTo = new URL("/set-password", siteUrl).toString(); } catch { return NextResponse.json({ success: false, error: "The public site URL is invalid." }, { status: 503 }); }
    const { data: invite, error: inviteError } = await ctx.admin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { full_name: name } });
    if (inviteError || !invite.user) return NextResponse.json({ success: false, error: "The invitation email could not be sent. Check the address or contact the workspace administrator." }, { status: 502 });
    const id = invite.user.id;
    const rollback = async () => { await ctx.admin.from("user_staff_entities").delete().eq("user_id", id); await ctx.admin.from("users").delete().eq("id", id).eq("firm_id", ctx.profile.firm_id); await ctx.admin.auth.admin.deleteUser(id); };
    const { error: insertError } = await ctx.admin.from("users").insert({ id, firm_id: ctx.profile.firm_id, email, phone, full_name: name, role, is_active: true });
    if (insertError) { await rollback(); return NextResponse.json({ success: false, error: "The invited employee profile could not be initialized." }, { status: 503 }); }
    const { error: grantError } = await ctx.admin.rpc("grant_staff_entity_access", { p_firm_id: ctx.profile.firm_id, p_actor_id: ctx.profile.id, p_user_id: id, p_entity_ids: entityIds });
    if (grantError) { await rollback(); return NextResponse.json({ success: false, error: "Entity access could not be assigned. The incomplete invitation was cancelled." }, { status: 503 }); }
    return NextResponse.json({ success: true, invitationSent: true }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: "Employee access could not be saved. Refresh and try again." }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: "Request origin could not be verified." }, { status: 403 });
  const ctx = await context(); if ("response" in ctx) return ctx.response;
  try {
    const body = await request.json();
    if (typeof body.userId !== "string" || !UUID.test(body.userId) || typeof body.entityId !== "string" || !UUID.test(body.entityId)) return NextResponse.json({ success: false, error: "Choose a valid employee and entity assignment." }, { status: 400 });
    const { error } = await ctx.admin.rpc("revoke_staff_entity_access", { p_firm_id: ctx.profile.firm_id, p_actor_id: ctx.profile.id, p_user_id: body.userId, p_entity_id: body.entityId });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: "Employee access could not be revoked. Refresh and try again." }, { status: 503 }); }
}
