/**
 * TaxoBrain Enterprise Authentication & Session Manager
 * Provides Multi-Tenant Role-Based Access Control (RBAC)
 */

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
  membershipNo?: string; // ICAI 6-digit Membership No for Partners
  articleshipRegNo?: string; // ICAI Student WRO/CRO Reg No for Articles
  clientGroupId?: string; // For Client users: locks access to their promoter group
  clientEntityId?: string; // Primary entity
  token: string;
  expiresAt: string;
}

// Enterprise Pre-Configured Verified Personas
export const DEMO_USERS: Record<string, AuthUser> = {
  partner: {
    id: "USR-PARTNER-01",
    name: "CA Gunjan Jain",
    email: "brainsandtaxes@gmail.com",
    phone: "+91 98937 23639",
    role: "PARTNER",
    designation: "Managing Partner (FCA)",
    firmId: "FRM-022998C",
    firmName: "GPA & Co., Chartered Accountants",
    firmFrn: "022998C",
    membershipNo: "Confirming M.No",
    token: "tok_partner_secure_session_2026",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
  article: {
    id: "USR-ARTICLE-01",
    name: "Rohan Verma",
    email: "desk@brainsandtaxes.com",
    phone: "+91 79999 95897",
    role: "ARTICLE",
    designation: "Audit & Tax Assistant",
    firmId: "FRM-022998C",
    firmName: "GPA & Co., Chartered Accountants",
    firmFrn: "022998C",
    articleshipRegNo: "CRO022998",
    token: "tok_article_secure_session_2026",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
  client: {
    id: "USR-CLIENT-01",
    name: "Suresh Kulkarni",
    email: "cfo@apexprecision.com",
    phone: "+91 98230 11928",
    role: "CLIENT",
    designation: "Chief Financial Officer (Apex Precision)",
    firmId: "FRM-022998C",
    firmName: "GPA & Co., Chartered Accountants",
    firmFrn: "022998C",
    clientGroupId: "GRP-001",
    clientEntityId: "CLI-001",
    token: "tok_client_magiclink_session_2026",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
};

const STORAGE_KEY = "bt_enterprise_session_v3";

export function getActiveSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    // Purge legacy corrupted key if present
    localStorage.removeItem("taxobrain_enterprise_session");

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (user?.expiresAt && new Date(user.expiresAt) < new Date()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function setActiveSession(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  // Dispatch custom event for reactive top-bar sync
  window.dispatchEvent(new Event("taxobrain_auth_state_change"));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
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
