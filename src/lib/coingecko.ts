// CoinGecko API types & utilities (free tier, no key needed)

export interface CoinGeckoMarket {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number | null
  fully_diluted_valuation: number | null
  total_volume: number
  high_24h: number | null
  low_24h: number | null
  price_change_24h: number | null
  price_change_percentage_24h: number | null
  price_change_percentage_1h_in_currency?: number | null
  price_change_percentage_7d_in_currency?: number | null
  circulating_supply: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  last_updated: string
}

export interface MarketCoin {
  id: string
  symbol: string
  name: string
  image: string
  price: number
  marketCap: number
  rank: number
  fdv: number
  volume24h: number
  high24h: number
  low24h: number
  priceChange24h: number
  priceChangePct24h: number
  priceChangePct1h: number
  priceChangePct7d: number
  circulatingSupply: number
  totalSupply: number | null
  maxSupply: number | null
  ath: number
  athChangePct: number
  athDate: string
  lastUpdated: string
}

export function mapCoinGeckoToMarketCoin(raw: CoinGeckoMarket): MarketCoin {
  return {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    image: raw.image,
    price: raw.current_price,
    marketCap: raw.market_cap,
    rank: raw.market_cap_rank ?? 0,
    fdv: raw.fully_diluted_valuation ?? 0,
    volume24h: raw.total_volume,
    high24h: raw.high_24h ?? 0,
    low24h: raw.low_24h ?? 0,
    priceChange24h: raw.price_change_24h ?? 0,
    priceChangePct24h: raw.price_change_percentage_24h ?? 0,
    priceChangePct1h: raw.price_change_percentage_1h_in_currency ?? 0,
    priceChangePct7d: raw.price_change_percentage_7d_in_currency ?? 0,
    circulatingSupply: raw.circulating_supply,
    totalSupply: raw.total_supply,
    maxSupply: raw.max_supply,
    ath: raw.ath,
    athChangePct: raw.ath_change_percentage,
    athDate: raw.ath_date,
    lastUpdated: raw.last_updated,
  }
}

export function formatPrice(value: number): string {
  if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  const str = value.toFixed(20)
  const match = str.match(/^0\.(0+)/)
  if (match) {
    const zeros = match[1].length
    return `$${value.toFixed(zeros + 3).replace(/0+$/, '')}`
  }
  return `$${value.toFixed(6)}`
}

export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function formatSupply(value: number, symbol: string): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B ${symbol.toUpperCase()}`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M ${symbol.toUpperCase()}`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K ${symbol.toUpperCase()}`
  return `${value.toLocaleString()} ${symbol.toUpperCase()}`
}
