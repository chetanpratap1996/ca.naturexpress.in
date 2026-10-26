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
  defaultPassword?: string; // Zero-DLT Deterministic Password: [FirstName]@[Last4Phone]
  membershipNo?: string; // ICAI 6-digit Membership No for Partners
  articleshipRegNo?: string; // ICAI Student WRO/CRO Reg No for Articles
  clientGroupId?: string; // For Client users: locks access to their promoter group
  clientEntityId?: string; // Primary entity
  token: string;
  expiresAt: string;
}

/**
 * Deterministic Zero-DLT Password Generator
 * Format: [FirstName / Company]@[Last 4 digits of phone]
 * Example: Contact Person, +91 98000 01234 -> Contact@1234
 */
export function generateDeterministicPassword(nameOrCompany: string, phone: string): string {
  const firstWord = (nameOrCompany.split(" ")[0] || "User").replace(/[^a-zA-Z0-9]/g, "");
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.length >= 4 ? digits.slice(-4) : "2026";
  return `${firstWord}@${last4}`;
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
    defaultPassword: "Gunjan@3639",
    membershipNo: "Confirming M.No",
    token: "tok_partner_secure_session_2026",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
  article: {
    id: "USR-ARTICLE-01",
    name: "Kriti Jain",
    email: "kriti@brainsandtaxes.com",
    phone: "+91 79999 95897",
    role: "ARTICLE",
    designation: "Assigned Article Assistant",
    firmId: "FRM-022998C",
    firmName: "GPA & Co., Chartered Accountants",
    firmFrn: "022998C",
    defaultPassword: "Kriti@5897",
    articleshipRegNo: "CRO022998",
    token: "tok_article_secure_session_2026",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
  client: {
    id: "USR-CLIENT-01",
    name: "Chetan Pratap Singh",
    email: "chetanpratap1996@gmail.com",
    phone: "+91 80771 70715",
    role: "CLIENT",
    designation: "Director (Pratwi Solutions Private Limited)",
    firmId: "FRM-022998C",
    firmName: "GPA & Co., Chartered Accountants",
    firmFrn: "022998C",
    defaultPassword: "Chetan@0715",
    clientGroupId: "3c5eb209-459d-4af7-9868-36d7ac3d6493",
    clientEntityId: "d301662a-10ce-4e32-84ed-a9423a70101d",
    token: "tok_client_secure_session_2026",
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
