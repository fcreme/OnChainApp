import { z } from 'zod'

// ---------- DB Row ----------
export interface AuditLogRow {
  id: number
  timestamp: string
  action: string
  entity_type: string
  entity_id: number | null
  actor: string
  previous_state: Record<string, unknown> | null
  new_state: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

// ---------- API Response ----------
export interface AuditLogResponse {
  id: number
  timestamp: string
  action: string
  entity_type: string
  entity_id: number | null
  actor: string
  previous_state: Record<string, unknown> | null
  new_state: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

// ---------- Query Schema ----------
export const AuditQuerySchema = z.object({
  action: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.coerce.number().int().optional(),
  actor: z.string().optional(),
  from_date: z.coerce.number().optional(),
  to_date: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})
export type AuditQuery = z.infer<typeof AuditQuerySchema>
