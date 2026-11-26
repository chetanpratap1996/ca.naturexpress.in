import crypto from "crypto";
import { getPostgresPool } from "../server/postgres";
import { AuthUser, UserRole } from "./session";
import { signSessionTokenAsync } from "./serverAuth";
import { DEFAULT_FIRM_BRANDING } from "../config/branding";

export interface LoginRequest {
  portalMode: "client" | "staff";
  identifier: string; // Phone, PAN, or Email
  secret: string; // 4-digit PIN for client, Password for staff
  membershipNo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
  code?: string;
}

// Enterprise Salted Hash with PBKDF2 (10,000 iterations)
export function hashSecret(
  secret: string,
  salt = crypto.randomBytes(16).toString("hex")
): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(secret, salt, 10000, 64, "sha256").toString("hex");
  return { hash, salt };
}

export function verifySecret(inputSecret: string, storedHash: string, salt: string): boolean {
  if (!inputSecret || !storedHash || !salt) return false;
  try {
    const inputHash = crypto.pbkdf2Sync(inputSecret, salt, 10000, 64, "sha256").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(inputHash, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
}

export function normalizePhone10(rawPhone: string): string {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// Rate Limiter for brute-force protection (Max 5 failed attempts per 5 minutes)
interface RateLimitEntry {
  attempts: number;
  blockedUntil: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string): { isBlocked: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry) return { isBlocked: false };

  if (entry.blockedUntil > now) {
    return { isBlocked: true, retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1000) };
  }

  if (entry.blockedUntil !== 0 && entry.blockedUntil <= now) {
    rateLimitMap.delete(key);
  }

  return { isBlocked: false };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { attempts: 0, blockedUntil: 0 };
  entry.attempts += 1;
  if (entry.attempts >= 5) {
    entry.blockedUntil = now + 5 * 60 * 1000;
  }
  rateLimitMap.set(key, entry);
}

export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * Enterprise Client Authentication
 * Authenticates client strictly against PostgreSQL client_entities (Phone/PAN/Email + hashed PIN).
 */
export async function authenticateClientEntity(
  identifier: string,
  pin: string,
  ipAddress = "127.0.0.1",
  userAgent = "Client Portal PWA"
): Promise<LoginResponse> {
  const cleanId = (identifier || "").trim();
  const cleanPin = (pin || "").trim();

  if (!cleanId || !cleanPin) {
    return { success: false, error: "Please provide your Mobile Number / PAN and 4-digit PIN." };
  }

  const cleanPhone10 = normalizePhone10(cleanId);
  const cleanUpper = cleanId.toUpperCase();

  try {
    const pool = getPostgresPool();
    const query = `
      SELECT 
        ce.id as entity_id,
        ce.entity_name,
        ce.type,
        ce.pan,
        ce.gstin,
        ce.auth_pin,
        ce.auth_pin_hash,
        ce.auth_pin_salt,
        ce.is_pin_customized,
        ce.primary_contact_name,
        ce.primary_contact_phone,
        ce.primary_contact_email,
        ce.primary_contact_designation,
        ce.firm_id,
        cg.id as group_id,
        cg.group_name,
        cg.promoter_name,
        cg.promoter_phone,
        cg.promoter_email,
        f.firm_name,
        f.frn as firm_frn
      FROM client_entities ce
      LEFT JOIN client_groups cg ON ce.group_id = cg.id
      LEFT JOIN firms f ON ce.firm_id = f.id
      WHERE 
        ce.pan = $1 OR 
        (length($2) >= 10 AND RIGHT(REGEXP_REPLACE(COALESCE(ce.primary_contact_phone, cg.promoter_phone, ''), '\\D', '', 'g'), 10) = $2) OR
        LOWER(COALESCE(ce.primary_contact_email, cg.promoter_email, '')) = LOWER($3)
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [cleanUpper, cleanPhone10, cleanId]);

    if (rows.length === 0) {
      recordFailedAttempt(`client:${cleanId.toLowerCase()}:${ipAddress}`);
      return {
        success: false,
        error: "Invalid client credentials. Please verify your Mobile/PAN and PIN or contact your CA firm.",
        code: "AUTH_FAILED",
      };
    }

    const row = rows[0];
    const contactPhone = row.primary_contact_phone || row.promoter_phone || "";
    const phone10 = normalizePhone10(contactPhone);

    // Strictly verify PBKDF2 hash; allow uncustomized initial PIN only when hash is not yet set
    let isPinValid = false;
    if (row.auth_pin_hash && row.auth_pin_salt) {
      isPinValid = verifySecret(cleanPin, row.auth_pin_hash, row.auth_pin_salt);
    } else if (row.auth_pin && !row.is_pin_customized) {
      isPinValid = cleanPin === String(row.auth_pin).trim();
    } else if (!row.is_pin_customized && phone10.length >= 4) {
      isPinValid = cleanPin === phone10.slice(-4);
    }

    if (!isPinValid) {
      recordFailedAttempt(`client:${cleanId.toLowerCase()}:${ipAddress}`);
      await pool
        .query(
          "INSERT INTO auth_audit_log (identifier, role, status, ip_address, user_agent, details) VALUES ($1, $2, $3, $4, $5, $6)",
          [cleanId, "CLIENT", "FAILED_INVALID_PIN", ipAddress, userAgent, JSON.stringify({ entity_id: row.entity_id })]
        )
        .catch(() => {});

      return {
        success: false,
        error: "Invalid client credentials. Please verify your Mobile/PAN and PIN or contact your CA firm.",
        code: "INVALID_PIN",
      };
    }

    clearRateLimit(`client:${cleanId.toLowerCase()}:${ipAddress}`);

    const firmName = row.firm_name || DEFAULT_FIRM_BRANDING.firmName;
    const firmFrn = row.firm_frn || DEFAULT_FIRM_BRANDING.frn;
    const contactName = row.primary_contact_name || row.promoter_name || row.entity_name;
    const contactEmail = row.primary_contact_email || row.promoter_email || "";
    const designation = `${row.primary_contact_designation || "Director"} (${row.entity_name})`;

    const mappedToken = await signSessionTokenAsync({
      id: `USR-${row.entity_id}`,
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      role: "CLIENT",
      designation,
      firmId: row.firm_id,
      firmName,
      firmFrn,
      clientGroupId: row.group_id,
      clientEntityId: row.entity_id,
    });

    const user: AuthUser = {
      id: `USR-${row.entity_id}`,
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      role: "CLIENT",
      designation,
      firmId: row.firm_id,
      firmName,
      firmFrn,
      clientGroupId: row.group_id,
      clientEntityId: row.entity_id,
      token: mappedToken,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };

    await pool
      .query(
        "INSERT INTO auth_audit_log (identifier, role, status, ip_address, user_agent, details) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          cleanId,
          "CLIENT",
          "SUCCESS",
          ipAddress,
          userAgent,
          JSON.stringify({ entity_id: row.entity_id, entity_name: row.entity_name }),
        ]
      )
      .catch(() => {});

    return { success: true, user };
  } catch (err: any) {
    console.error("PostgreSQL client authentication error:", err?.message || err);
    return {
      success: false,
      error: "Authentication service unavailable. Please try again later.",
      code: "AUTH_SERVICE_UNAVAILABLE",
    };
  }
}

/**
 * Enterprise CA Practice Staff Authentication
 * Authenticates staff strictly against PostgreSQL public.users (PBKDF2 password verification).
 */
export async function authenticateStaffUser(
  identifier: string,
  password: string,
  membershipNo?: string,
  ipAddress = "127.0.0.1",
  userAgent = "Practice Desk"
): Promise<LoginResponse> {
  const cleanId = (identifier || "").trim();
  const cleanPass = (password || "").trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: "Please enter your Official Email and Password." };
  }

  const cleanLower = cleanId.toLowerCase();
  const cleanPhone10 = normalizePhone10(cleanId);

  try {
    const pool = getPostgresPool();
    const query = `
      SELECT 
        u.id,
        u.email,
        u.phone,
        u.full_name,
        u.role,
        u.membership_number,
        u.articleship_reg_no,
        u.password_hash,
        u.password_salt,
        u.temp_password,
        u.is_active,
        u.firm_id,
        f.firm_name,
        f.frn as firm_frn
      FROM users u
      LEFT JOIN firms f ON u.firm_id = f.id
      WHERE 
        u.role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE') AND (
          LOWER(u.email) = $1 OR 
          (length($2) >= 10 AND RIGHT(REGEXP_REPLACE(COALESCE(u.phone, ''), '\\D', '', 'g'), 10) = $2)
        )
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [cleanLower, cleanPhone10]);

    if (rows.length === 0) {
      recordFailedAttempt(`staff:${cleanLower}:${ipAddress}`);
      return {
        success: false,
        error: "Invalid staff credentials. Please check your email and password.",
        code: "AUTH_FAILED",
      };
    }

    const row = rows[0];

    if (!row.is_active) {
      return { success: false, error: "This staff account has been deactivated.", code: "ACCOUNT_INACTIVE" };
    }

    let isPasswordValid = false;
    if (row.password_hash && row.password_salt) {
      isPasswordValid = verifySecret(cleanPass, row.password_hash, row.password_salt);
    } else if (row.temp_password) {
      // Only permit temp_password if permanent PBKDF2 password_hash has not been configured yet
      isPasswordValid = cleanPass === row.temp_password;
    }

    if (!isPasswordValid) {
      recordFailedAttempt(`staff:${cleanLower}:${ipAddress}`);
      await pool
        .query(
          "INSERT INTO auth_audit_log (identifier, role, status, ip_address, user_agent, details) VALUES ($1, $2, $3, $4, $5, $6)",
          [cleanId, row.role, "FAILED_INVALID_PASSWORD", ipAddress, userAgent, JSON.stringify({ user_id: row.id })]
        )
        .catch(() => {});

      return { success: false, error: "Invalid staff credentials. Please check your email and password.", code: "INVALID_PASSWORD" };
    }

    clearRateLimit(`staff:${cleanLower}:${ipAddress}`);

    const mappedRole: UserRole =
      row.role === "PARTNER" || row.role === "SUPER_ADMIN" ? "PARTNER" : "ARTICLE";
    const designation =
      mappedRole === "PARTNER"
        ? "Managing Partner (FCA)"
        : row.role === "PAID_CA_MANAGER"
        ? "Senior Paid CA"
        : "Article Assistant";
    const firmName = row.firm_name || DEFAULT_FIRM_BRANDING.firmName;
    const firmFrn = row.firm_frn || DEFAULT_FIRM_BRANDING.frn;

    let allowedTools: string[] | undefined;
    try {
      const profRes = await pool.query(
        `SELECT payload->>'allowedTools' as tools_json, payload->'allowedTools' as tools
         FROM public.firm_workspace_records
         WHERE firm_id = $1 AND record_type = 'STAFF_PROFILE' AND payload->>'id' = $2
         LIMIT 1`,
        [row.firm_id, row.id]
      );
      if (Array.isArray(profRes.rows[0]?.tools)) {
        allowedTools = profRes.rows[0].tools;
      }
    } catch {}

    const staffToken = await signSessionTokenAsync(
      {
        id: row.id,
        name: row.full_name,
        email: row.email,
        phone: row.phone,
        role: mappedRole,
        designation,
        firmId: row.firm_id,
        firmName,
        firmFrn,
      },
      86400
    );

    const user: AuthUser = {
      id: row.id,
      name: row.full_name,
      email: row.email,
      phone: row.phone,
      role: mappedRole,
      designation,
      firmId: row.firm_id,
      firmName,
      firmFrn,
      membershipNo: row.membership_number,
      articleshipRegNo: row.articleship_reg_no,
      token: staffToken,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      allowedTools:
        allowedTools ||
        (mappedRole === "PARTNER"
          ? ["tasks", "gst", "tax-audit", "notices-udin", "billing-wip", "client-master"]
          : ["tasks", "gst"]),
    };

    await pool
      .query(
        "INSERT INTO auth_audit_log (identifier, role, status, ip_address, user_agent, details) VALUES ($1, $2, $3, $4, $5, $6)",
        [cleanId, mappedRole, "SUCCESS", ipAddress, userAgent, JSON.stringify({ user_id: row.id, name: row.full_name })]
      )
      .catch(() => {});

    return { success: true, user };
  } catch (err: any) {
    console.error("PostgreSQL staff authentication error:", err?.message || err);
    return {
      success: false,
      error: "Authentication service unavailable. Please try again later.",
      code: "AUTH_SERVICE_UNAVAILABLE",
    };
  }
}

