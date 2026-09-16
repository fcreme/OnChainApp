import { db } from '../config/database.js'
import { transactionService } from './TransactionService.js'
import { auditService } from './AuditService.js'
import { AppError } from '../middleware/errorHandler.js'
import type { TransactionRow } from '../models/Transaction.js'
import type { SuggestionRow, SuggestionQuery } from '../models/Suggestion.js'
import { PAGINATION } from '../config/constants.js'

export class ReconciliationService {
  // ── Get suggestions with full transaction data ──
  async getSuggestions(
    filters: SuggestionQuery,
  ): Promise<{ suggestions: SuggestionWithTx[]; total: number }> {
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (filters.status) {
      conditions.push(`s.status = $${idx++}`)
      params.push(filters.status)
    }
    if (filters.min_score) {
      conditions.push(`s.score >= $${idx++}`)
      params.push(filters.min_score)
    }
    if (filters.token) {
      conditions.push(`a.token_symbol = $${idx++}`)
      params.push(filters.token)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = Math.min(filters.limit ?? PAGINATION.defaultLimit, PAGINATION.maxLimit)
    const offset = ((filters.page ?? 1) - 1) * limit

    const rows = await db.manyOrNone<SuggestionWithTxRow>(
      `SELECT
         s.id, s.anchor_id, s.claim_id, s.score, s.score_breakdown,
         s.status, s.reviewed_at, s.reviewed_by, s.created_at,
         row_to_json(a) AS anchor_data,
         row_to_json(c) AS claim_data
       FROM match_suggestions s
       JOIN transactions a ON a.id = s.anchor_id
       JOIN transactions c ON c.id = s.claim_id
       ${where}
       ORDER BY s.score DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
    )

    const countResult = await db.one<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM match_suggestions s
       JOIN transactions a ON a.id = s.anchor_id
       ${where}`,
      params,
    )

    return {
      suggestions: rows.map((r) => ({
        id: r.id,
        anchor_id: r.anchor_id,
        claim_id: r.claim_id,
        score: Number(r.score),
        score_breakdown: r.score_breakdown,
        status: r.status,
        reviewed_at: r.reviewed_at,
        reviewed_by: r.reviewed_by,
        created_at: r.created_at,
        anchor: r.anchor_data,
        claim: r.claim_data,
      })),
      total: Number(countResult.count),
    }
  }

  // ── Approve a match (or force reconcile) ──
  async approve(
    anchorId: number,
    claimId: number,
    actor: string,
    force: boolean = false,
  ): Promise<{ anchor: TransactionRow; claim: TransactionRow }> {
    const status = force ? 'force_reconciled' : 'reconciled'

    // Read, check and write inside one transaction: the ledger state the checks
    // rely on must not change between reading it and writing the match.
    const result = await db.tx(async (t) => {
      // One locking read of both rows, ordered by id so concurrent approvals
      // that share a row always take the locks in the same order.
      const rows = await t.manyOrNone<TransactionRow>(
        'SELECT * FROM transactions WHERE id IN ($1, $2) ORDER BY id FOR UPDATE',
        [anchorId, claimId],
      )
      const anchor = rows.find((r) => r.id === anchorId) ?? null
      const claim = rows.find((r) => r.id === claimId) ?? null

      if (!anchor) throw new AppError(404, 'Anchor not found', 'NOT_FOUND')
      if (!claim) throw new AppError(404, 'Claim not found', 'NOT_FOUND')

      // ── Structural checks: these hold for a force reconcile too ──
      if (anchorId === claimId) {
        throw new AppError(400, 'A transaction cannot be reconciled with itself', 'INVALID_STATE')
      }
      if (anchor.source !== 'onchain') {
        throw new AppError(400, 'Transaction is not an anchor', 'INVALID_STATE')
      }
      if (claim.source === 'onchain') {
        throw new AppError(400, 'Claim is an on-chain anchor, not an off-chain claim', 'INVALID_STATE')
      }
      if (anchor.matched_tx_id !== null && anchor.matched_tx_id !== claimId) {
        throw new AppError(409, `Anchor is already matched to claim ${anchor.matched_tx_id}`, 'CONFLICT')
      }
      if (claim.matched_tx_id !== null && claim.matched_tx_id !== anchorId) {
        throw new AppError(409, `Claim is already reconciled to anchor ${claim.matched_tx_id}`, 'CONFLICT')
      }

      // ── Checks a force reconcile is allowed to override ──
      if (!force) {
        if (claim.status !== 'pending' && claim.status !== 'suggested_match') {
          throw new AppError(400, `Claim status is '${claim.status}', expected 'pending' or 'suggested_match'`, 'INVALID_STATE')
        }
        if (anchor.type !== claim.type) {
          throw new AppError(400, `Type mismatch: anchor is '${anchor.type}', claim is '${claim.type}'`, 'INVALID_STATE')
        }
        const rejected = await t.oneOrNone<{ id: number }>(
          'SELECT id FROM rejected_pairs WHERE anchor_id = $1 AND claim_id = $2',
          [anchorId, claimId],
        )
        if (rejected) {
          throw new AppError(400, 'This pair was rejected; use a force reconcile to override', 'INVALID_STATE')
        }
      }

      // Get the suggestion score if it exists
      const suggestion = await t.oneOrNone<SuggestionRow>(
        'SELECT * FROM match_suggestions WHERE anchor_id = $1 AND claim_id = $2',
        [anchorId, claimId],
      )

      const matchScore = suggestion ? Number(suggestion.score) : null
      const scoreBreakdown = suggestion?.score_breakdown ?? null

      const a = await t.one<TransactionRow>(
        `UPDATE transactions SET
           matched_tx_id = $2, match_score = $3, score_breakdown = $4,
           reconciled_by = $5, reconciled_at = NOW()
         WHERE id = $1 RETURNING *`,
        [anchorId, claimId, matchScore, scoreBreakdown ? JSON.stringify(scoreBreakdown) : null, actor],
      )

      const c = await t.one<TransactionRow>(
        `UPDATE transactions SET
           status = $2, matched_tx_id = $3, match_score = $4,
           score_breakdown = $5, reconciled_by = $6, reconciled_at = NOW(),
           force_reconciled = $7
         WHERE id = $1 RETURNING *`,
        [claimId, status, anchorId, matchScore, scoreBreakdown ? JSON.stringify(scoreBreakdown) : null, actor, force],
      )

      // Update suggestion if it exists
      if (suggestion) {
        await t.none(
          `UPDATE match_suggestions SET status = 'approved', reviewed_at = NOW(), reviewed_by = $3
           WHERE anchor_id = $1 AND claim_id = $2`,
          [anchorId, claimId, actor],
        )
      }

      return {
        anchor: a,
        claim: c,
        matchScore,
        previousStatus: claim.status,
        previousMatch: claim.matched_tx_id,
      }
    })

    await auditService.log(
      force ? 'force_reconcile' : 'approve_match',
      'transaction',
      claimId,
      actor,
      { status: result.previousStatus, matched_tx_id: result.previousMatch },
      { status, matched_tx_id: anchorId, match_score: result.matchScore },
    )

    return { anchor: result.anchor, claim: result.claim }
  }

  // ── Reject a match suggestion ──
  async reject(
    anchorId: number,
    claimId: number,
    actor: string,
    reason?: string,
  ): Promise<void> {
    const claim = await transactionService.getById(claimId)
    if (!claim) throw new AppError(404, 'Claim not found', 'NOT_FOUND')

    await db.tx(async (t) => {
      // Add to rejected pairs (never suggest again)
      await t.none(
        `INSERT INTO rejected_pairs (anchor_id, claim_id, rejected_by, reason)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (anchor_id, claim_id) DO NOTHING`,
        [anchorId, claimId, actor, reason ?? null],
      )

      // Update suggestion status
      await t.none(
        `UPDATE match_suggestions SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $3
         WHERE anchor_id = $1 AND claim_id = $2`,
        [anchorId, claimId, actor],
      )

      // Return claim to pending (if it was suggested_match)
      await t.none(
        `UPDATE transactions SET status = 'pending', reconciled_by = $2
         WHERE id = $1 AND status = 'suggested_match'`,
        [claimId, actor],
      )
    })

    await auditService.log(
      'reject_match',
      'transaction',
      claimId,
      actor,
      { status: claim.status, anchor_id: anchorId },
      { status: 'pending', reason },
    )
  }

  // ── Batch approve ──
  async batchApprove(
    pairs: Array<{ anchor_id: number; claim_id: number }>,
    actor: string,
  ): Promise<{ approved: number; failed: Array<{ anchor_id: number; claim_id: number; error: string }> }> {
    let approved = 0
    const failed: Array<{ anchor_id: number; claim_id: number; error: string }> = []

    for (const pair of pairs) {
      try {
        await this.approve(pair.anchor_id, pair.claim_id, actor)
        approved++
      } catch (err) {
        failed.push({
          anchor_id: pair.anchor_id,
          claim_id: pair.claim_id,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return { approved, failed }
  }
}

// Internal types for JOIN query results
interface SuggestionWithTxRow extends SuggestionRow {
  anchor_data: TransactionRow
  claim_data: TransactionRow
}

export interface SuggestionWithTx {
  id: number
  anchor_id: number
  claim_id: number
  score: number
  score_breakdown: { amount: number; address: number; time: number; token: number }
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  anchor: TransactionRow
  claim: TransactionRow
}

export const reconciliationService = new ReconciliationService()
