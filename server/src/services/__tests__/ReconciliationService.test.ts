import { describe, it, expect, beforeEach } from 'vitest'
import { reconciliationService } from '../ReconciliationService.js'
import { db } from '../../config/database.js'
import { AppError } from '../../middleware/errorHandler.js'
import {
  resetDatabase,
  insertAnchor,
  insertClaim,
  getTransaction,
} from '../../test/db.js'
import type { TransactionRow } from '../../models/Transaction.js'
import type { SuggestionRow } from '../../models/Suggestion.js'

const ACTOR = 'auditor@example.com'
const BREAKDOWN = { amount: 40, address: 30, time: 20, token: 10 }

function insertSuggestion(anchorId: number, claimId: number, score = 92.5): Promise<SuggestionRow> {
  return db.one<SuggestionRow>(
    `INSERT INTO match_suggestions (anchor_id, claim_id, score, score_breakdown)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [anchorId, claimId, score, JSON.stringify(BREAKDOWN)],
  )
}

function getSuggestion(anchorId: number, claimId: number): Promise<SuggestionRow> {
  return db.one<SuggestionRow>(
    'SELECT * FROM match_suggestions WHERE anchor_id = $1 AND claim_id = $2',
    [anchorId, claimId],
  )
}

function rejectPair(anchorId: number, claimId: number): Promise<null> {
  return db.none(
    'INSERT INTO rejected_pairs (anchor_id, claim_id, rejected_by) VALUES ($1, $2, $3)',
    [anchorId, claimId, ACTOR],
  )
}

async function auditCount(): Promise<number> {
  const { count } = await db.one<{ count: string }>('SELECT COUNT(*) AS count FROM audit_log')
  return Number(count)
}

// Asserts the call rejects with an AppError carrying this status and code, and
// returns it so a test can look at the message too.
async function expectAppError(
  call: Promise<unknown>,
  statusCode: number,
  code: string,
): Promise<AppError> {
  let thrown: unknown
  try {
    await call
    throw new Error('Expected approve() to reject, but it resolved')
  } catch (err) {
    thrown = err
  }
  expect(thrown).toBeInstanceOf(AppError)
  const err = thrown as AppError
  expect({ statusCode: err.statusCode, code: err.code }).toEqual({ statusCode, code })
  return err
}

// Re-reads every row from the database and asserts none of them moved.
async function expectRowsUntouched(...rows: TransactionRow[]): Promise<void> {
  for (const row of rows) {
    expect(await getTransaction(row.id)).toEqual(row)
  }
  expect(await auditCount()).toBe(0)
}

describe('ReconciliationService.approve — happy path', () => {
  beforeEach(resetDatabase)

  it('matches the pair, reconciles the claim and approves the suggestion', async () => {
    const anchor = await insertAnchor()
    const claim = await insertClaim({ status: 'suggested_match' })
    await insertSuggestion(anchor.id, claim.id)

    await reconciliationService.approve(anchor.id, claim.id, ACTOR)

    const storedAnchor = await getTransaction(anchor.id)
    const storedClaim = await getTransaction(claim.id)

    expect(storedAnchor).toMatchObject({
      matched_tx_id: claim.id,
      reconciled_by: ACTOR,
      status: 'anchor',
    })
    expect(Number(storedAnchor.match_score)).toBe(92.5)
    expect(storedAnchor.score_breakdown).toEqual(BREAKDOWN)

    expect(storedClaim).toMatchObject({
      status: 'reconciled',
      matched_tx_id: anchor.id,
      reconciled_by: ACTOR,
      force_reconciled: false,
    })
    expect(Number(storedClaim.match_score)).toBe(92.5)
    expect(storedClaim.reconciled_at).not.toBeNull()

    const suggestion = await getSuggestion(anchor.id, claim.id)
    expect(suggestion).toMatchObject({ status: 'approved', reviewed_by: ACTOR })

    const audit = await db.manyOrNone(
      `SELECT * FROM audit_log WHERE entity_id = $1 AND action = 'approve_match'`,
      [claim.id],
    )
    expect(audit.length).toBeGreaterThan(0)
  })

  it('records a force reconcile with status force_reconciled and no suggestion', async () => {
    const anchor = await insertAnchor()
    const claim = await insertClaim()

    await reconciliationService.approve(anchor.id, claim.id, ACTOR, true)

    const storedClaim = await getTransaction(claim.id)
    expect(storedClaim).toMatchObject({
      status: 'force_reconciled',
      matched_tx_id: anchor.id,
      force_reconciled: true,
      match_score: null,
    })
    expect((await getTransaction(anchor.id)).matched_tx_id).toBe(claim.id)
  })
})

describe('ReconciliationService.approve — missing rows', () => {
  beforeEach(resetDatabase)

  it('404s when the anchor does not exist', async () => {
    const claim = await insertClaim()

    const err = await expectAppError(
      reconciliationService.approve(9999, claim.id, ACTOR),
      404,
      'NOT_FOUND',
    )
    expect(err.message).toBe('Anchor not found')
    await expectRowsUntouched(claim)
  })

  it('404s when the claim does not exist', async () => {
    const anchor = await insertAnchor()

    const err = await expectAppError(
      reconciliationService.approve(anchor.id, 9999, ACTOR),
      404,
      'NOT_FOUND',
    )
    expect(err.message).toBe('Claim not found')
    await expectRowsUntouched(anchor)
  })
})

describe('ReconciliationService.approve — structural checks apply to force too', () => {
  beforeEach(resetDatabase)

  it('rejects an anchor id that points at an off-chain claim', async () => {
    const claimA = await insertClaim()
    const claimB = await insertClaim()

    const err = await expectAppError(
      reconciliationService.approve(claimA.id, claimB.id, ACTOR),
      400,
      'INVALID_STATE',
    )
    expect(err.message).toBe('Transaction is not an anchor')
    await expectRowsUntouched(claimA, claimB)

    await expectAppError(
      reconciliationService.approve(claimA.id, claimB.id, ACTOR, true),
      400,
      'INVALID_STATE',
    )
    await expectRowsUntouched(claimA, claimB)
  })

  it('refuses to turn a second on-chain anchor into a claim, even with force', async () => {
    const anchorA = await insertAnchor()
    const anchorB = await insertAnchor()

    await expectAppError(
      reconciliationService.approve(anchorA.id, anchorB.id, ACTOR, true),
      400,
      'INVALID_STATE',
    )
    await expectRowsUntouched(anchorA, anchorB)

    await expectAppError(
      reconciliationService.approve(anchorA.id, anchorB.id, ACTOR),
      400,
      'INVALID_STATE',
    )
    await expectRowsUntouched(anchorA, anchorB)
  })

  it('refuses to reconcile a transaction with itself', async () => {
    const anchor = await insertAnchor()

    const err = await expectAppError(
      reconciliationService.approve(anchor.id, anchor.id, ACTOR, true),
      400,
      'INVALID_STATE',
    )
    expect(err.message).toMatch(/itself/i)
    await expectRowsUntouched(anchor)
  })

  it('409s when the anchor is already matched to a different claim', async () => {
    const firstClaim = await insertClaim()
    const anchor = await insertAnchor({ matched_tx_id: firstClaim.id })
    const otherClaim = await insertClaim()
    const anchorBefore = await getTransaction(anchor.id)

    await expectAppError(
      reconciliationService.approve(anchor.id, otherClaim.id, ACTOR),
      409,
      'CONFLICT',
    )
    await expectRowsUntouched(anchorBefore, otherClaim, firstClaim)

    await expectAppError(
      reconciliationService.approve(anchor.id, otherClaim.id, ACTOR, true),
      409,
      'CONFLICT',
    )
    await expectRowsUntouched(anchorBefore, otherClaim, firstClaim)
  })

  it('409s when the claim is already reconciled to a different anchor', async () => {
    const otherAnchor = await insertAnchor()
    const claim = await insertClaim({ status: 'reconciled', matched_tx_id: otherAnchor.id })
    const anchor = await insertAnchor()

    await expectAppError(
      reconciliationService.approve(anchor.id, claim.id, ACTOR),
      409,
      'CONFLICT',
    )
    await expectRowsUntouched(anchor, claim, otherAnchor)

    await expectAppError(
      reconciliationService.approve(anchor.id, claim.id, ACTOR, true),
      409,
      'CONFLICT',
    )
    await expectRowsUntouched(anchor, claim, otherAnchor)
  })

  it('treats re-approving the very same pair as idempotent, not a conflict', async () => {
    const anchor = await insertAnchor()
    const claim = await insertClaim()

    await reconciliationService.approve(anchor.id, claim.id, ACTOR)

    // Same pair again: the rows already point at each other, which is not a conflict.
    // Without force the status check is what stops it, not a 409.
    await expectAppError(
      reconciliationService.approve(anchor.id, claim.id, ACTOR),
      400,
      'INVALID_STATE',
    )

    await reconciliationService.approve(anchor.id, claim.id, ACTOR, true)

    expect(await getTransaction(claim.id)).toMatchObject({
      status: 'force_reconciled',
      matched_tx_id: anchor.id,
    })
    expect((await getTransaction(anchor.id)).matched_tx_id).toBe(claim.id)
  })
})

describe('ReconciliationService.approve — checks force is allowed to skip', () => {
  beforeEach(resetDatabase)

  it('rejects a claim that is no longer pending, but lets force through', async () => {
    const anchor = await insertAnchor()
    const claim = await insertClaim({ status: 'rejected' })

    const err = await expectAppError(
      reconciliationService.approve(anchor.id, claim.id, ACTOR),
      400,
      'INVALID_STATE',
    )
    expect(err.message).toContain("Claim status is 'rejected'")
    await expectRowsUntouched(anchor, claim)

    await reconciliationService.approve(anchor.id, claim.id, ACTOR, true)
    expect(await getTransaction(claim.id)).toMatchObject({
      status: 'force_reconciled',
      matched_tx_id: anchor.id,
    })
  })

  it('rejects a type mismatch, but lets force through', async () => {
    const anchor = await insertAnchor({ type: 'Transfer' })
    const claim = await insertClaim({ type: 'Approval' })

    await expectAppError(
      reconciliationService.approve(anchor.id, claim.id, ACTOR),
      400,
      'INVALID_STATE',
    )
    await expectRowsUntouched(anchor, claim)

    await reconciliationService.approve(anchor.id, claim.id, ACTOR, true)
    expect(await getTransaction(claim.id)).toMatchObject({
      status: 'force_reconciled',
      matched_tx_id: anchor.id,
    })
  })

  it('rejects a pair that was explicitly rejected, but lets force through', async () => {
    const anchor = await insertAnchor()
    const claim = await insertClaim()
    await rejectPair(anchor.id, claim.id)

    await expectAppError(
      reconciliationService.approve(anchor.id, claim.id, ACTOR),
      400,
      'INVALID_STATE',
    )
    await expectRowsUntouched(anchor, claim)

    await reconciliationService.approve(anchor.id, claim.id, ACTOR, true)
    expect(await getTransaction(claim.id)).toMatchObject({
      status: 'force_reconciled',
      matched_tx_id: anchor.id,
    })
  })
})

describe('ReconciliationService.batchApprove', () => {
  beforeEach(resetDatabase)

  it('approves the first pair and fails the second when both claim the same anchor', async () => {
    const anchor = await insertAnchor()
    const claimA = await insertClaim()
    const claimB = await insertClaim()

    const result = await reconciliationService.batchApprove(
      [
        { anchor_id: anchor.id, claim_id: claimA.id },
        { anchor_id: anchor.id, claim_id: claimB.id },
      ],
      ACTOR,
    )

    expect(result.approved).toBe(1)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0]).toMatchObject({ anchor_id: anchor.id, claim_id: claimB.id })

    expect((await getTransaction(anchor.id)).matched_tx_id).toBe(claimA.id)
    expect(await getTransaction(claimA.id)).toMatchObject({
      status: 'reconciled',
      matched_tx_id: anchor.id,
    })
    expect(await getTransaction(claimB.id)).toMatchObject({
      status: 'pending',
      matched_tx_id: null,
      reconciled_by: null,
    })
  })
})
