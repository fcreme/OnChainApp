import { z } from 'zod'

// ---------- Enums ----------
export const TransactionSource = z.enum(['onchain', 'local', 'csv', 'manual'])
export type TransactionSource = z.infer<typeof TransactionSource>

export const TransactionStatus = z.enum([
  'anchor',
  'pending',
  'suggested_match',
  'reconciled',
  'force_reconciled',
  'rejected',
  'unreconciled',
])
export type TransactionStatus = z.infer<typeof TransactionStatus>

export const TransactionType = z.enum(['Transfer', 'Approval', 'Mint'])
export type TransactionType = z.infer<typeof TransactionType>

// ---------- DB Row ----------
export interface TransactionRow {
  id: number
  tx_hash: string
  source: TransactionSource
  status: TransactionStatus
  type: TransactionType
  token_symbol: string
  token_address: string | null
  amount_gross: string
  amount_net: string | null
  gas_used: string | null
  sender_address: string | null
  receiver_address: string | null
  timestamp: string // bigint as string from pg
  block_number: string | null
  matched_tx_id: number | null
  match_score: string | null
  score_breakdown: ScoreBreakdown | null
  reconciled_at: string | null
  reconciled_by: string | null
  force_reconciled: boolean
  notes: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// ---------- Score Breakdown ----------
export interface ScoreBreakdown {
  amount: number
  address: number
  time: number
  token: number
}

// ---------- Request Schemas ----------
export const CreateClaimSchema = z.object({
  tx_hash: z.string().min(1).max(66),
  source: z.enum(['local', 'csv', 'manual']).default('manual'),
  type: TransactionType,
  token_symbol: z.string().min(1).max(20),
  token_address: z.string().max(42).optional(),
  amount_gross: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
    message: 'amount_gross must be a non-negative number string',
  }),
  amount_net: z.string().optional(),
  gas_used: z.string().optional(),
  sender_address: z.string().max(42).optional(),
  receiver_address: z.string().max(42).optional(),
  timestamp: z.number().int().positive(),
  block_number: z.number().int().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})
export type CreateClaim = z.infer<typeof CreateClaimSchema>

export const ImportClaimsSchema = z.object({
  claims: z.array(CreateClaimSchema).min(1).max(500),
})
export type ImportClaims = z.infer<typeof ImportClaimsSchema>

export const TransactionQuerySchema = z.object({
  source: TransactionSource.optional(),
  status: TransactionStatus.optional(),
  token: z.string().optional(),
  from_date: z.coerce.number().optional(),
  to_date: z.coerce.number().optional(),
  sender: z.string().optional(),
  receiver: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})
export type TransactionQuery = z.infer<typeof TransactionQuerySchema>

// ---------- API Response ----------
export interface TransactionResponse {
  id: number
  tx_hash: string
  source: TransactionSource
  status: TransactionStatus
  type: TransactionType
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
  score_breakdown: ScoreBreakdown | null
  reconciled_at: string | null
  reconciled_by: string | null
  force_reconciled: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export function toTransactionResponse(row: TransactionRow): TransactionResponse {
  return {
    id: row.id,
    tx_hash: row.tx_hash,
    source: row.source,
    status: row.status,
    type: row.type,
    token_symbol: row.token_symbol,
    token_address: row.token_address,
    amount_gross: row.amount_gross,
    amount_net: row.amount_net,
    gas_used: row.gas_used,
    sender_address: row.sender_address,
    receiver_address: row.receiver_address,
    timestamp: Number(row.timestamp),
    block_number: row.block_number ? Number(row.block_number) : null,
    matched_tx_id: row.matched_tx_id,
    match_score: row.match_score ? Number(row.match_score) : null,
    score_breakdown: row.score_breakdown,
    reconciled_at: row.reconciled_at,
    reconciled_by: row.reconciled_by,
    force_reconciled: row.force_reconciled,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
