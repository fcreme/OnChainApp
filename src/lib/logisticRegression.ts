import type { MemecoinPair } from './dexscreener'

export interface FeatureVector {
  liquidityMcapRatio: number
  tokenAgeHours: number
  volumeMcapRatio: number
  hasWebsite: number
  hasSocials: number
  priceVolatility: number
  sellPressure: number
}

export interface TokenRiskResult {
  pairAddress: string
  tokenName: string
  tokenSymbol: string
  imageUrl: string | null
  url: string
  score: number // 0-100
  riskLevel: 'safe' | 'medium' | 'high'
  zScore: number
  features: FeatureVector
  contributions: Record<keyof FeatureVector, number>
}

export const FEATURE_LABELS: Record<keyof FeatureVector, string> = {
  liquidityMcapRatio: 'Liquidity / MCap',
  tokenAgeHours: 'Token Age',
  volumeMcapRatio: 'Volume / MCap',
  hasWebsite: 'Has Website',
  hasSocials: 'Has Socials',
  priceVolatility: 'Price Volatility',
  sellPressure: 'Sell Pressure',
}

// Pre-tuned weights: positive = increases risk, negative = decreases risk
// All features are normalized to 0-1 so weights are directly comparable
export const WEIGHTS: Record<keyof FeatureVector, number> = {
  liquidityMcapRatio: -3.0,
  tokenAgeHours: -1.5,
  volumeMcapRatio: 2.5,
  hasWebsite: -1.2,
  hasSocials: -1.0,
  priceVolatility: 2.0,
  sellPressure: 3.5,
}

// Bias of 0 means a token with all-zero features scores exactly 50% (neutral)
export const BIAS = 0

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z))
}

export function extractFeatures(pair: MemecoinPair): FeatureVector {
  const totalTxns = pair.buys24h + pair.sells24h

  // Liquidity/MCap: missing mcap is a red flag → 0 means no safety signal from liquidity
  // so the -3.0 weight contributes nothing, letting other risk factors dominate
  const hasMcapData = pair.marketCap > 0
  const liquidityMcapRatio = hasMcapData
    ? Math.min(pair.liquidity / pair.marketCap, 1)
    : 0

  const tokenAgeHours = pair.pairCreatedAt > 0
    ? (Date.now() - pair.pairCreatedAt) / 3_600_000
    : 0
  // Normalize age: cap at 720h (30 days) and scale 0-1
  const normalizedAge = Math.min(tokenAgeHours / 720, 1)

  // Volume/MCap: missing mcap → treat as high activity ratio (suspicious)
  const volumeMcapRatio = hasMcapData
    ? Math.min(pair.volume24h / pair.marketCap, 1)
    : 1

  const hasWebsite = pair.websites.length > 0 ? 1 : 0
  const hasSocials = pair.socials.length > 0 ? 1 : 0

  // Price volatility: blend h1/h6/h24 for a more stable signal than h1 alone
  const volH1 = Math.min(Math.abs(pair.priceChange.h1) / 100, 1)
  const volH6 = Math.min(Math.abs(pair.priceChange.h6) / 100, 1)
  const volH24 = Math.min(Math.abs(pair.priceChange.h24) / 100, 1)
  const priceVolatility = 0.2 * volH1 + 0.3 * volH6 + 0.5 * volH24

  // Sell pressure: no transactions → no data, default to 0 (neutral, let other features decide)
  const sellPressure = totalTxns > 0 ? pair.sells24h / totalTxns : 0

  return {
    liquidityMcapRatio,
    tokenAgeHours: normalizedAge,
    volumeMcapRatio,
    hasWebsite,
    hasSocials,
    priceVolatility,
    sellPressure,
  }
}

export function scoreToken(pair: MemecoinPair): TokenRiskResult {
  const features = extractFeatures(pair)
  const keys = Object.keys(WEIGHTS) as (keyof FeatureVector)[]

  let z = BIAS
  const contributions = {} as Record<keyof FeatureVector, number>
  for (const key of keys) {
    const c = WEIGHTS[key] * features[key]
    contributions[key] = c
    z += c
  }

  const probability = sigmoid(z)
  const score = Math.round(probability * 100)
  const riskLevel: TokenRiskResult['riskLevel'] =
    score <= 33 ? 'safe' : score <= 66 ? 'medium' : 'high'

  return {
    pairAddress: pair.pairAddress,
    tokenName: pair.tokenName,
    tokenSymbol: pair.tokenSymbol,
    imageUrl: pair.imageUrl,
    url: pair.url,
    score,
    riskLevel,
    zScore: z,
    features,
    contributions,
  }
}

export function scoreAllTokens(pairs: MemecoinPair[]): TokenRiskResult[] {
  return pairs.map(scoreToken)
}

export function generateSigmoidCurveData(): { z: number; probability: number }[] {
  const points: { z: number; probability: number }[] = []
  for (let i = -6; i <= 6; i += 0.1) {
    points.push({ z: Math.round(i * 100) / 100, probability: sigmoid(i) * 100 })
  }
  return points
}

export function featureContributions(result: TokenRiskResult): {
  feature: keyof FeatureVector
  label: string
  weight: number
  value: number
  contribution: number
}[] {
  const keys = Object.keys(WEIGHTS) as (keyof FeatureVector)[]
  return keys
    .map((key) => ({
      feature: key,
      label: FEATURE_LABELS[key],
      weight: WEIGHTS[key],
      value: result.features[key],
      contribution: result.contributions[key],
    }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
}
