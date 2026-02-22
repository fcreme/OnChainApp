import { api } from './client'
import type { Pagination } from './transactions'

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

export async function fetchAuditLogs(params?: {
  action?: string
  entity_type?: string
  entity_id?: number
  actor?: string
  from_date?: number
  to_date?: number
  page?: number
  limit?: number
}) {
  return api.get<{ logs: AuditLogResponse[]; pagination: Pagination }>(
    '/audit',
    params as Record<string, string | number | undefined>,
  )
}
