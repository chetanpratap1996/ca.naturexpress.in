/**
 * Brains & Taxes Enterprise Authentication & Session Manager
 * Multi-Tenant Role-Based Access Control (RBAC) with secure session state
 */

import { ClientEntity } from "@/lib/types";

export type UserRole = "PARTNER" | "ARTICLE" | "CLIENT";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  designation: string;
  firmId: string;
  firmName: string;
  firmFrn: string;
  membershipNo?: string;
  articleshipRegNo?: string;
  clientGroupId?: string;
  clientEntityId?: string;
  /** Client-side display cache only. Authorization is always verified by Supabase on the server. */
  token?: string;
  expiresAt: string;
}

export function normalizePhone10(rawPhone: string): string {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

// Enterprise Verified Personas for Testing and Evaluation
export const DEMO_USERS: Record<string, AuthUser> = {
  partner: {
    id: "USR-PARTNER-01",
    name: "CA Gunjan Jain",
    email: "partner@brainsandtaxes.com",
    phone: "+91 98000 00001",
    role: "PARTNER",
    designation: "Managing Partner (FCA)",
    firmId: "FRM-022998C",
    firmName: "GPA & Co., Chartered Accountants",
    firmFrn: "022998C",
    membershipNo: "022998C",
    token: "tok_partner_secure_session_2026",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
  article: {
    id: "USR-ARTICLE-01",
    name: "Kriti Jain",
    email: "audit.trainee@brainsandtaxes.com",
    phone: "+91 98000 00002",
    role: "ARTICLE",
    designation: "Assigned Article Assistant",
    firmId: "FRM-022998C",
    firmName: "GPA & Co., Chartered Accountants",
    firmFrn: "022998C",
    articleshipRegNo: "CRO022998",
    token: "tok_article_secure_session_2026",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
  client: {
    id: "USR-CLIENT-01",
    name: "Authorized Director",
    email: "director@client-portal.in",
    phone: "+91 98000 00003",
    role: "CLIENT",
    designation: "Director (Apex Laboratories Pvt Ltd)",
    firmId: "FRM-022998C",
    firmName: "GPA & Co., Chartered Accountants",
    firmFrn: "022998C",
    clientGroupId: "3c5eb209-459d-4af7-9868-36d7ac3d6493",
    clientEntityId: "d301662a-10ce-4e32-84ed-a9423a70101d",
    token: "tok_client_secure_session_2026",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
};

const STORAGE_KEY = "bt_enterprise_session_v4";
const COOKIE_NAME = "bt_session_token";

export function getActiveSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (!user?.id || !user?.role) return null;
    if (user.expiresAt && new Date(user.expiresAt).getTime() <= Date.now()) return null;
    return user;
  } catch {
    return null;
  }
}

export function setActiveSession(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  // Mock session cookies are allowed only in local development; production auth is Supabase SSR.
  if (process.env.NODE_ENV !== "production" && user.token) {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(user.token)}; path=/; max-age=86400; SameSite=Lax`;
  }
  window.dispatchEvent(new Event("taxobrain_auth_state_change"));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  window.dispatchEvent(new Event("taxobrain_auth_state_change"));
}

export function canSignAuditWorkpaper(user: AuthUser | null): boolean {
  return user?.role === "PARTNER";
}

export function canReconcileInvoices(user: AuthUser | null): boolean {
  return user?.role === "PARTNER";
}

export function canReviewDocuments(user: AuthUser | null): boolean {
  return user?.role === "PARTNER" || user?.role === "ARTICLE";
}

export function isClientUser(user: AuthUser | null): boolean {
  return user?.role === "CLIENT";
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Production-Safe Authentication Resolver
 * Validates credentials without leaking password formats or expected hints
 */
export function authenticateUser(
  identifier: string,
  rawPassword: string,
  clientRegistry: ClientEntity[] = []
): AuthResult {
  if (process.env.NODE_ENV === "production") {
    return { success: false, error: "Use the configured secure sign-in provider." };
  }
  const cleanId = (identifier || "").trim();
  const cleanPass = (rawPassword || "").trim();

  if (!cleanId || !cleanPass) {
    return {
      success: false,
      error: "Please enter your User ID and Security Password.",
    };
  }

  const cleanPhone10 = normalizePhone10(cleanId);
  const cleanUpper = cleanId.toUpperCase();
  const cleanLower = cleanId.toLowerCase();

  // 1. Partner Authentication
  const partnerUser = DEMO_USERS.partner;
  const partnerPhone10 = normalizePhone10(partnerUser.phone);
  if (
    cleanLower === partnerUser.email.toLowerCase() ||
    (cleanPhone10 && cleanPhone10 === partnerPhone10) ||
    cleanUpper === "PARTNER"
  ) {
    // Standard secure test password or production pass
    if (cleanPass === "Partner@2026" || cleanPass === "Gunjan@3639") {
      return { success: true, user: partnerUser };
    }
    return {
      success: false,
      error: "Invalid credentials. Please verify your User ID and password.",
    };
  }

  // 2. Article Authentication
  const articleUser = DEMO_USERS.article;
  const articlePhone10 = normalizePhone10(articleUser.phone);
  if (
    cleanLower === articleUser.email.toLowerCase() ||
    (cleanPhone10 && cleanPhone10 === articlePhone10) ||
    cleanUpper === "ARTICLE" ||
    cleanUpper === (articleUser.articleshipRegNo || "").toUpperCase()
  ) {
    if (cleanPass === "Article@2026" || cleanPass === "Kriti@5897") {
      return { success: true, user: articleUser };
    }
    return {
      success: false,
      error: "Invalid credentials. Please verify your User ID and password.",
    };
  }

  // 3. Client Authentication (by PAN or Phone)
  const allClients = [...clientRegistry];
  if (allClients.length === 0 && DEMO_USERS.client) {
    allClients.push({
      id: DEMO_USERS.client.clientEntityId || "d301662a-10ce-4e32-84ed-a9423a70101d",
      groupId: DEMO_USERS.client.clientGroupId || "3c5eb209-459d-4af7-9868-36d7ac3d6493",
      groupName: "Direct Practice Clients",
      name: "Apex Laboratories Private Limited",
      type: "PVT_LTD",
      pan: "AABCA9182K",
      gstin: "23AABCA9182K1Z5",
      turnoverCr: 73.4,
      incorporationYear: 2018,
      penaltyRiskAccrued: 0,
      partnerInCharge: "CA Gunjan Jain",
      assignedArticle: "Kriti Jain (Article)",
      primaryContact: {
        name: DEMO_USERS.client.name,
        phone: DEMO_USERS.client.phone,
        email: DEMO_USERS.client.email,
        designation: DEMO_USERS.client.designation,
      },
    });
  }

  const matchedClient = allClients.find((c) => {
    const panMatch = c.pan && c.pan.toUpperCase() === cleanUpper;
    const phoneMatch = c.primaryContact?.phone && normalizePhone10(c.primaryContact.phone) === cleanPhone10;
    const emailMatch = c.primaryContact?.email && c.primaryContact.email.toLowerCase() === cleanLower;
    return panMatch || phoneMatch || emailMatch;
  });

  if (matchedClient) {
    // In sandbox/evaluation: accept Client@2026 or verified secret
    if (cleanPass === "Client@2026" || cleanPass === "Chetan@0715") {
      const clientUser: AuthUser = {
        id: `USR-${matchedClient.id}`,
        name: matchedClient.primaryContact?.name || matchedClient.name,
        email: matchedClient.primaryContact?.email || "director@client-portal.in",
        phone: matchedClient.primaryContact?.phone || "+91 98000 00003",
        role: "CLIENT",
        designation: `${matchedClient.primaryContact?.designation || "Director"} (${matchedClient.name})`,
        firmId: "FRM-022998C",
        firmName: "GPA & Co., Chartered Accountants",
        firmFrn: "022998C",
        clientGroupId: matchedClient.groupId,
        clientEntityId: matchedClient.id,
        token: `tok_client_${matchedClient.id}`,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      return { success: true, user: clientUser };
    }
    return {
      success: false,
      error: "Invalid credentials. Please verify your User ID and password.",
    };
  }

  return {
    success: false,
    error: "Account not found. Please contact GPA & Co. Practice Helpdesk.",
  };
}
