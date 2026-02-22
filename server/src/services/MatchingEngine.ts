import { db } from '../config/database.js'
import { DEFAULT_WEIGHTS, DEFAULT_TOLERANCES } from '../config/constants.js'
import { transactionService } from './TransactionService.js'
import { auditService } from './AuditService.js'
import type { TransactionRow, ScoreBreakdown } from '../models/Transaction.js'

export interface MatchingConfig {
  weights: { amount: number; address: number; time: number; token: number }
  tolerances: { amount_percent: number; time_window_ms: number; block_window: number }
}

export interface MatchScore {
  total: number
  breakdown: ScoreBreakdown
}

function round(n: number, decimals: number = 2): number {
  const factor = 10 ** decimals
  return Math.round(n * factor) / factor
}

function addressEq(a: string | null, b: string | null): boolean {
  if (!a || !b) return false
  return a.toLowerCase() === b.toLowerCase()
}

export class MatchingEngine {
  // ── Load config from DB or use defaults ──
  async loadConfig(): Promise<MatchingConfig> {
    try {
      const [weightsRow, tolerancesRow] = await Promise.all([
        db.oneOrNone<{ value: MatchingConfig['weights'] }>(
          "SELECT value FROM matching_config WHERE key = 'weights'",
        ),
        db.oneOrNone<{ value: MatchingConfig['tolerances'] }>(
          "SELECT value FROM matching_config WHERE key = 'tolerances'",
        ),
      ])

      return {
        weights: weightsRow?.value ?? DEFAULT_WEIGHTS,
        tolerances: tolerancesRow?.value ?? DEFAULT_TOLERANCES,
      }
    } catch {
      return { weights: { ...DEFAULT_WEIGHTS }, tolerances: { ...DEFAULT_TOLERANCES } }
    }
  }

  // ── Score a single anchor-claim pair ──
  scoreMatch(
    anchor: TransactionRow,
    claim: TransactionRow,
    config: MatchingConfig,
  ): MatchScore {
    const { weights, tolerances } = config
    const anchorAmount = Number(anchor.amount_gross)
    const claimAmount = Number(claim.amount_gross)

    // AMOUNT SCORE (0 to weights.amount)
    const amtDiff = Math.abs(anchorAmount - claimAmount)
    const amtThreshold = anchorAmount * tolerances.amount_percent
    let amountScore = 0
    if (amtThreshold > 0 && amtDiff <= amtThreshold) {
      amountScore = weights.amount * (1 - amtDiff / amtThreshold)
    } else if (amtDiff === 0) {
      amountScore = weights.amount
    }

    // Gas-aware: compare net amount if available
    if (anchor.amount_net && anchor.gas_used) {
      const netAmount = Number(anchor.amount_net)
      const netDiff = Math.abs(netAmount - claimAmount)
      if (amtThreshold > 0 && netDiff <= amtThreshold) {
        const netScore = weights.amount * (1 - netDiff / amtThreshold)
        amountScore = Math.max(amountScore, netScore)
      }
    }

    // ADDRESS SCORE (0 to weights.address)
    let addressScore = 0
    if (addressEq(anchor.sender_address, claim.sender_address)) {
      addressScore += weights.address * 0.5
    }
    if (addressEq(anchor.receiver_address, claim.receiver_address)) {
      addressScore += weights.address * 0.5
    }

    // TIME PROXIMITY SCORE (0 to weights.time)
    const anchorTs = Number(anchor.timestamp)
    const claimTs = Number(claim.timestamp)
    const timeDiff = Math.abs(anchorTs - claimTs)
    let timeScore = 0
    if (timeDiff === 0) {
      timeScore = weights.time
    } else if (timeDiff <= tolerances.time_window_ms) {
      timeScore = weights.time * (1 - timeDiff / tolerances.time_window_ms)
    }

    // TOKEN SCORE (0 or weights.token)
    const tokenScore = anchor.token_symbol === claim.token_symbol ? weights.token : 0

    const total = round(amountScore + addressScore + timeScore + tokenScore)

    return {
      total,
      breakdown: {
        amount: round(amountScore),
        address: round(addressScore),
        time: round(timeScore),
        token: round(tokenScore),
      },
    }
  }

  // ── Generate suggestions for all unmatched anchors ──
  async generateSuggestions(
    tokenFilter?: string,
    minScore: number = 70,
  ): Promise<{ new_suggestions: number; time_ms: number }> {
    const startTime = Date.now()
    const config = await this.loadConfig()

    // Get all unmatched anchors
    const anchors = await transactionService.getUnmatchedAnchors(tokenFilter)

    let newSuggestions = 0

    for (const anchor of anchors) {
      // Pre-filter candidates using indexed SQL
      const candidates = await transactionService.getCandidateClaims(
        anchor.id,
        anchor.token_symbol,
        Number(anchor.amount_gross),
        Number(anchor.timestamp),
        config.tolerances.amount_percent,
        config.tolerances.time_window_ms,
      )

      for (const claim of candidates) {
        const score = this.scoreMatch(anchor, claim, config)

        if (score.total >= minScore) {
          try {
            await db.none(
              `INSERT INTO match_suggestions (anchor_id, claim_id, score, score_breakdown)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (anchor_id, claim_id) DO UPDATE SET
                 score = EXCLUDED.score,
                 score_breakdown = EXCLUDED.score_breakdown`,
              [anchor.id, claim.id, score.total, JSON.stringify(score.breakdown)],
            )

            // Update claim status to suggested_match (only if still pending)
            await db.none(
              `UPDATE transactions SET status = 'suggested_match'
               WHERE id = $1 AND status = 'pending'`,
              [claim.id],
            )

            newSuggestions++
          } catch {
            // Skip duplicates or errors
          }
        }
      }
    }

    await auditService.log(
      'run_matching',
      'system',
      null,
      'system',
      null,
      { new_suggestions: newSuggestions, token_filter: tokenFilter ?? null, min_score: minScore },
    )

    return {
      new_suggestions: newSuggestions,
      time_ms: Date.now() - startTime,
    }
  }
}

export const matchingEngine = new MatchingEngine()
