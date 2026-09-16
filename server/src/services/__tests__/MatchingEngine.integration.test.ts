import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../config/database.js'
import { matchingEngine } from '../MatchingEngine.js'
import { transactionService } from '../TransactionService.js'
import { DEFAULT_TOLERANCES } from '../../config/constants.js'
import { resetDatabase, insertAnchor, insertClaim, getTransaction } from '../../test/db.js'
import type { ScoreBreakdown } from '../../models/Transaction.js'

interface SuggestionRow {
  anchor_id: number
  claim_id: number
  score: string
  score_breakdown: ScoreBreakdown
}

function readSuggestions(): Promise<SuggestionRow[]> {
  return db.manyOrNone<SuggestionRow>(
    'SELECT anchor_id, claim_id, score, score_breakdown FROM match_suggestions ORDER BY id',
  )
}

describe('MatchingEngine.generateSuggestions — anchor and claim type must agree', () => {
  beforeEach(resetDatabase)

  it('never suggests a Transfer claim for an Approval anchor, however well it scores', async () => {
    // Same token, amount, addresses and timestamp: a 100-point pair on every
    // other axis, so only the type difference can keep them apart.
    await insertAnchor({ type: 'Approval' })
    const claim = await insertClaim({ type: 'Transfer' })

    const result = await matchingEngine.generateSuggestions()

    expect(result.new_suggestions).toBe(0)
    expect(await readSuggestions()).toEqual([])
    expect((await getTransaction(claim.id)).status).toBe('pending')
  })

  it('suggests a Transfer claim for a Transfer anchor and moves the claim to suggested_match', async () => {
    const anchor = await insertAnchor({ type: 'Transfer' })
    const claim = await insertClaim({ type: 'Transfer' })

    const result = await matchingEngine.generateSuggestions()

    expect(result.new_suggestions).toBe(1)
    const rows = await readSuggestions()
    expect(rows).toHaveLength(1)
    expect(rows[0].anchor_id).toBe(anchor.id)
    expect(rows[0].claim_id).toBe(claim.id)
    expect(Number(rows[0].score)).toBe(100)
    expect(rows[0].score_breakdown).toEqual({ amount: 40, address: 30, time: 20, token: 10 })
    expect((await getTransaction(claim.id)).status).toBe('suggested_match')
  })

  it('suggests an Approval claim for an Approval anchor — the rule is equality, not dropping Approvals', async () => {
    const anchor = await insertAnchor({ type: 'Approval' })
    const claim = await insertClaim({ type: 'Approval' })

    const result = await matchingEngine.generateSuggestions()

    expect(result.new_suggestions).toBe(1)
    const rows = await readSuggestions()
    expect(rows).toHaveLength(1)
    expect(rows[0].anchor_id).toBe(anchor.id)
    expect(rows[0].claim_id).toBe(claim.id)
    expect((await getTransaction(claim.id)).status).toBe('suggested_match')
  })
})

describe('TransactionService.getCandidateClaims — type filter', () => {
  beforeEach(resetDatabase)

  it('returns only the claim whose type equals the anchor type', async () => {
    const anchor = await insertAnchor({ type: 'Transfer' })
    const transferClaim = await insertClaim({ type: 'Transfer' })
    await insertClaim({ type: 'Approval' })

    const candidates = await transactionService.getCandidateClaims(
      anchor.id,
      anchor.token_symbol,
      Number(anchor.amount_gross),
      Number(anchor.timestamp),
      DEFAULT_TOLERANCES.amount_percent,
      DEFAULT_TOLERANCES.time_window_ms,
      anchor.type,
    )

    expect(candidates.map((c) => c.id)).toEqual([transferClaim.id])
  })
})
