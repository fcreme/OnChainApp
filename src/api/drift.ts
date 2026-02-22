import { api } from './client'

export interface DriftResponse {
  wallet_address: string
  token_symbol: string
  internal_balance: string
  onchain_balance: string
  drift: string
  drift_percentage: number
  alert_level: 'none' | 'warning' | 'critical'
  last_updated: string
}

export interface WalletRiskResponse {
  wallet_address: string
  risk_score: number
  risk_breakdown: {
    new_counterparty: number
    amount_anomaly: number
    new_token: number
    time_anomaly: number
  }
  metadata: {
    mean_amount: number
    std_dev: number
    total_txs: number
    unique_counterparties: number
    unique_tokens: number
  }
  last_calculated: string
}

// ── Drift ──

export async function fetchDrifts() {
  return api.get<{ drifts: DriftResponse[] }>('/drift')
}

export async function fetchWalletDrift(wallet: string) {
  return api.get<{ drifts: DriftResponse[] }>(`/drift/${wallet}`)
}

export async function syncDrift() {
  return api.post<{ synced: number; drifts: DriftResponse[] }>('/drift/sync')
}

// ── Risk ──

export async function fetchRiskScores() {
  return api.get<{ scores: WalletRiskResponse[] }>('/risk')
}

export async function fetchWalletRisk(wallet: string) {
  return api.get<WalletRiskResponse>(`/risk/${wallet}`)
}

export async function recalculateRisk() {
  return api.post<{ recalculated: number; scores: WalletRiskResponse[] }>('/risk/recalculate')
}
