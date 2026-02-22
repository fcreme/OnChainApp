import { db } from '../config/database.js'
import { PAGINATION } from '../config/constants.js'
import { auditService } from './AuditService.js'
import type {
  TransactionRow,
  CreateClaim,
  TransactionQuery,
} from '../models/Transaction.js'

export class TransactionService {
  // ── Insert a single claim ──
  async createClaim(claim: CreateClaim, actor: string = 'system'): Promise<TransactionRow> {
    const row = await db.one<TransactionRow>(
      `INSERT INTO transactions
        (tx_hash, source, status, type, token_symbol, token_address,
         amount_gross, amount_net, gas_used,
         sender_address, receiver_address,
         timestamp, block_number, notes, metadata)
       VALUES
        ($1, $2, 'pending', $3, $4, $5,
         $6, $7, $8,
         $9, $10,
         $11, $12, $13, $14)
       RETURNING *`,
      [
        claim.tx_hash,
        claim.source,
        claim.type,
        claim.token_symbol,
        claim.token_address ?? null,
        claim.amount_gross,
        claim.amount_net ?? null,
        claim.gas_used ?? null,
        claim.sender_address ?? null,
        claim.receiver_address ?? null,
        claim.timestamp,
        claim.block_number ?? null,
        claim.notes ?? null,
        claim.metadata ? JSON.stringify(claim.metadata) : null,
      ],
    )

    await auditService.log(
      'create_claim',
      'transaction',
      row.id,
      actor,
      null,
      { status: 'pending', source: claim.source, token: claim.token_symbol },
    )

    return row
  }

