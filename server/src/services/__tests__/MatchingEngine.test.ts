import { describe, it, expect } from 'vitest'
import { MatchingEngine, type MatchingConfig } from '../MatchingEngine.js'
import { DEFAULT_WEIGHTS, DEFAULT_TOLERANCES } from '../../config/constants.js'
import type { TransactionRow } from '../../models/Transaction.js'

const engine = new MatchingEngine()

const defaultConfig: MatchingConfig = {
  weights: { ...DEFAULT_WEIGHTS },
  tolerances: { ...DEFAULT_TOLERANCES },
}

function makeTx(overrides: Partial<TransactionRow> = {}): TransactionRow {
  return {
    id: 1,
    tx_hash: '0xhash',
    source: 'onchain',
    status: 'anchor',
    type: 'Transfer',
    token_symbol: 'USDC',
    token_address: null,
    amount_gross: '100',
    amount_net: null,
    gas_used: null,
    sender_address: '0xAAA',
    receiver_address: '0xBBB',
    timestamp: '1000000',
    block_number: null,
    matched_tx_id: null,
    match_score: null,
    score_breakdown: null,
    reconciled_at: null,
    reconciled_by: null,
    force_reconciled: false,
    notes: null,
    metadata: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('MatchingEngine.scoreMatch — smoke', () => {
  it('returns total 100 for a perfect match with default weights', () => {
    const anchor = makeTx()
    const claim = makeTx({ id: 2 })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.total).toBe(100)
    expect(score.breakdown).toEqual({ amount: 40, address: 30, time: 20, token: 10 })
  })
})
