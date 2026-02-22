import { db } from '../config/database.js'
import { DEFAULT_DRIFT_THRESHOLDS, SEPOLIA_TOKENS } from '../config/constants.js'
import { auditService } from './AuditService.js'
import { createPublicClient, http, formatUnits } from 'viem'
import { sepolia } from 'viem/chains'
import { env } from '../config/env.js'

const ERC20_BALANCE_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const

export interface DriftResult {
  wallet_address: string
  token_symbol: string
  internal_balance: string
  onchain_balance: string
  drift: string
  drift_percentage: number
  alert_level: 'none' | 'warning' | 'critical'
  last_updated: string
}

export class DriftService {
  private client = createPublicClient({
    chain: sepolia,
    transport: http(env.SEPOLIA_RPC_URL),
  })

  // ── Compute drift for a single wallet+token ──
  async computeDrift(wallet: string, tokenSymbol: string): Promise<DriftResult> {
    // 1. Compute internal balance from reconciled transactions
    const internalResult = await db.one<{ balance: string }>(`
      SELECT COALESCE(SUM(
        CASE
          WHEN LOWER(receiver_address) = LOWER($1) THEN amount_gross
          WHEN LOWER(sender_address) = LOWER($1) THEN -amount_gross
          ELSE 0
        END
      ), 0) AS balance
      FROM transactions
      WHERE (LOWER(sender_address) = LOWER($1) OR LOWER(receiver_address) = LOWER($1))
        AND token_symbol = $2
        AND status IN ('reconciled', 'force_reconciled')
    `, [wallet, tokenSymbol])

    const internalBalance = Number(internalResult.balance)

    // 2. Fetch on-chain balance
    const tokenInfo = SEPOLIA_TOKENS[tokenSymbol]
    let onchainBalance = 0

    if (tokenInfo) {
      try {
        const raw = await this.client.readContract({
          address: tokenInfo.address as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: 'balanceOf',
          args: [wallet as `0x${string}`],
        })
        onchainBalance = Number(formatUnits(raw, tokenInfo.decimals))
      } catch (err) {
        console.error(`Failed to fetch on-chain balance for ${wallet}/${tokenSymbol}:`, err)
      }
    }

    // 3. Calculate drift
    const drift = onchainBalance - internalBalance
    const driftPct = onchainBalance !== 0 ? (drift / onchainBalance) * 100 : 0

    // 4. Determine alert level
    const thresholds = await this.getThresholds()
    let alertLevel: DriftResult['alert_level'] = 'none'
    if (Math.abs(driftPct) >= thresholds.critical_percent) {
      alertLevel = 'critical'
    } else if (Math.abs(driftPct) >= thresholds.alert_percent) {
      alertLevel = 'warning'
    }

    // 5. Upsert wallet_balances
    await db.none(`
      INSERT INTO wallet_balances (wallet_address, token_symbol, internal_balance, onchain_balance, drift, drift_percentage)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (wallet_address, token_symbol) DO UPDATE SET
        internal_balance = EXCLUDED.internal_balance,
        onchain_balance = EXCLUDED.onchain_balance,
        drift = EXCLUDED.drift,
        drift_percentage = EXCLUDED.drift_percentage,
        last_updated = NOW()
    `, [wallet, tokenSymbol, internalBalance, onchainBalance, drift, driftPct])

    // 6. Log drift alert if triggered
    if (alertLevel !== 'none') {
      await auditService.log(
        'drift_alert',
        'wallet_balance',
        null,
        'system',
        null,
        { wallet, token: tokenSymbol, drift, drift_pct: driftPct, alert_level: alertLevel },
      )
    }

    const row = await db.one<{ last_updated: string }>(
      'SELECT last_updated FROM wallet_balances WHERE wallet_address = $1 AND token_symbol = $2',
      [wallet, tokenSymbol],
    )

    return {
      wallet_address: wallet,
      token_symbol: tokenSymbol,
      internal_balance: internalBalance.toString(),
      onchain_balance: onchainBalance.toString(),
      drift: drift.toString(),
      drift_percentage: Math.round(driftPct * 100) / 100,
      alert_level: alertLevel,
      last_updated: row.last_updated,
    }
  }

  // ── Sync drift for all known wallets ──
  async syncAll(): Promise<DriftResult[]> {
    // Get unique wallets from transactions
    const wallets = await db.manyOrNone<{ wallet: string; token: string }>(`
      SELECT DISTINCT
        CASE WHEN sender_address IS NOT NULL THEN sender_address ELSE receiver_address END AS wallet,
        token_symbol AS token
      FROM transactions
      WHERE sender_address IS NOT NULL OR receiver_address IS NOT NULL
    `)

    const results: DriftResult[] = []
    for (const { wallet, token } of wallets) {
      try {
        const drift = await this.computeDrift(wallet, token)
        results.push(drift)
      } catch (err) {
        console.error(`Drift computation failed for ${wallet}/${token}:`, err)
      }
    }

    return results
  }

  // ── Get all drift records ──
  async getAll(): Promise<DriftResult[]> {
    const rows = await db.manyOrNone<{
      wallet_address: string
      token_symbol: string
      internal_balance: string
      onchain_balance: string
      drift: string
      drift_percentage: string
      last_updated: string
    }>('SELECT * FROM wallet_balances ORDER BY ABS(drift) DESC')

    const thresholds = await this.getThresholds()

    return rows.map((r) => {
      const pct = Number(r.drift_percentage)
      let alertLevel: DriftResult['alert_level'] = 'none'
      if (Math.abs(pct) >= thresholds.critical_percent) alertLevel = 'critical'
      else if (Math.abs(pct) >= thresholds.alert_percent) alertLevel = 'warning'

      return {
        wallet_address: r.wallet_address,
        token_symbol: r.token_symbol,
        internal_balance: r.internal_balance,
        onchain_balance: r.onchain_balance,
        drift: r.drift,
        drift_percentage: pct,
        alert_level: alertLevel,
        last_updated: r.last_updated,
      }
    })
  }

  // ── Get drift for a specific wallet ──
  async getByWallet(wallet: string): Promise<DriftResult[]> {
    const rows = await db.manyOrNone<{
      wallet_address: string
      token_symbol: string
      internal_balance: string
      onchain_balance: string
      drift: string
      drift_percentage: string
      last_updated: string
    }>('SELECT * FROM wallet_balances WHERE LOWER(wallet_address) = LOWER($1)', [wallet])

    const thresholds = await this.getThresholds()

    return rows.map((r) => {
      const pct = Number(r.drift_percentage)
      let alertLevel: DriftResult['alert_level'] = 'none'
      if (Math.abs(pct) >= thresholds.critical_percent) alertLevel = 'critical'
      else if (Math.abs(pct) >= thresholds.alert_percent) alertLevel = 'warning'

      return {
        wallet_address: r.wallet_address,
        token_symbol: r.token_symbol,
        internal_balance: r.internal_balance,
        onchain_balance: r.onchain_balance,
        drift: r.drift,
        drift_percentage: pct,
        alert_level: alertLevel,
        last_updated: r.last_updated,
      }
    })
  }

  private async getThresholds() {
    try {
      const row = await db.oneOrNone<{ value: typeof DEFAULT_DRIFT_THRESHOLDS }>(
        "SELECT value FROM matching_config WHERE key = 'drift_thresholds'",
      )
      return row?.value ?? DEFAULT_DRIFT_THRESHOLDS
    } catch {
      return DEFAULT_DRIFT_THRESHOLDS
    }
  }
}

export const driftService = new DriftService()
