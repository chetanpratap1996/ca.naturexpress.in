/**
 * Brains & Taxes Enterprise Authentication & Session Manager
 * Multi-Tenant Role-Based Access Control (RBAC) with HttpOnly server-verified sessions
 */

import { ClientEntity } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

export type UserRole = "PARTNER" | "TEAM" | "ARTICLE" | "CLIENT";

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
  token: string;
  expiresAt: string;
  allowedTools?: string[];
}

export function normalizePhone10(rawPhone: string): string {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function generateDeterministicPassword(nameOrCompany: string, phone: string): string {
  const firstWord = (nameOrCompany.split(" ")[0] || "User").replace(/[^a-zA-Z0-9]/g, "");
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.length >= 4 ? digits.slice(-4) : "2026";
  return `${firstWord}@${last4}`;
}

// Placeholder structure kept for type/UI compatibility only — never accepted for authentication
export const DEMO_USERS: Record<string, AuthUser> = {
  partner: {
    id: "",
    name: DEFAULT_FIRM_BRANDING.managingPartner,
    email: DEFAULT_FIRM_BRANDING.email,
    phone: DEFAULT_FIRM_BRANDING.partnerPhone,
    role: "PARTNER",
    designation: "Managing Partner (FCA)",
    firmId: "",
    firmName: DEFAULT_FIRM_BRANDING.firmName,
    firmFrn: DEFAULT_FIRM_BRANDING.frn,
    token: "",
    expiresAt: "",
    allowedTools: ["tasks", "gst", "tax-audit", "notices-udin", "billing-wip", "client-master"],
  },
  team: {
    id: "",
    name: "Practice Team Member",
    email: "audit.trainee@brainsandtaxes.com",
    phone: DEFAULT_FIRM_BRANDING.supportPhone,
    role: "TEAM",
    designation: "Team Associate",
    firmId: "",
    firmName: DEFAULT_FIRM_BRANDING.firmName,
    firmFrn: DEFAULT_FIRM_BRANDING.frn,
    token: "",
    expiresAt: "",
    allowedTools: ["tasks", "gst"],
  },
  article: {
    id: "",
    name: "Practice Team Member",
    email: "audit.trainee@brainsandtaxes.com",
    phone: DEFAULT_FIRM_BRANDING.supportPhone,
    role: "ARTICLE",
    designation: "Article Assistant",
    firmId: "",
    firmName: DEFAULT_FIRM_BRANDING.firmName,
    firmFrn: DEFAULT_FIRM_BRANDING.frn,
    token: "",
    expiresAt: "",
    allowedTools: ["tasks", "gst"],
  },
};

const TEAM_PERMISSIONS_STORAGE_KEY = "bt_team_tool_permissions_v1";

export function getTeamMemberTools(userId: string): string[] {
  if (typeof window === "undefined") return ["tasks", "gst"];
  try {
    const raw = localStorage.getItem(TEAM_PERMISSIONS_STORAGE_KEY);
    if (!raw) return ["tasks", "gst"];
    const map = JSON.parse(raw);
    const key = userId.replace(/^(USR-|STF-)/, "");
    return map[userId] || map[`USR-${key}`] || map[`STF-${key}`] || ["tasks", "gst"];
  } catch {
    return ["tasks", "gst"];
  }
}

export function setTeamMemberTools(userId: string, tools: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(TEAM_PERMISSIONS_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const key = userId.replace(/^(USR-|STF-)/, "");
    map[userId] = tools;
    map[`USR-${key}`] = tools;
    map[`STF-${key}`] = tools;
    localStorage.setItem(TEAM_PERMISSIONS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // fallback
  }
}

const STORAGE_KEY = "bt_enterprise_session_v4";

export function getActiveSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (!user || !user.id || !user.role) return null;
    if (user.expiresAt && new Date(user.expiresAt).getTime() < Date.now()) {
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
  // Store display profile only; authoritative session credential lives in HttpOnly cookie
  const safeCache: AuthUser = { ...user, token: "" };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeCache));
  window.dispatchEvent(new Event("taxobrain_auth_state_change"));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
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
  return user?.role === "PARTNER" || user?.role === "ARTICLE" || user?.role === "TEAM";
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
 * Client-side credential fallback removed for production security.
 * All authentication must succeed against /api/auth/login.
 */
export function authenticateUser(
  _identifier: string,
  _rawPassword: string,
  _clientRegistry: ClientEntity[] = []
): AuthResult {
  return {
    success: false,
    error: "Server authentication is required. Please verify your internet connection and try again.",
  };
}
