import { z } from 'zod'
import type { ScoreBreakdown, TransactionResponse } from './Transaction.js'

// ---------- DB Row ----------
export interface SuggestionRow {
  id: number
  anchor_id: number
  claim_id: number
  score: string
  score_breakdown: ScoreBreakdown
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
}

// ---------- API Response ----------
export interface SuggestionResponse {
  id: number
  anchor: TransactionResponse
  claim: TransactionResponse
  score: number
  score_breakdown: ScoreBreakdown
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
}

// ---------- Request Schemas ----------
export const SuggestionQuerySchema = z.object({
  min_score: z.coerce.number().min(0).max(100).optional(),
  token: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})
export type SuggestionQuery = z.infer<typeof SuggestionQuerySchema>

export const ReconcileSchema = z.object({
  anchor_id: z.number().int().positive(),
  claim_id: z.number().int().positive(),
  force: z.boolean().default(false),
  actor: z.string().min(1).default('system'),
})
export type ReconcileRequest = z.infer<typeof ReconcileSchema>

export const RejectSchema = z.object({
  anchor_id: z.number().int().positive(),
  claim_id: z.number().int().positive(),
  reason: z.string().optional(),
  actor: z.string().min(1).default('system'),
})
export type RejectRequest = z.infer<typeof RejectSchema>

export const RunMatchingSchema = z.object({
  token: z.string().optional(),
  min_score: z.coerce.number().min(0).max(100).default(70),
})
export type RunMatchingRequest = z.infer<typeof RunMatchingSchema>

export const BatchReconcileSchema = z.object({
  pairs: z
    .array(
      z.object({
        anchor_id: z.number().int().positive(),
        claim_id: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(100),
  actor: z.string().min(1).default('system'),
})
export type BatchReconcileRequest = z.infer<typeof BatchReconcileSchema>
