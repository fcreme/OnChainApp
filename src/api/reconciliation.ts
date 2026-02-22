import { api } from './client'
import type { TransactionResponse, Pagination } from './transactions'

export interface ScoreBreakdown {
  amount: number
  address: number
  time: number
  token: number
}

export interface SuggestionResponse {
  id: number
  anchor_id: number
  claim_id: number
  anchor: TransactionResponse
  claim: TransactionResponse
  score: number
  score_breakdown: ScoreBreakdown
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
}

export interface MatchingConfig {
  weights: { amount: number; address: number; time: number; token: number }
  tolerances: { amount_percent: number; time_window_ms: number; block_window: number }
  drift_thresholds: { alert_percent: number; critical_percent: number }
}

// ── API Functions ──

export async function fetchSuggestions(params?: {
  min_score?: number
  token?: string
  status?: string
  page?: number
  limit?: number
}) {
  return api.get<{ suggestions: SuggestionResponse[]; pagination: Pagination }>(
    '/reconciliation/suggestions',
    params as Record<string, string | number | undefined>,
  )
}

export async function runMatching(params?: { token?: string; min_score?: number }) {
  return api.post<{ new_suggestions: number; time_ms: number }>(
    '/reconciliation/run-matching',
    params ?? {},
  )
}

export async function approveMatch(anchorId: number, claimId: number, actor: string, force = false) {
  return api.post<{ anchor: TransactionResponse; claim: TransactionResponse }>(
    '/reconciliation/reconcile',
    { anchor_id: anchorId, claim_id: claimId, actor, force },
  )
}

export async function rejectMatch(anchorId: number, claimId: number, actor: string, reason?: string) {
  return api.post<{ rejected: boolean }>(
    '/reconciliation/reject',
    { anchor_id: anchorId, claim_id: claimId, actor, reason },
  )
}

export async function batchReconcile(
  pairs: Array<{ anchor_id: number; claim_id: number }>,
  actor: string,
) {
  return api.post<{
    approved: number
    failed: Array<{ anchor_id: number; claim_id: number; error: string }>
  }>('/reconciliation/batch-reconcile', { pairs, actor })
}

export async function fetchMatchingConfig() {
  return api.get<MatchingConfig>('/config/matching')
}

export async function updateMatchingConfig(
  config: Partial<MatchingConfig> & { actor: string },
) {
  return api.put<MatchingConfig>('/config/matching', config)
}
