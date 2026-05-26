# MatchingEngine Unit Tests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deep unit-test coverage for `MatchingEngine.scoreMatch()` — every branch, all four scoring factors, gas-aware path, rounding, and config customization.

**Architecture:** Single new test file `server/src/services/__tests__/MatchingEngine.test.ts`. Pure unit tests against the synchronous `scoreMatch()` method — no DB, no mocks. Inline `makeTx()` factory builds full `TransactionRow` objects with sensible defaults. Tests pin down current behavior (including subtle cases like case-sensitive token comparison and amount-diff-at-boundary scoring 0).

**Tech Stack:** Vitest (already installed and wired via `npm run test:server`). No new dependencies. No production-code changes.

**TDD note for this plan:** Because we're adding tests to existing code, the standard red-green-refactor pattern adapts to:
1. Write the test.
2. Run it — expect **PASS** (the production code already exists).
3. If a test **fails**, that means we either found a real bug in `MatchingEngine` or wrote an incorrect expectation — STOP, investigate before continuing.
4. Commit.

---

## File Structure

- **Create:** `server/src/services/__tests__/MatchingEngine.test.ts` (all tests)
- **Modify:** none
- **Test:** the file *is* the test

The `__tests__/` folder convention matches the frontend (`src/stores/__tests__/`, `src/hooks/__tests__/`).

---

### Task 1: Scaffold Test File + Smoke Test

**Files:**
- Create: `server/src/services/__tests__/MatchingEngine.test.ts`

- [ ] **Step 1: Create the test file with the helper and a smoke test**

```ts
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
```

- [ ] **Step 2: Run the test**

Run from repo root: `npm run test:server -- --run`
Expected: PASS, 1 test passed.

If the run fails because of missing config or ESM resolution issues, do not edit production files — fix only the import paths in the test file (the production code already builds and runs in `npm run dev:server`).

- [ ] **Step 3: Commit**

```bash
git add server/src/services/__tests__/MatchingEngine.test.ts
git commit -m "test(server): scaffold MatchingEngine.scoreMatch test file"
```

---

### Task 2: Amount Scoring

**Files:**
- Modify: `server/src/services/__tests__/MatchingEngine.test.ts` (append a new `describe` block)

- [ ] **Step 1: Append the Amount Scoring describe block**

Append this block to the end of the test file (after the smoke `describe`):

```ts
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
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:server -- --run`
Expected: PASS, 7 tests passed (1 smoke + 6 amount).

- [ ] **Step 3: Commit**

```bash
git add server/src/services/__tests__/MatchingEngine.test.ts
git commit -m "test(server): add amount scoring cases to MatchingEngine"
```

---

### Task 3: Gas-Aware Amount

**Files:**
- Modify: `server/src/services/__tests__/MatchingEngine.test.ts` (append a new `describe` block)

- [ ] **Step 1: Append the Gas-Aware Amount describe block**

Append this block to the end of the file:

```ts
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
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:server -- --run`
Expected: PASS, 11 tests passed.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/__tests__/MatchingEngine.test.ts
git commit -m "test(server): add gas-aware amount cases to MatchingEngine"
```

---

### Task 4: Address Scoring

**Files:**
- Modify: `server/src/services/__tests__/MatchingEngine.test.ts` (append a new `describe` block)

- [ ] **Step 1: Append the Address Scoring describe block**

```ts
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
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:server -- --run`
Expected: PASS, 18 tests passed.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/__tests__/MatchingEngine.test.ts
git commit -m "test(server): add address scoring cases to MatchingEngine"
```

---

### Task 5: Time Scoring

**Files:**
- Modify: `server/src/services/__tests__/MatchingEngine.test.ts` (append a new `describe` block)

- [ ] **Step 1: Append the Time Scoring describe block**

Default `time_window_ms = 3_600_000` (1 hour).

```ts
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
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:server -- --run`
Expected: PASS, 22 tests passed.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/__tests__/MatchingEngine.test.ts
git commit -m "test(server): add time scoring cases to MatchingEngine"
```

---

### Task 6: Token Scoring

**Files:**
- Modify: `server/src/services/__tests__/MatchingEngine.test.ts` (append a new `describe` block)

- [ ] **Step 1: Append the Token Scoring describe block**

```ts
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
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:server -- --run`
Expected: PASS, 25 tests passed.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/__tests__/MatchingEngine.test.ts
git commit -m "test(server): add token scoring cases to MatchingEngine"
```

---

### Task 7: Total + Breakdown

**Files:**
- Modify: `server/src/services/__tests__/MatchingEngine.test.ts` (append a new `describe` block)

- [ ] **Step 1: Append the Total + Breakdown describe block**

