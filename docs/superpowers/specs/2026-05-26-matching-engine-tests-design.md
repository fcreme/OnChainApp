# Matching Engine — Unit Test Coverage

**Date:** 2026-05-26
**Status:** Approved
**Scope:** Add deep unit tests for `MatchingEngine.scoreMatch()` in `server/src/services/MatchingEngine.ts`.

## Motivation

The `MatchingEngine` is the algorithmic core of the reconciliation system: it produces the confidence scores that drive every match suggestion. A silent bug here would corrupt reconciliations and the audit trail without ever raising an error.

The backend currently has zero test files. The frontend has ~12 test files but none touch the matching algorithm. This spec establishes the backend test pattern by covering the pure scoring function exhaustively, before broadening to other services.

## Goals

- Cover every branch in `scoreMatch()` with explicit, named cases.
- Verify exact math on linear-decay components (not just "score > 0").
- Verify the gas-aware net-amount path picks max(gross_score, net_score).
- Document current behaviors that are subtle (case-insensitive addresses, case-sensitive token symbols).
- Establish the file/folder pattern for future backend tests.

## Non-Goals

- Testing `loadConfig()` — trivial DB fetch with fallback; covered later if needed.
- Testing `generateSuggestions()` — DB orchestration; requires mocking pg-promise or a real test DB. Out of scope for this pass.
- Testing other backend services (Reconciliation, Drift, Risk, Audit, Transaction, BlockchainSync).
- Frontend tests, E2E tests, or CI configuration changes.
- Modifying production code in `MatchingEngine.ts`.

## Approach

### File Layout

```
server/src/services/__tests__/MatchingEngine.test.ts
```

Co-located `__tests__` folder per service, matching the frontend convention (`src/stores/__tests__/`, `src/hooks/__tests__/`).

### Tooling

- **Vitest** (already in `server/package.json` devDependencies; `test` script already wired).
- Run via `npm run test:server` from the repo root, or `npm test` from `server/`.
- No new dependencies.

### Test Helper

A single inline factory `makeTx(overrides: Partial<TransactionRow>): TransactionRow` returns a fully-populated `TransactionRow` with sensible defaults. Each test overrides only the fields it cares about.

A `defaultConfig` constant built from `DEFAULT_WEIGHTS` and `DEFAULT_TOLERANCES` is reused across tests; tests that need different weights/tolerances build their own.

## Test Groups

### 1. Amount Scoring
- Exact match (zero diff) → full `weights.amount` (40 with defaults).
- Diff at tolerance boundary (`amtDiff == amtThreshold`) → 0 amount points (per code: `amountScore = 40 * (1 - 1) = 0`).
- Diff inside tolerance (e.g. half-tolerance) → exact linear-decay value (`40 * 0.5 = 20`).
- Diff just outside tolerance → 0.
- Zero anchor amount + zero diff → falls into `amtDiff === 0` branch → full amount weight.
- Zero anchor amount + non-zero diff → 0 (since `amtThreshold = 0`, neither branch fires).

### 2. Gas-Aware Amount
- `amount_net` + `gas_used` both present, net matches better → net score wins.
- `amount_net` + `gas_used` both present, net matches worse → gross score wins (via `Math.max`).
- `amount_net` present but `gas_used` null → gas-aware branch skipped, uses gross.
- `amount_net` null → gas-aware branch skipped.

### 3. Address Scoring
- Sender + receiver both match → full `weights.address` (30).
- Sender match only → `weights.address * 0.5` (15).
- Receiver match only → 15.
- Neither match → 0.
- Case-insensitive: `0xABC...` matches `0xabc...` on either side.
- Null sender on one side → that half contributes 0; other half still scores if matching.
- Null receiver on one side → same.

### 4. Time Scoring
- Zero diff → full `weights.time` (20).
- Diff equal to `time_window_ms` → 0 (boundary, `20 * (1 - 1) = 0`).
- Diff at half window → `weights.time * 0.5` (10).
- Diff outside window → 0.

### 5. Token Scoring
- Same `token_symbol` → full `weights.token` (10).
- Different symbol → 0.
- Case-sensitive: `'USDC'` vs `'usdc'` → 0 (documents current behavior; if we want case-insensitive, that's a code change, not a test change).

### 6. Total + Breakdown
- Total equals sum of components.
- Total and each breakdown value rounded to 2 decimal places.
- Perfect match across all four factors with default weights → total = 100.
- Custom weights (e.g. `amount: 50, address: 20, time: 20, token: 10`) → max amount component capped at 50.

### 7. Config Customization
- Custom `amount_percent` (e.g. 0.05 = 5%) widens the tolerance band; a 4% diff now scores > 0.
- Custom `time_window_ms` (e.g. doubled) widens the time band; a diff that was outside is now inside.

## Acceptance Criteria

- `npm run test:server` passes from a clean checkout.
- File `server/src/services/__tests__/MatchingEngine.test.ts` exists, ~30–40 `it()` cases organized into the 7 `describe` blocks above.
- Zero changes to `server/src/services/MatchingEngine.ts` or any other production file.
- No new dependencies in any `package.json`.

## Risks / Open Questions

- **Floating-point math on linear decay.** The code uses plain JS math + a `round(n, 2)` helper. Tests should assert against the rounded values that match the helper, not against raw decimals. Use `toBeCloseTo` only if explicit rounding doesn't cover it.
- **Behavioral assumptions.** Two current behaviors are subtle and the tests pin them down (rather than assert what we wish they were):
  - Amount diff *at* tolerance boundary → 0 (not partial credit).
  - Token symbol comparison is case-sensitive.
  If either is wrong, that's a separate fix — not part of this test pass.

## Out-of-Scope Follow-Ups

- `generateSuggestions()` integration tests (mock-pg or real test DB).
- `ReconciliationService` state-machine tests.
- `DriftService` and `RiskScoringService` unit tests.
- E2E Cypress flow: import claim → run matching → approve → verify status.
