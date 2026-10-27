import { AuthUser } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/client";

function roleForUi(role: string): AuthUser["role"] | null {
  if (["SUPER_ADMIN", "PARTNER"].includes(role)) return "PARTNER";
  if (role === "PAID_CA_MANAGER") return "MANAGER";
  if (role === "ARTICLE_TRAINEE") return "ARTICLE";
  if (["CLIENT_PROMOTER", "CLIENT_ACCOUNTANT"].includes(role)) return "CLIENT";
  return null;
}

/** Resolve the display profile from the currently authenticated Supabase user. */
export async function loadAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return null;
    const { data: sessionData } = await supabase.auth.getSession();

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id,firm_id,email,phone,full_name,role,is_active,membership_number,articleship_reg_no")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError || !profile || !profile.is_active || !profile.firm_id) return null;

    const role = roleForUi(profile.role);
    if (!role) return null;

    const { data: firm, error: firmError } = await supabase
      .from("firms")
      .select("firm_name,frn")
      .eq("id", profile.firm_id)
      .maybeSingle();
    if (firmError || !firm) return null;

    let clientEntityId: string | undefined;
    let clientGroupId: string | undefined;
    if (role === "CLIENT") {
      const { data: access, error: accessError } = await supabase
        .from("user_client_entities")
        .select("entity_id,client_entities(group_id)")
        .eq("user_id", profile.id)
        .limit(1)
        .maybeSingle();
      if (accessError || !access) return null;
      clientEntityId = access.entity_id;
      const entity = Array.isArray(access.client_entities) ? access.client_entities[0] : access.client_entities;
      clientGroupId = entity?.group_id;
    }

    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email || "",
      phone: profile.phone || "",
      role,
      designation: role === "PARTNER" ? "Firm Partner" : role === "MANAGER" ? "Firm Manager" : role === "ARTICLE" ? "Article Trainee" : "Client Portal User",
      firmId: profile.firm_id,
      firmName: firm.firm_name,
      firmFrn: firm.frn,
      membershipNo: profile.membership_number || undefined,
      articleshipRegNo: profile.articleship_reg_no || undefined,
      clientGroupId,
      clientEntityId,
      expiresAt: new Date((sessionData.session?.expires_at || Math.floor(Date.now() / 1000) + 3600) * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function signOutSupabaseUser(): Promise<void> {
  try {
    await createClient().auth.signOut();
  } catch {
    // Local UI state is still cleared by the caller. The server auth guard will
    // reject requests if the provider session is unavailable or expired.
  }
}
