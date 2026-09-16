import { describe, it, expect, beforeEach } from 'vitest'
import { DriftService, evaluateDrift } from '../DriftService.js'
import { db } from '../../config/database.js'
import { DEFAULT_DRIFT_THRESHOLDS, SEPOLIA_TOKENS } from '../../config/constants.js'
import { resetDatabase, insertClaim, WALLET_A, WALLET_B } from '../../test/db.js'

const thresholds = { ...DEFAULT_DRIFT_THRESHOLDS }

// A stand-in for the viem public client: returns raw token units, like the real RPC.
function readerReturning(rawUnits: bigint) {
  return { readContract: async () => rawUnits }
}

function readerThrowing(message = 'RPC unreachable') {
  return {
    readContract: async () => {
      throw new Error(message)
    },
  }
}

// Reconciled credit of `amount` DAI into WALLET_A, so the internal balance is +amount.
function creditWalletA(amount: string) {
  return insertClaim({
    status: 'reconciled',
    token_symbol: 'DAI',
    amount_gross: amount,
    sender_address: WALLET_B,
    receiver_address: WALLET_A,
  })
}

function walletBalanceRow(wallet: string, token: string) {
  return db.oneOrNone<{
    internal_balance: string
    onchain_balance: string
    drift: string
    drift_percentage: string
  }>(
    'SELECT * FROM wallet_balances WHERE LOWER(wallet_address) = LOWER($1) AND token_symbol = $2',
    [wallet, token],
  )
}

describe('evaluateDrift', () => {
  it('reports a wallet holding nothing against a non-zero ledger as -100% critical', () => {
    const result = evaluateDrift(0, 1000, thresholds)
    expect(result.drift).toBe(-1000)
    expect(result.drift_percentage).toBe(-100)
    expect(result.alert_level).toBe('critical')
  })

  it('reports no drift when the balances agree', () => {
    const result = evaluateDrift(1000, 1000, thresholds)
    expect(result.drift).toBe(0)
    expect(result.drift_percentage).toBe(0)
    expect(result.alert_level).toBe('none')
  })

  it('warns at a 1% shortfall', () => {
    const result = evaluateDrift(990, 1000, thresholds)
    expect(result.drift).toBe(-10)
    expect(result.drift_percentage).toBeCloseTo(-1, 10)
    expect(result.alert_level).toBe('warning')
  })

  it('escalates a 6% shortfall to critical', () => {
    const result = evaluateDrift(940, 1000, thresholds)
    expect(result.drift).toBe(-60)
    expect(result.drift_percentage).toBeCloseTo(-6, 10)
    expect(result.alert_level).toBe('critical')
  })

  it('reports no drift when both balances are zero', () => {
    const result = evaluateDrift(0, 0, thresholds)
    expect(result.drift).toBe(0)
    expect(result.drift_percentage).toBe(0)
    expect(result.alert_level).toBe('none')
  })
})