  // ── Bulk import claims ──
  async importClaims(
    claims: CreateClaim[],
    actor: string = 'system',
  ): Promise<{ imported: TransactionRow[]; failed: Array<{ index: number; error: string }> }> {
    const imported: TransactionRow[] = []
    const failed: Array<{ index: number; error: string }> = []

    for (let i = 0; i < claims.length; i++) {
      try {
        const row = await this.createClaim(claims[i], actor)
        imported.push(row)
      } catch (err) {
        failed.push({
          index: i,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return { imported, failed }
  }

  // ── Insert an on-chain anchor ──
  async upsertAnchor(anchor: {
    tx_hash: string
    type: string
    token_symbol: string
    token_address: string
    amount_gross: string
    sender_address: string | null
    receiver_address: string | null
    timestamp: number
    block_number: number
    gas_used?: string
  }): Promise<TransactionRow> {
    return db.one<TransactionRow>(
      `INSERT INTO transactions
        (tx_hash, source, status, type, token_symbol, token_address,
         amount_gross, gas_used, sender_address, receiver_address,
         timestamp, block_number)
       VALUES ($1, 'onchain', 'anchor', $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (tx_hash, type) WHERE source = 'onchain'
         DO UPDATE SET
           amount_gross = EXCLUDED.amount_gross,
           gas_used = EXCLUDED.gas_used,
           timestamp = EXCLUDED.timestamp,
           block_number = EXCLUDED.block_number
       RETURNING *`,
      [
        anchor.tx_hash,
        anchor.type,
        anchor.token_symbol,
        anchor.token_address,
        anchor.amount_gross,
        anchor.gas_used ?? null,
        anchor.sender_address,
        anchor.receiver_address,
        anchor.timestamp,
        anchor.block_number,
      ],
    )
  }

  // ── Get single transaction ──
  async getById(id: number): Promise<TransactionRow | null> {
    return db.oneOrNone<TransactionRow>('SELECT * FROM transactions WHERE id = $1', [id])
  }

  // ── Query transactions with filters + pagination ──
  async query(
    filters: TransactionQuery,
  ): Promise<{ transactions: TransactionRow[]; total: number }> {
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (filters.source) {
      conditions.push(`source = $${idx++}`)
      params.push(filters.source)
    }
    if (filters.status) {
      conditions.push(`status = $${idx++}`)
      params.push(filters.status)
    }
    if (filters.token) {
      conditions.push(`token_symbol = $${idx++}`)
      params.push(filters.token)
    }
    if (filters.from_date) {
      conditions.push(`timestamp >= $${idx++}`)
      params.push(filters.from_date)
    }
    if (filters.to_date) {
      conditions.push(`timestamp <= $${idx++}`)
      params.push(filters.to_date)
    }
    if (filters.sender) {
      conditions.push(`LOWER(sender_address) = LOWER($${idx++})`)
      params.push(filters.sender)
    }
    if (filters.receiver) {
      conditions.push(`LOWER(receiver_address) = LOWER($${idx++})`)
      params.push(filters.receiver)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = Math.min(filters.limit ?? PAGINATION.defaultLimit, PAGINATION.maxLimit)
    const offset = ((filters.page ?? 1) - 1) * limit

    const [rows, countResult] = await Promise.all([
      db.manyOrNone<TransactionRow>(
        `SELECT * FROM transactions ${where}
         ORDER BY timestamp DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset],
      ),
      db.one<{ count: string }>(
        `SELECT COUNT(*) as count FROM transactions ${where}`,
        params,
      ),
    ])

    return { transactions: rows, total: Number(countResult.count) }
  }

  // ── Update transaction status ──
  async updateStatus(
    id: number,
    status: string,
    updates: Partial<{
      matched_tx_id: number | null
      match_score: number | null
      score_breakdown: Record<string, number> | null
      reconciled_by: string
      force_reconciled: boolean
    }> = {},
  ): Promise<TransactionRow> {
    const sets = ['status = $2']
    const params: unknown[] = [id, status]
    let idx = 3

    if (updates.matched_tx_id !== undefined) {
      sets.push(`matched_tx_id = $${idx++}`)
      params.push(updates.matched_tx_id)
    }
    if (updates.match_score !== undefined) {
      sets.push(`match_score = $${idx++}`)
      params.push(updates.match_score)
    }
    if (updates.score_breakdown !== undefined) {
      sets.push(`score_breakdown = $${idx++}`)
      params.push(JSON.stringify(updates.score_breakdown))
    }
    if (updates.reconciled_by) {
      sets.push(`reconciled_by = $${idx++}`)
      params.push(updates.reconciled_by)
      sets.push(`reconciled_at = NOW()`)
    }
    if (updates.force_reconciled !== undefined) {
      sets.push(`force_reconciled = $${idx++}`)
      params.push(updates.force_reconciled)
    }

    return db.one<TransactionRow>(
      `UPDATE transactions SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
      params,
    )
  }

  // ── Get unmatched anchors for matching engine ──
  async getUnmatchedAnchors(token?: string): Promise<TransactionRow[]> {
    const conditions = [
      "source = 'onchain'",
      "status = 'anchor'",
      'matched_tx_id IS NULL',
    ]
    const params: unknown[] = []

    if (token) {
      conditions.push('token_symbol = $1')
      params.push(token)
    }

    return db.manyOrNone<TransactionRow>(
      `SELECT * FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY timestamp DESC`,
      params,
    )
  }

  // ── Get candidate claims for an anchor (pre-filtered) ──
  async getCandidateClaims(
    anchorId: number,
    anchorToken: string,
    anchorAmount: number,
    anchorTimestamp: number,
    amountPercent: number,
    timeWindowMs: number,
  ): Promise<TransactionRow[]> {
    const amountLo = anchorAmount * (1 - amountPercent)
    const amountHi = anchorAmount * (1 + amountPercent)
    const timeLo = anchorTimestamp - timeWindowMs
    const timeHi = anchorTimestamp + timeWindowMs

    return db.manyOrNone<TransactionRow>(
      `SELECT c.*
       FROM transactions c
       WHERE c.source != 'onchain'
         AND c.status = 'pending'
         AND c.token_symbol = $1
         AND c.amount_gross BETWEEN $2 AND $3
         AND c.timestamp BETWEEN $4 AND $5
         AND NOT EXISTS (
           SELECT 1 FROM rejected_pairs rp
           WHERE rp.anchor_id = $6 AND rp.claim_id = c.id
         )
       ORDER BY ABS(c.amount_gross - $7) ASC
       LIMIT 50`,
      [anchorToken, amountLo, amountHi, timeLo, timeHi, anchorId, anchorAmount],
    )
  }

  // ── Summary stats ──
  async getStats(): Promise<{
    total_anchors: number
    total_claims: number
    pending_claims: number
    reconciled: number
    suggestions: number
    match_rate: number
  }> {
    const result = await db.one<{
      total_anchors: string
      total_claims: string
      pending_claims: string
      reconciled: string
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'anchor') AS total_anchors,
        COUNT(*) FILTER (WHERE source != 'onchain') AS total_claims,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_claims,
        COUNT(*) FILTER (WHERE status IN ('reconciled', 'force_reconciled')) AS reconciled
      FROM transactions
    `)

    const sugCount = await db.one<{ count: string }>(
      "SELECT COUNT(*) as count FROM match_suggestions WHERE status = 'pending'",
    )

    const totalClaims = Number(result.total_claims)
    const reconciled = Number(result.reconciled)

    return {
      total_anchors: Number(result.total_anchors),
      total_claims: totalClaims,
      pending_claims: Number(result.pending_claims),
      reconciled,
      suggestions: Number(sugCount.count),
      match_rate: totalClaims > 0 ? Math.round((reconciled / totalClaims) * 100) : 0,
    }
  }
}

export const transactionService = new TransactionService()
