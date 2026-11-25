import { getPostgresPool } from "./postgres";
import { ServerAuthContext } from "@/lib/auth/serverAuth";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves the authoritative UUID firm_id in PostgreSQL for the authenticated caller.
 */
export async function resolveFirmUuid(auth: ServerAuthContext): Promise<string> {
  const pool = getPostgresPool();
  if (auth.firmId && UUID_REGEX.test(auth.firmId)) {
    const check = await pool.query("SELECT id FROM public.firms WHERE id = $1 LIMIT 1", [auth.firmId]);
    if (check.rows[0]?.id) return check.rows[0].id;
  }
  const frn = auth.user?.firmFrn || DEFAULT_FIRM_BRANDING.frn;
  const byFrn = await pool.query("SELECT id FROM public.firms WHERE frn = $1 LIMIT 1", [frn]);
  if (byFrn.rows[0]?.id) return byFrn.rows[0].id;

  const fallback = await pool.query("SELECT id FROM public.firms ORDER BY created_at ASC LIMIT 1");
  if (!fallback.rows[0]?.id) {
    throw new Error("No firm record found in PostgreSQL.");
  }
  return fallback.rows[0].id;
}

/**
 * Appends an immutable audit log entry directly to PostgreSQL public.audit_logs
 * using server-derived actor identity.
 */
export async function appendPgAuditLog(params: {
  firmId: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  entityId?: string | null;
  entityName: string;
  action: string;
  details: string;
  category: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    const pool = getPostgresPool();
    const actorUuid = params.actorId && UUID_REGEX.test(params.actorId) ? params.actorId : null;
    const entityUuid = params.entityId && UUID_REGEX.test(params.entityId) ? params.entityId : null;
    await pool.query(
      `INSERT INTO public.audit_logs (
        firm_id, actor_id, actor_name, actor_role, entity_id, entity_name, action, details, category, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        params.firmId,
        actorUuid,
        params.actorName.slice(0, 255),
        params.actorRole.slice(0, 50),
        entityUuid,
        params.entityName.slice(0, 255),
        params.action.slice(0, 100),
        params.details.slice(0, 4000),
        params.category.slice(0, 50),
        params.ipAddress || null,
      ]
    );
  } catch (err: any) {
    console.error("Failed to append Postgres audit log:", err?.message || err);
  }
}

export async function listWorkspaceRecords<T = any>(
  firmId: string,
  recordType: string,
  entityId?: string | null
): Promise<Array<{ id: string; entity_id: string | null; payload: T; created_at: string; updated_at: string }>> {
  const pool = getPostgresPool();
  if (entityId && UUID_REGEX.test(entityId)) {
    const { rows } = await pool.query(
      `SELECT id, entity_id, payload, created_at, updated_at
       FROM public.firm_workspace_records
       WHERE firm_id = $1 AND record_type = $2 AND entity_id = $3
       ORDER BY updated_at DESC`,
      [firmId, recordType, entityId]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT id, entity_id, payload, created_at, updated_at
     FROM public.firm_workspace_records
     WHERE firm_id = $1 AND record_type = $2
     ORDER BY updated_at DESC`,
    [firmId, recordType]
  );
  return rows;
}

export async function upsertWorkspaceRecord<T = any>(params: {
  firmId: string;
  entityId?: string | null;
  recordType: string;
  matchKey?: string;
  matchValue?: string;
  payload: T;
}): Promise<string> {
  const pool = getPostgresPool();
  const entityUuid = params.entityId && UUID_REGEX.test(params.entityId) ? params.entityId : null;

  if (params.matchKey && params.matchValue) {
    const existing = await pool.query(
      `SELECT id FROM public.firm_workspace_records
       WHERE firm_id = $1 AND record_type = $2 AND payload->>$3 = $4
       LIMIT 1`,
      [params.firmId, params.recordType, params.matchKey, params.matchValue]
    );
    if (existing.rows[0]?.id) {
      await pool.query(
        `UPDATE public.firm_workspace_records
         SET payload = $1::jsonb, entity_id = COALESCE($2, entity_id), updated_at = now()
         WHERE id = $3`,
        [JSON.stringify(params.payload), entityUuid, existing.rows[0].id]
      );
      return existing.rows[0].id;
    }
  }

  const inserted = await pool.query(
    `INSERT INTO public.firm_workspace_records (firm_id, entity_id, record_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id`,
    [params.firmId, entityUuid, params.recordType, JSON.stringify(params.payload)]
  );
  return inserted.rows[0].id;
}
