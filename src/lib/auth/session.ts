/**
 * TaxoBrain Enterprise Authentication & Session Manager
 * Provides Multi-Tenant Role-Based Access Control (RBAC)
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
  defaultPassword?: string; // Zero-DLT Deterministic Password: [FirstName]@[Last4Phone]
  membershipNo?: string; // ICAI 6-digit Membership No for Partners
  articleshipRegNo?: string; // ICAI Student WRO/CRO Reg No for Articles
  clientGroupId?: string; // For Client users: locks access to their promoter group
  clientEntityId?: string; // Primary entity
  token: string;
  expiresAt: string;
}

/**
 * Clean phone number to 10-digit Indian standard
 * Example: "+91 80771 70715" -> "8077170715", "08077170715" -> "8077170715"
 */
export function normalizePhone10(rawPhone: string): string {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
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

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  expectedHint?: string;
}

/**
 * Universal Authentication Resolver
 * Authenticates either CA Partner, Article Assistant, or any onboarded Client Entity.
 * Accepts:
 * - Phone number (any format: with or without +91)
 * - PAN (uppercase/lowercase)
 * - Email address
 */
export function authenticateUser(
  identifier: string,
  rawPassword: string,
  clientRegistry: ClientEntity[] = []
): AuthResult {
  const cleanId = (identifier || "").trim();
  const cleanPass = (rawPassword || "").trim();

  if (!cleanId || !cleanPass) {
    return {
      success: false,
      error: "Please enter your User ID (Mobile/PAN/Email) and Security Password.",
    };
  }

  const cleanPhone10 = normalizePhone10(cleanId);
  const cleanUpper = cleanId.toUpperCase();
  const cleanLower = cleanId.toLowerCase();

  // 1. Check Staff: Managing Partner (CA Gunjan Jain)
  const partnerUser = DEMO_USERS.partner;
  const partnerPhone10 = normalizePhone10(partnerUser.phone);
  if (
    cleanLower === partnerUser.email.toLowerCase() ||
    (cleanPhone10 && cleanPhone10 === partnerPhone10) ||
    cleanUpper === "PARTNER"
  ) {
    const expectedPass = partnerUser.defaultPassword || "Gunjan@3639";
    if (cleanPass.toLowerCase() === expectedPass.toLowerCase()) {
      return { success: true, user: partnerUser };
    }
    return {
      success: false,
      error: `Invalid Partner password. Expected format is [FirstName]@[Last4Digits] (e.g. ${expectedPass}).`,
      expectedHint: expectedPass,
    };
  }

  // 2. Check Staff: Article Assistant (Kriti Jain)
  const articleUser = DEMO_USERS.article;
  const articlePhone10 = normalizePhone10(articleUser.phone);
  if (
    cleanLower === articleUser.email.toLowerCase() ||
    (cleanPhone10 && cleanPhone10 === articlePhone10) ||
    cleanUpper === "ARTICLE" ||
    cleanUpper === (articleUser.articleshipRegNo || "").toUpperCase()
  ) {
    const expectedPass = articleUser.defaultPassword || "Kriti@5897";
    if (cleanPass.toLowerCase() === expectedPass.toLowerCase()) {
      return { success: true, user: articleUser };
    }
    return {
      success: false,
      error: `Invalid Article password. Expected format is [FirstName]@[Last4Digits] (e.g. ${expectedPass}).`,
      expectedHint: expectedPass,
    };
  }

  // 3. Check All Client Entities (including dynamic CSV imports & fallback)
  // Ensure we include DEMO_USERS.client if registry is empty
  const allClients = [...clientRegistry];
  const hasDemoInRegistry = allClients.some(
    (c) => c.pan === "AANCP9915B" || normalizePhone10(c.primaryContact?.phone || "") === "8077170715"
  );
  if (!hasDemoInRegistry && DEMO_USERS.client) {
    allClients.push({
      id: DEMO_USERS.client.clientEntityId || "d301662a-10ce-4e32-84ed-a9423a70101d",
      groupId: DEMO_USERS.client.clientGroupId || "3c5eb209-459d-4af7-9868-36d7ac3d6493",
      groupName: "Direct Practice Clients",
      name: "Pratwi Solutions Private Limited",
      type: "PVT_LTD",
      pan: "AANCP9915B",
      gstin: "09AANCP9915B1Z4",
      turnoverCr: 10,
      incorporationYear: 2024,
      penaltyRiskAccrued: 0,
      partnerInCharge: "CA Gunjan Jain",
      assignedArticle: "Kriti Jain (Article)",
      primaryContact: {
        name: DEMO_USERS.client.name,
        phone: DEMO_USERS.client.phone,
        email: DEMO_USERS.client.email,
        designation: "Director",
      },
    });
  }

  // Match against client records
  const matchedClient = allClients.find((client) => {
    const cPhone10 = normalizePhone10(client.primaryContact?.phone || "");
    const cPan = (client.pan || "").toUpperCase();
    const cGstin = (client.gstin || "").toUpperCase();
    const cEmail = (client.primaryContact?.email || "").toLowerCase();

    return (
      (cleanPhone10 && cleanPhone10.length >= 10 && cleanPhone10 === cPhone10) ||
      cleanUpper === cPan ||
      cleanUpper === cGstin ||
      cleanLower === cEmail
    );
  });

  if (matchedClient) {
    const contactName = matchedClient.primaryContact?.name || matchedClient.name;
    const contactPhone = matchedClient.primaryContact?.phone || "";
    const generatedPass = generateDeterministicPassword(contactName, contactPhone);
    const companyPass = generateDeterministicPassword(matchedClient.name, contactPhone);
    const defaultCustomPass = (matchedClient as any).defaultPassword;

    const isValid =
      cleanPass.toLowerCase() === generatedPass.toLowerCase() ||
      cleanPass.toLowerCase() === companyPass.toLowerCase() ||
      (defaultCustomPass && cleanPass.toLowerCase() === defaultCustomPass.toLowerCase()) ||
      // Also match if client entered DEMO_USERS.client.defaultPassword
      (cleanPhone10 === "8077170715" && cleanPass === "Chetan@0715");

    if (isValid) {
      const clientUser: AuthUser = {
        id: `USR-${matchedClient.id}`,
        name: contactName,
        email: matchedClient.primaryContact?.email || "director@client.com",
        phone: contactPhone || cleanId,
        role: "CLIENT",
        designation: `${matchedClient.primaryContact?.designation || "Director / Authorized Signatory"} (${matchedClient.name})`,
        firmId: "FRM-022998C",
        firmName: "GPA & Co., Chartered Accountants",
        firmFrn: "022998C",
        defaultPassword: generatedPass,
        clientGroupId: matchedClient.groupId,
        clientEntityId: matchedClient.id,
        token: `tok_client_${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      return { success: true, user: clientUser };
    }

    return {
      success: false,
      error: `Invalid Password for ${matchedClient.name}. Password format is [FirstName or Company]@[Last 4 digits of phone] (e.g. ${generatedPass}).`,
      expectedHint: generatedPass,
    };
  }

  // Fallback check: Did user type a phone that is not in registry, but used valid Zero-DLT format?
  if (cleanPhone10.length === 10) {
    // If phone is valid 10 digits, inform user cleanly
    return {
      success: false,
      error: `Mobile number ${cleanPhone10} is not yet registered in GPA & Co. client master. Please contact your CA firm administrator or check your number.`,
    };
  }

  return {
    success: false,
    error: "Account not found. Please check your Mobile Number, PAN, or Email. If you are newly onboarded, ask your CA firm administrator to confirm your registration.",
  };
}
