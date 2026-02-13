// DexScreener API types & utilities

interface TxnBuySell { buys: number; sells: number }

export interface DexPairRaw {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    m5?: TxnBuySell
    h1?: TxnBuySell
    h6?: TxnBuySell
    h24: TxnBuySell
  }
  volume: {
    m5?: number
    h1?: number
    h6?: number
    h24: number
  }
  priceChange: {
    m5?: number
    h1?: number
    h6?: number
    h24: number
  }
  liquidity?: {
    usd: number
    base?: number
    quote?: number
  }
  fdv?: number
  marketCap?: number
  pairCreatedAt?: number
  info?: {
    imageUrl?: string
    header?: string
    websites?: { url: string; label: string }[]
    socials?: { url: string; type: string }[]
  }
}

export interface DexSearchResponse {
  pairs: DexPairRaw[] | null
}

export interface TimeframeData {
  m5: number
  h1: number
  h6: number
  h24: number
}

export interface MemecoinPair {
  pairAddress: string
  tokenAddress: string
  url: string
  tokenName: string
  tokenSymbol: string
  priceUsd: string
  priceNative: string
  quoteSymbol: string
  priceChange: TimeframeData
  volume: TimeframeData
  buys: TimeframeData
  sells: TimeframeData
  liquidity: number
  marketCap: number
  fdv: number
  pairCreatedAt: number
  imageUrl: string | null
  headerUrl: string | null
  websites: { url: string; label: string }[]
  socials: { url: string; type: string }[]
  chainId: string
  dexId: string
  // Convenience aliases (backward compat with cards)
  priceChange24h: number
  volume24h: number
  buys24h: number
  sells24h: number
}

export function mapDexPairToMemecoinPair(raw: DexPairRaw): MemecoinPair {
  const priceChange: TimeframeData = {
    m5: raw.priceChange?.m5 ?? 0,
    h1: raw.priceChange?.h1 ?? 0,
    h6: raw.priceChange?.h6 ?? 0,
    h24: raw.priceChange?.h24 ?? 0,
  }
  const volume: TimeframeData = {
    m5: raw.volume?.m5 ?? 0,
    h1: raw.volume?.h1 ?? 0,
    h6: raw.volume?.h6 ?? 0,
    h24: raw.volume?.h24 ?? 0,
  }
  const buys: TimeframeData = {
    m5: raw.txns?.m5?.buys ?? 0,
    h1: raw.txns?.h1?.buys ?? 0,
    h6: raw.txns?.h6?.buys ?? 0,
    h24: raw.txns?.h24?.buys ?? 0,
  }
  const sells: TimeframeData = {
    m5: raw.txns?.m5?.sells ?? 0,
    h1: raw.txns?.h1?.sells ?? 0,
    h6: raw.txns?.h6?.sells ?? 0,
    h24: raw.txns?.h24?.sells ?? 0,
  }

  return {
    pairAddress: raw.pairAddress,
    tokenAddress: raw.baseToken.address,
    url: raw.url,
    tokenName: raw.baseToken.name,
    tokenSymbol: raw.baseToken.symbol,
    priceUsd: raw.priceUsd,
    priceNative: raw.priceNative ?? '0',
    quoteSymbol: raw.quoteToken?.symbol ?? 'SOL',
    priceChange,
    volume,
    buys,
    sells,
    liquidity: raw.liquidity?.usd ?? 0,
    marketCap: raw.marketCap ?? raw.fdv ?? 0,
    fdv: raw.fdv ?? 0,
    pairCreatedAt: raw.pairCreatedAt ?? 0,
    imageUrl: raw.info?.imageUrl ?? null,
    headerUrl: raw.info?.header ?? null,
    websites: raw.info?.websites ?? [],
    socials: raw.info?.socials ?? [],
    chainId: raw.chainId,
    dexId: raw.dexId,
    // Convenience aliases
    priceChange24h: priceChange.h24,
    volume24h: volume.h24,
    buys24h: buys.h24,
    sells24h: sells.h24,
  }
}

export function formatAge(timestamp: number): string {
  if (!timestamp) return 'Unknown'
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function formatMemePrice(priceUsd: string): string {
  const num = parseFloat(priceUsd)
  if (isNaN(num)) return '$0'
  if (num >= 1) return `$${num.toFixed(2)}`
  if (num >= 0.01) return `$${num.toFixed(4)}`
  // Handle tiny prices like 0.00000234
  const str = num.toFixed(20)
  const match = str.match(/^0\.(0+)/)
  if (match) {
    const zeros = match[1].length
    const significant = num.toFixed(zeros + 3).replace(/0+$/, '')
    return `$${significant}`
  }
  return `$${num.toFixed(6)}`
}