/**
 * Update Client 4-Digit PIN in PostgreSQL (hashed with PBKDF2, plaintext cleared).
 */
export async function updateClientPin(
  entityId: string,
  firmId: string,
  currentPin: string,
  newPin: string,
  skipCurrentCheck = false
): Promise<{ success: boolean; error?: string }> {
  const cleanNewPin = (newPin || "").trim();
  if (!cleanNewPin || !/^\d{4,6}$/.test(cleanNewPin)) {
    return { success: false, error: "PIN must be 4 to 6 numeric digits." };
  }

  try {
    const pool = getPostgresPool();
    const { rows } = await pool.query(
      "SELECT id, auth_pin, auth_pin_hash, auth_pin_salt, is_pin_customized, primary_contact_phone FROM client_entities WHERE id::text = $1 AND firm_id::text = $2 LIMIT 1",
      [entityId, firmId]
    );

    if (rows.length === 0) {
      return { success: false, error: "Client entity not found within your firm." };
    }

    const row = rows[0];
    if (!skipCurrentCheck) {
      const phone10 = normalizePhone10(row.primary_contact_phone || "");
      let isCurrentValid = false;
      if (row.auth_pin_hash && row.auth_pin_salt) {
        isCurrentValid = verifySecret(currentPin, row.auth_pin_hash, row.auth_pin_salt);
      } else if (row.auth_pin && !row.is_pin_customized) {
        isCurrentValid = currentPin === String(row.auth_pin).trim();
      } else if (!row.is_pin_customized && phone10.length >= 4) {
        isCurrentValid = currentPin === phone10.slice(-4);
      }

      if (!isCurrentValid) {
        return { success: false, error: "Current PIN is incorrect." };
      }
    }

    const { hash, salt } = hashSecret(cleanNewPin);
    await pool.query(
      `UPDATE client_entities 
       SET auth_pin = NULL, auth_pin_hash = $1, auth_pin_salt = $2, is_pin_customized = TRUE 
       WHERE id::text = $3 AND firm_id::text = $4`,
      [hash, salt, entityId, firmId]
    );

    return { success: true };
  } catch (err: any) {
    console.error("updateClientPin error:", err?.message || err);
    return { success: false, error: "Failed to update PIN in database." };
  }
}