```ts
describe('MatchingEngine.scoreMatch — total + breakdown', () => {
  it('total equals the sum of all four breakdown components', () => {
    // Mix-and-match: amount=20 (half tolerance), address=15 (sender only),
    // time=10 (half window), token=10 (match) → total = 55
    const anchor = makeTx({
      amount_gross: '100',
      sender_address: '0xAAA',
      receiver_address: '0xBBB',
      timestamp: '1000000',
      token_symbol: 'USDC',
    })
    const claim = makeTx({
      id: 2,
      amount_gross: '100.5',
      sender_address: '0xAAA',
      receiver_address: '0xZZZ',
      timestamp: '2800000',
      token_symbol: 'USDC',
    })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.breakdown).toEqual({ amount: 20, address: 15, time: 10, token: 10 })
    expect(score.total).toBe(55)
  })

  it('total = 100 for a perfect match with default weights', () => {
    const anchor = makeTx()
    const claim = makeTx({ id: 2 })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    expect(score.total).toBe(100)
  })

  it('rounds breakdown values to 2 decimal places', () => {
    // diff = 0.33, threshold = 1 → 40 * (1 - 0.33) = 26.8
    const anchor = makeTx({ amount_gross: '100' })
    const claim = makeTx({ id: 2, amount_gross: '100.33', token_symbol: 'NONE' })
    const score = engine.scoreMatch(anchor, claim, defaultConfig)
    // 40 * 0.67 = 26.8, round(26.8, 2) = 26.8
    expect(score.breakdown.amount).toBeCloseTo(26.8, 2)
  })

  it('respects custom weights — amount cap of 50', () => {
    const customConfig: MatchingConfig = {
      weights: { amount: 50, address: 20, time: 20, token: 10 },
      tolerances: { ...DEFAULT_TOLERANCES },
    }
    const anchor = makeTx()
    const claim = makeTx({ id: 2 })
    const score = engine.scoreMatch(anchor, claim, customConfig)
    expect(score.breakdown).toEqual({ amount: 50, address: 20, time: 20, token: 10 })
    expect(score.total).toBe(100)
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:server -- --run`
Expected: PASS, 29 tests passed.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/__tests__/MatchingEngine.test.ts
git commit -m "test(server): add total + breakdown cases to MatchingEngine"
```

---

### Task 8: Config Customization

**Files:**
- Modify: `server/src/services/__tests__/MatchingEngine.test.ts` (append a new `describe` block)

- [ ] **Step 1: Append the Config Customization describe block**

```ts
describe('MatchingEngine.scoreMatch — config customization', () => {
  it('wider amount_percent admits diffs that would otherwise be outside tolerance', () => {
    // With default 1% tolerance, diff=4 on amount=100 → 0.
    // With 5% tolerance, threshold = 5, score = 40 * (1 - 4/5) = 8
    const config: MatchingConfig = {
      weights: { ...DEFAULT_WEIGHTS },
      tolerances: { ...DEFAULT_TOLERANCES, amount_percent: 0.05 },
    }
    const anchor = makeTx({ amount_gross: '100' })
    const claim = makeTx({ id: 2, amount_gross: '104' })
    const score = engine.scoreMatch(anchor, claim, config)
    expect(score.breakdown.amount).toBe(8)
  })

  it('wider time_window_ms admits time diffs that would otherwise be outside', () => {
    // Default window = 3_600_000, diff = 5_400_000 → 0
    // Doubled window = 7_200_000 → 20 * (1 - 5_400_000/7_200_000) = 20 * 0.25 = 5
    const config: MatchingConfig = {
      weights: { ...DEFAULT_WEIGHTS },
      tolerances: { ...DEFAULT_TOLERANCES, time_window_ms: 7_200_000 },
    }
    const anchor = makeTx({ timestamp: '1000000' })
    const claim = makeTx({ id: 2, timestamp: '6400000' })
    const score = engine.scoreMatch(anchor, claim, config)
    expect(score.breakdown.time).toBe(5)
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:server -- --run`
Expected: PASS, 31 tests passed.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/__tests__/MatchingEngine.test.ts
git commit -m "test(server): add config customization cases to MatchingEngine"
```

---

### Task 9: Final Verification

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Run the full backend test suite from a clean state**

Run from repo root: `npm run test:server -- --run`
Expected: 31 tests passed, 0 failed. Output should show 8 `describe` blocks.

- [ ] **Step 2: Confirm no production-code drift**

Run: `git status` and `git diff -- server/src/services/MatchingEngine.ts`
Expected: clean (no changes outside the new test file).

- [ ] **Step 3: Confirm spec is satisfied**

Cross-check against `docs/superpowers/specs/2026-05-26-matching-engine-tests-design.md`. Every one of the 7 test groups in the spec must map to a `describe` block in the test file (plus the smoke block). If any group is missing, return to that task.

No commit needed at this step unless previous tasks were skipped.

---

## Summary

- 9 tasks, 1 new file.
- ~31 `it()` cases across 8 `describe` blocks (smoke + 7 spec groups).
- Zero production-code changes.
- Each task: append a describe block → run → commit. Safe to dispatch task-by-task.
