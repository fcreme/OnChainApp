import { create } from 'zustand'
import type { MarketCoin, CoinGeckoMarket } from '../lib/coingecko'
import { mapCoinGeckoToMarketCoin } from '../lib/coingecko'

export type MarketSortMode = 'rank' | 'gainers' | 'losers' | 'volume'

interface MarketsStore {
  coins: MarketCoin[]
  prevPrices: Record<string, number>
  isLoading: boolean
  error: string | null
  searchQuery: string
  sortMode: MarketSortMode
  lastUpdated: number | null
  hasFetchedOnce: boolean
  fetchMarkets: () => Promise<void>
  setSearchQuery: (q: string) => void
  setSortMode: (mode: MarketSortMode) => void
}

const API_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h,24h,7d'

function buildPrevPrices(coins: MarketCoin[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const c of coins) {
    map[c.id] = c.price
  }
  return map
}

export const useMarketsStore = create<MarketsStore>((set, get) => ({
  coins: [],
  prevPrices: {},
  isLoading: false,
  error: null,
  searchQuery: '',
  sortMode: 'rank',
  lastUpdated: null,
  hasFetchedOnce: false,

  fetchMarkets: async () => {
    const { hasFetchedOnce, coins: currentCoins } = get()
    if (!hasFetchedOnce) {
      set({ isLoading: true, error: null })
    }

    try {
      let res = await fetch(API_URL)
      // Retry once on rate limit after 3s
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 3000))
        res = await fetch(API_URL)
      }
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data: CoinGeckoMarket[] = await res.json()
      const coins = data.map(mapCoinGeckoToMarketCoin)

      set({
        prevPrices: buildPrevPrices(currentCoins),
        coins,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
        hasFetchedOnce: true,
      })
    } catch (err) {
      // If we already have data, silently keep it instead of showing error
      if (currentCoins.length > 0) {
        set({ isLoading: false, hasFetchedOnce: true })
      } else {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch markets',
          hasFetchedOnce: true,
        })
      }
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortMode: (mode) => set({ sortMode: mode }),
}))
