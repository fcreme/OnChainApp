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

describe('MatchingEngine.scoreMatch — amount', () => {
  it('full weight when amounts match exactly', () => {
    const anchor = makeTx({ amount_gross: '100' })
    const claim = makeTx({ id: 2, amount_gross: '100' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.amount).toBe(40)
  })

  it('zero amount points when diff equals tolerance boundary', () => {
    // tolerance 1% of 100 = 1.0; diff of 1.0 → 40 * (1 - 1) = 0
    const anchor = makeTx({ amount_gross: '100' })
    const claim = makeTx({ id: 2, amount_gross: '101' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.amount).toBe(0)
  })

  it('linear decay at half tolerance', () => {
    // diff = 0.5, threshold = 1.0 → 40 * (1 - 0.5) = 20
    const anchor = makeTx({ amount_gross: '100' })
    const claim = makeTx({ id: 2, amount_gross: '100.5' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.amount).toBe(20)
  })

  it('zero amount points when diff outside tolerance', () => {
    const anchor = makeTx({ amount_gross: '100' })
    const claim = makeTx({ id: 2, amount_gross: '102' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.amount).toBe(0)
  })

  it('full points when both anchor and claim are zero (exact-match branch)', () => {
    const anchor = makeTx({ amount_gross: '0' })
    const claim = makeTx({ id: 2, amount_gross: '0' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.amount).toBe(40)
  })

  it('zero points when anchor amount is zero and claim is non-zero', () => {
    // amtThreshold = 0 * 0.01 = 0; amtDiff = 1; neither branch fires
    const anchor = makeTx({ amount_gross: '0' })
    const claim = makeTx({ id: 2, amount_gross: '1' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.amount).toBe(0)
  })
})

describe('MatchingEngine.scoreMatch — gas-aware amount', () => {
  it('uses net amount when net matches claim better than gross', () => {
    // anchor gross=100, net=99, gas=1; claim=99
    // gross diff = 1, threshold = 1 → gross score = 0 (boundary)
    // net diff = 0 → net score = 40
    // max = 40
    const anchor = makeTx({ amount_gross: '100', amount_net: '99', gas_used: '1' })
    const claim = makeTx({ id: 2, amount_gross: '99' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.amount).toBe(40)
  })

  it('uses gross amount when gross matches claim better than net', () => {
    // anchor gross=100, net=99, gas=1; claim=100
    // gross diff = 0 → gross score = 40
    // net diff = 1, threshold = 1 → net score = 0 (boundary)
    // max = 40
    const anchor = makeTx({ amount_gross: '100', amount_net: '99', gas_used: '1' })
    const claim = makeTx({ id: 2, amount_gross: '100' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.amount).toBe(40)
  })

  it('skips gas-aware path when gas_used is null', () => {
    // amount_net present but gas_used null → gas-aware branch requires both
    const anchor = makeTx({ amount_gross: '100', amount_net: '99', gas_used: null })
    const claim = makeTx({ id: 2, amount_gross: '100' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.amount).toBe(40) // gross diff = 0
  })

  it('skips gas-aware path when amount_net is null', () => {
    const anchor = makeTx({ amount_gross: '100', amount_net: null, gas_used: '1' })
    const claim = makeTx({ id: 2, amount_gross: '100' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.amount).toBe(40)
  })
})

describe('MatchingEngine.scoreMatch — address', () => {
  it('full weight when both sender and receiver match', () => {
    const anchor = makeTx({ sender_address: '0xAAA', receiver_address: '0xBBB' })
    const claim = makeTx({ id: 2, sender_address: '0xAAA', receiver_address: '0xBBB' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.address).toBe(30)
  })

  it('half weight when only sender matches', () => {
    const anchor = makeTx({ sender_address: '0xAAA', receiver_address: '0xBBB' })
    const claim = makeTx({ id: 2, sender_address: '0xAAA', receiver_address: '0xCCC' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.address).toBe(15)
  })

  it('half weight when only receiver matches', () => {
    const anchor = makeTx({ sender_address: '0xAAA', receiver_address: '0xBBB' })
    const claim = makeTx({ id: 2, sender_address: '0xCCC', receiver_address: '0xBBB' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.address).toBe(15)
  })

  it('zero when neither address matches', () => {
    const anchor = makeTx({ sender_address: '0xAAA', receiver_address: '0xBBB' })
    const claim = makeTx({ id: 2, sender_address: '0xCCC', receiver_address: '0xDDD' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.address).toBe(0)
  })

  it('case-insensitive: uppercase matches lowercase on both sides', () => {
    const anchor = makeTx({ sender_address: '0xABC123', receiver_address: '0xDEF456' })
    const claim = makeTx({ id: 2, sender_address: '0xabc123', receiver_address: '0xdef456' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.address).toBe(30)
  })

  it('null sender on anchor: sender half scores 0, receiver half still counts', () => {
    const anchor = makeTx({ sender_address: null, receiver_address: '0xBBB' })
    const claim = makeTx({ id: 2, sender_address: '0xAAA', receiver_address: '0xBBB' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.address).toBe(15)
  })

  it('null receiver on claim: receiver half scores 0, sender half still counts', () => {
    const anchor = makeTx({ sender_address: '0xAAA', receiver_address: '0xBBB' })
    const claim = makeTx({ id: 2, sender_address: '0xAAA', receiver_address: null })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.address).toBe(15)
  })
})

describe('MatchingEngine.scoreMatch — time', () => {
  it('full weight when timestamps are identical', () => {
    const anchor = makeTx({ timestamp: '1000000' })
    const claim = makeTx({ id: 2, timestamp: '1000000' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.time).toBe(20)
  })

  it('zero at the time-window boundary', () => {
    // diff = 3_600_000 = window → 20 * (1 - 1) = 0
    const anchor = makeTx({ timestamp: '1000000' })
    const claim = makeTx({ id: 2, timestamp: '4600000' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.time).toBe(0)
  })

  it('linear decay at half the time window', () => {
    // diff = 1_800_000 → 20 * (1 - 0.5) = 10
    const anchor = makeTx({ timestamp: '1000000' })
    const claim = makeTx({ id: 2, timestamp: '2800000' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.time).toBe(10)
  })

  it('zero when diff is outside the time window', () => {
    const anchor = makeTx({ timestamp: '1000000' })
    const claim = makeTx({ id: 2, timestamp: '6000000' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.time).toBe(0)
  })
})

describe('MatchingEngine.scoreMatch — token', () => {
  it('full weight when token symbols match exactly', () => {
    const anchor = makeTx({ token_symbol: 'USDC' })
    const claim = makeTx({ id: 2, token_symbol: 'USDC' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.token).toBe(10)
  })

  it('zero when token symbols differ', () => {
    const anchor = makeTx({ token_symbol: 'USDC' })
    const claim = makeTx({ id: 2, token_symbol: 'DAI' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.token).toBe(0)
  })

  it('case-sensitive: USDC and usdc do NOT match (documents current behavior)', () => {
    const anchor = makeTx({ token_symbol: 'USDC' })
    const claim = makeTx({ id: 2, token_symbol: 'usdc' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown.token).toBe(0)
  })
})
