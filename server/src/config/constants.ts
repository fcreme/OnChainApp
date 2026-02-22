export const DEFAULT_WEIGHTS = {
  amount: 40,
  address: 30,
  time: 20,
  token: 10,
} as const

export const DEFAULT_TOLERANCES = {
  amount_percent: 0.01,
  time_window_ms: 3_600_000,
  block_window: 100,
} as const

export const DEFAULT_DRIFT_THRESHOLDS = {
  alert_percent: 1.0,
  critical_percent: 5.0,
} as const

export const SEPOLIA_TOKENS: Record<string, { address: string; decimals: number }> = {
  DAI: { address: '0x1D70D57ccD2798323232B2dD027B3aBcA5C00091', decimals: 18 },
  USDC: { address: '0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47', decimals: 6 },
}

export const PAGINATION = {
  defaultLimit: 50,
  maxLimit: 200,
} as const
