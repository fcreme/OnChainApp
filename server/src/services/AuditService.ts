import { db } from '../config/database.js'
import type { AuditLogRow, AuditQuery } from '../models/AuditLog.js'
import { PAGINATION } from '../config/constants.js'

export class AuditService {
  async log(
    action: string,
    entityType: string,
    entityId: number | null,
    actor: string,
    previousState?: Record<string, unknown> | null,
    newState?: Record<string, unknown> | null,
    metadata?: Record<string, unknown> | null,
  ): Promise<AuditLogRow> {
    return db.one(
      `INSERT INTO audit_log (action, entity_type, entity_id, actor, previous_state, new_state, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        action,
        entityType,
        entityId,
        actor,
        previousState ? JSON.stringify(previousState) : null,
        newState ? JSON.stringify(newState) : null,
        metadata ? JSON.stringify(metadata) : null,
      ],
    )
  }

  async query(
    filters: AuditQuery,
  ): Promise<{ logs: AuditLogRow[]; total: number }> {
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (filters.action) {
      conditions.push(`action = $${idx++}`)
      params.push(filters.action)
    }
    if (filters.entity_type) {
      conditions.push(`entity_type = $${idx++}`)
      params.push(filters.entity_type)
    }
    if (filters.entity_id) {
      conditions.push(`entity_id = $${idx++}`)
      params.push(filters.entity_id)
    }
    if (filters.actor) {
      conditions.push(`actor = $${idx++}`)
      params.push(filters.actor)
    }
    if (filters.from_date) {
      conditions.push(`timestamp >= to_timestamp($${idx++} / 1000.0)`)
      params.push(filters.from_date)
    }
    if (filters.to_date) {
      conditions.push(`timestamp <= to_timestamp($${idx++} / 1000.0)`)
      params.push(filters.to_date)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = Math.min(filters.limit ?? PAGINATION.defaultLimit, PAGINATION.maxLimit)
    const offset = ((filters.page ?? 1) - 1) * limit

    const [logs, countResult] = await Promise.all([
      db.manyOrNone<AuditLogRow>(
        `SELECT * FROM audit_log ${where} ORDER BY timestamp DESC LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset],
      ),
      db.one<{ count: string }>(
        `SELECT COUNT(*) as count FROM audit_log ${where}`,
        params,
      ),
    ])

    return { logs, total: Number(countResult.count) }
  }
}

export const auditService = new AuditService()