describe('DriftService.computeDrift — unreadable on-chain balance', () => {
  beforeEach(resetDatabase)

  it('rejects with a 502 ONCHAIN_READ_FAILED when the RPC read throws', async () => {
    const service = new DriftService(readerThrowing())
    await creditWalletA('1000')

    await expect(service.computeDrift(WALLET_A, 'DAI')).rejects.toMatchObject({
      statusCode: 502,
      code: 'ONCHAIN_READ_FAILED',
    })
  })

  it('writes no wallet_balances row when the RPC read throws', async () => {
    const service = new DriftService(readerThrowing())
    await creditWalletA('1000')

    await expect(service.computeDrift(WALLET_A, 'DAI')).rejects.toThrow()

    expect(await walletBalanceRow(WALLET_A, 'DAI')).toBeNull()
  })

  it('leaves the last good wallet_balances row untouched when the RPC read throws', async () => {
    const service = new DriftService(readerThrowing())
    await creditWalletA('1000')
    await db.none(
      `INSERT INTO wallet_balances (wallet_address, token_symbol, internal_balance, onchain_balance, drift, drift_percentage)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [WALLET_A, 'DAI', 1000, 1000, 0, 0],
    )

    await expect(service.computeDrift(WALLET_A, 'DAI')).rejects.toThrow()

    const row = await walletBalanceRow(WALLET_A, 'DAI')
    expect(Number(row?.onchain_balance)).toBe(1000)
    expect(Number(row?.internal_balance)).toBe(1000)
    expect(Number(row?.drift)).toBe(0)
    expect(Number(row?.drift_percentage)).toBe(0)
  })

  it('rejects with a 502 ONCHAIN_READ_FAILED for a token with no on-chain address', async () => {
    const service = new DriftService(readerReturning(0n))
    await insertClaim({
      status: 'reconciled',
      token_symbol: 'WETH',
      amount_gross: '5',
      sender_address: WALLET_B,
      receiver_address: WALLET_A,
    })

    await expect(service.computeDrift(WALLET_A, 'WETH')).rejects.toMatchObject({
      statusCode: 502,
      code: 'ONCHAIN_READ_FAILED',
    })
    expect(await walletBalanceRow(WALLET_A, 'WETH')).toBeNull()
  })
})

describe('DriftService.computeDrift — readable on-chain balance', () => {
  beforeEach(resetDatabase)

  it('stores the internal, on-chain and drift figures from a successful read', async () => {
    const service = new DriftService(readerReturning(990n * 10n ** 18n))
    await creditWalletA('1000')

    const result = await service.computeDrift(WALLET_A, 'DAI')

    expect(result).toMatchObject({
      wallet_address: WALLET_A,
      token_symbol: 'DAI',
      internal_balance: '1000',
      onchain_balance: '990',
      drift: '-10',
      drift_percentage: -1,
      alert_level: 'warning',
    })

    const row = await walletBalanceRow(WALLET_A, 'DAI')
    expect(Number(row?.internal_balance)).toBe(1000)
    expect(Number(row?.onchain_balance)).toBe(990)
    expect(Number(row?.drift)).toBe(-10)
    expect(Number(row?.drift_percentage)).toBe(-1)
  })

  it('flags an empty wallet against a non-zero ledger as critical and logs a drift_alert', async () => {
    const service = new DriftService(readerReturning(0n))
    await creditWalletA('1000')

    const result = await service.computeDrift(WALLET_A, 'DAI')

    expect(result.onchain_balance).toBe('0')
    expect(result.drift_percentage).toBe(-100)
    expect(result.alert_level).toBe('critical')

    const alerts = await db.manyOrNone<{ new_state: { alert_level: string; drift_pct: number } }>(
      "SELECT * FROM audit_log WHERE action = 'drift_alert'",
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0].new_state).toMatchObject({ alert_level: 'critical', drift_pct: -100 })
  })
})

describe('DriftService.getAll / getByWallet', () => {
  beforeEach(resetDatabase)

  it('classifies a stored percentage the same way computeDrift does', async () => {
    const service = new DriftService(readerReturning(0n))
    await db.none(
      `INSERT INTO wallet_balances (wallet_address, token_symbol, internal_balance, onchain_balance, drift, drift_percentage)
       VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)`,
      [WALLET_A, 'DAI', 1000, 0, -1000, -100, WALLET_B, 'DAI', 1000, 990, -10, -1],
    )

    const all = await service.getAll()
    expect(all.find((r) => r.wallet_address === WALLET_A)?.alert_level).toBe('critical')
    expect(all.find((r) => r.wallet_address === WALLET_B)?.alert_level).toBe('warning')

    const forA = await service.getByWallet(WALLET_A)
    expect(forA).toHaveLength(1)
    expect(forA[0].alert_level).toBe('critical')
  })
})

describe('DriftService.syncAll — reporting failures', () => {
  beforeEach(resetDatabase)

  it('reports the wallets it could not read instead of silently skipping them', async () => {
    await insertClaim({ status: 'reconciled', token_symbol: 'DAI', sender_address: null, receiver_address: WALLET_A, amount_gross: '1000' })
    const service = new DriftService({
      readContract: async () => {
        throw new Error('RPC down')
      },
    })

    const result = await service.syncAll()

    expect(result.drifts).toEqual([])
    expect(result.errors).toEqual([
      { wallet: WALLET_A, token_symbol: 'DAI', error: expect.stringContaining('Failed to fetch on-chain balance') },
    ])
  })

  it('returns the wallets it could read alongside the failures', async () => {
    await insertClaim({ status: 'reconciled', token_symbol: 'DAI', sender_address: null, receiver_address: WALLET_A, amount_gross: '1000' })
    await insertClaim({ status: 'reconciled', token_symbol: 'USDC', sender_address: null, receiver_address: WALLET_A, amount_gross: '500' })
    const service = new DriftService({
      readContract: async ({ address }) => {
        if (address === SEPOLIA_TOKENS.USDC.address) throw new Error('RPC down')
        return 1000n * 10n ** 18n
      },
    })

    const result = await service.syncAll()

    expect(result.drifts.map((d) => d.token_symbol)).toEqual(['DAI'])
    expect(result.errors.map((e) => e.token_symbol)).toEqual(['USDC'])
  })
})
