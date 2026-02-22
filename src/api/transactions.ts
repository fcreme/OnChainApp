import { api } from './client'

export interface TransactionResponse {
  id: number
  tx_hash: string
  source: 'onchain' | 'local' | 'csv' | 'manual'
  status: 'anchor' | 'pending' | 'suggested_match' | 'reconciled' | 'force_reconciled' | 'rejected' | 'unreconciled'
  type: 'Transfer' | 'Approval' | 'Mint'
  token_symbol: string
  token_address: string | null
  amount_gross: string
  amount_net: string | null
  gas_used: string | null
  sender_address: string | null
  receiver_address: string | null
  timestamp: number
  block_number: number | null
  matched_tx_id: number | null
  match_score: number | null
  score_breakdown: { amount: number; address: number; time: number; token: number } | null
  reconciled_at: string | null
  reconciled_by: string | null
  force_reconciled: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface TransactionStats {
  total_anchors: number
  total_claims: number
  pending_claims: number
  reconciled: number
  suggestions: number
  match_rate: number
}

export interface CreateClaim {
  tx_hash: string
  source?: 'local' | 'csv' | 'manual'
  type: 'Transfer' | 'Approval' | 'Mint'
  token_symbol: string
  token_address?: string
  amount_gross: string
  amount_net?: string
  sender_address?: string
  receiver_address?: string
  timestamp: number
  notes?: string
}

// ── API Functions ──

export async function fetchTransactions(params?: {
  source?: string
  status?: string
  token?: string
  from_date?: number
  to_date?: number
  page?: number
  limit?: number
}) {
  return api.get<{ transactions: TransactionResponse[]; pagination: Pagination }>(
    '/transactions',
    params as Record<string, string | number | undefined>,
  )
}

export async function fetchTransactionById(id: number) {
  return api.get<TransactionResponse>(`/transactions/${id}`)
}

export async function fetchTransactionStats() {
  return api.get<TransactionStats>('/transactions/stats')
}

export async function importClaims(claims: CreateClaim[]) {
  return api.post<{
    imported: number
    failed: number
    transactions: TransactionResponse[]
    errors: Array<{ index: number; error: string }>
  }>('/transactions/claims', { claims })
}

export async function syncAnchors(wallet: string) {
  return api.post<{ anchors_synced: number }>('/transactions/sync-anchors', { wallet })
}
