import { db } from '../config/database.js'

export interface WalletRiskResult {
  wallet_address: string
  risk_score: number
  risk_breakdown: RiskBreakdown
  metadata: RiskMetadata
  last_calculated: string
}

export interface RiskBreakdown {
  new_counterparty: number
  amount_anomaly: number
  new_token: number
  time_anomaly: number
}

export interface RiskMetadata {
  mean_amount: number
  std_dev: number
  total_txs: number
  unique_counterparties: number
  unique_tokens: number
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function round(n: number, decimals: number = 2): number {
  const factor = 10 ** decimals
  return Math.round(n * factor) / factor
}

function otherParty(
  tx: { sender_address: string | null; receiver_address: string | null },
  wallet: string,
): string | null {
  const w = wallet.toLowerCase()
  if (tx.sender_address?.toLowerCase() === w) return tx.receiver_address
  if (tx.receiver_address?.toLowerCase() === w) return tx.sender_address
  return null
}

export class RiskScoringService {
  // ── Calculate risk for a single wallet ──
  async calculate(wallet: string): Promise<WalletRiskResult> {
    // Get all transactions for this wallet, ordered by timestamp desc
    const txs = await db.manyOrNone<{
      sender_address: string | null
      receiver_address: string | null
      token_symbol: string
      amount_gross: string
      timestamp: string
    }>(`
      SELECT sender_address, receiver_address, token_symbol, amount_gross, timestamp
      FROM transactions
      WHERE LOWER(sender_address) = LOWER($1) OR LOWER(receiver_address) = LOWER($1)
      ORDER BY timestamp DESC
    `, [wallet])

    const breakdown: RiskBreakdown = {
      new_counterparty: 0,
      amount_anomaly: 0,
      new_token: 0,
      time_anomaly: 0,
    }

    if (txs.length === 0) {
      await this.upsert(wallet, 0, breakdown, {
        mean_amount: 0, std_dev: 0, total_txs: 0,
        unique_counterparties: 0, unique_tokens: 0,
      })
      return this.getByWallet(wallet) as Promise<WalletRiskResult>
    }

    const latest = txs[0]
    const amounts = txs.map((t) => Number(t.amount_gross))
    const m = mean(amounts)
    const s = stddev(amounts)

    // Build history sets (excluding latest tx)
    const historicalTxs = txs.slice(1)
    const knownCounterparties = new Set(
      historicalTxs.map((t) => otherParty(t, wallet)?.toLowerCase()).filter(Boolean),
    )
    const knownTokens = new Set(historicalTxs.map((t) => t.token_symbol))

    let score = 0

    // Factor 1: New counterparty (+30)
    const latestCounterparty = otherParty(latest, wallet)?.toLowerCase()
    if (latestCounterparty && historicalTxs.length > 0 && !knownCounterparties.has(latestCounterparty)) {
      breakdown.new_counterparty = 30
      score += 30
    }

    // Factor 2: Amount anomaly — z-score scaled to max 30
    if (s > 0) {
      const z = Math.abs((Number(latest.amount_gross) - m) / s)
      const anomalyScore = Math.min(30, round((z / 3) * 30))
      breakdown.amount_anomaly = anomalyScore
      score += anomalyScore
    }

    // Factor 3: New token (+20)
    if (historicalTxs.length > 0 && !knownTokens.has(latest.token_symbol)) {
      breakdown.new_token = 20
      score += 20
    }

    // Factor 4: Time anomaly — unusual hour UTC (+20)
    const hour = new Date(Number(latest.timestamp)).getUTCHours()
    if (hour >= 1 && hour <= 5) {
      breakdown.time_anomaly = 20
      score += 20
    }

    const finalScore = Math.min(round(score), 100)

    const metadata: RiskMetadata = {
      mean_amount: round(m),
      std_dev: round(s),
      total_txs: txs.length,
      unique_counterparties: knownCounterparties.size + (latestCounterparty ? 1 : 0),
      unique_tokens: new Set(txs.map((t) => t.token_symbol)).size,
    }

    await this.upsert(wallet, finalScore, breakdown, metadata)

    return {
      wallet_address: wallet,
      risk_score: finalScore,
      risk_breakdown: breakdown,
      metadata,
      last_calculated: new Date().toISOString(),
    }
  }

  // ── Get risk score for a wallet ──
  async getByWallet(wallet: string): Promise<WalletRiskResult | null> {
    const row = await db.oneOrNone<{
      wallet_address: string
      risk_score: string
      risk_breakdown: RiskBreakdown
      metadata: RiskMetadata
      last_calculated: string
    }>('SELECT * FROM wallet_risk_scores WHERE LOWER(wallet_address) = LOWER($1)', [wallet])

    if (!row) return null

    return {
      wallet_address: row.wallet_address,
      risk_score: Number(row.risk_score),
      risk_breakdown: row.risk_breakdown,
      metadata: row.metadata,
      last_calculated: row.last_calculated,
    }
  }

  // ── Get all risk scores ──
  async getAll(): Promise<WalletRiskResult[]> {
    const rows = await db.manyOrNone<{
      wallet_address: string
      risk_score: string
      risk_breakdown: RiskBreakdown
      metadata: RiskMetadata
      last_calculated: string
    }>('SELECT * FROM wallet_risk_scores ORDER BY risk_score DESC')

    return rows.map((r) => ({
      wallet_address: r.wallet_address,
      risk_score: Number(r.risk_score),
      risk_breakdown: r.risk_breakdown,
      metadata: r.metadata,
      last_calculated: r.last_calculated,
    }))
  }

  // ── Recalculate all ──
  async recalculateAll(): Promise<WalletRiskResult[]> {
    const wallets = await db.manyOrNone<{ wallet: string }>(`
      SELECT DISTINCT
        CASE WHEN sender_address IS NOT NULL THEN sender_address ELSE receiver_address END AS wallet
      FROM transactions
      WHERE sender_address IS NOT NULL OR receiver_address IS NOT NULL
    `)

    const results: WalletRiskResult[] = []
    for (const { wallet } of wallets) {
      try {
        const result = await this.calculate(wallet)
        results.push(result)
      } catch (err) {
        console.error(`Risk calculation failed for ${wallet}:`, err)
      }
    }
    return results
  }

  private async upsert(
    wallet: string,
    score: number,
    breakdown: RiskBreakdown,
    metadata: RiskMetadata,
  ) {
    await db.none(`
      INSERT INTO wallet_risk_scores (wallet_address, risk_score, risk_breakdown, metadata)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (wallet_address) DO UPDATE SET
        risk_score = EXCLUDED.risk_score,
        risk_breakdown = EXCLUDED.risk_breakdown,
        metadata = EXCLUDED.metadata,
        last_calculated = NOW()
    `, [wallet, score, JSON.stringify(breakdown), JSON.stringify(metadata)])
  }
}

export const riskScoringService = new RiskScoringService()
