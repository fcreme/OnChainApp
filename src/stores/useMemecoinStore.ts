import { create } from 'zustand'
import type { MemecoinPair, DexSearchResponse, DexPairRaw } from '../lib/dexscreener'
import { mapDexPairToMemecoinPair } from '../lib/dexscreener'

export type SortMode = 'trending' | 'newest' | 'volume' | 'marketCap'

interface MemecoinStore {
  pairs: MemecoinPair[]
  /** Previous price per pairAddress — used to detect up/down changes */
  prevPrices: Record<string, string>
  isLoading: boolean
  error: string | null
  searchQuery: string
  sortMode: SortMode
  lastUpdated: number | null
  hasFetchedOnce: boolean
  fetchMemecoins: () => Promise<void>
  refreshPairs: () => Promise<void>
  setSearchQuery: (q: string) => void
  setSortMode: (mode: SortMode) => void
}

const SEARCH_QUERIES = ['pump solana', 'solana meme', 'SOL trending']
const API_BASE = 'https://api.dexscreener.com/latest/dex/search?q='
const PAIRS_API = 'https://api.dexscreener.com/latest/dex/pairs/solana/'

function buildPrevPrices(pairs: MemecoinPair[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const p of pairs) {
    map[p.pairAddress] = p.priceUsd
  }
  return map
}

export const useMemecoinStore = create<MemecoinStore>((set, get) => ({
  pairs: [],
  prevPrices: {},
  isLoading: false,
  error: null,
  searchQuery: '',
  sortMode: 'trending',
  lastUpdated: null,
  hasFetchedOnce: false,

  fetchMemecoins: async () => {
    const { hasFetchedOnce, pairs: currentPairs } = get()
    if (!hasFetchedOnce) {
      set({ isLoading: true, error: null })
    }

    try {
      const results = await Promise.all(
        SEARCH_QUERIES.map(async (q) => {
          const res = await fetch(`${API_BASE}${encodeURIComponent(q)}`)
          if (!res.ok) throw new Error(`API error: ${res.status}`)
          const data: DexSearchResponse = await res.json()
          return data.pairs ?? []
        })
      )

      const allPairs: DexPairRaw[] = results.flat()
      const solanaPairs = allPairs.filter((p) => p.chainId === 'solana')
      const seen = new Set<string>()
      const unique: MemecoinPair[] = []
      for (const raw of solanaPairs) {
        if (!seen.has(raw.pairAddress)) {
          seen.add(raw.pairAddress)
          unique.push(mapDexPairToMemecoinPair(raw))
        }
      }

      set({
        prevPrices: buildPrevPrices(currentPairs),
        pairs: unique,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
        hasFetchedOnce: true,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch memecoins',
        hasFetchedOnce: true,
      })
    }
  },

  /** Fast refresh using the pairs endpoint — takes known pair addresses, batches them */
  refreshPairs: async () => {
    const { pairs: currentPairs } = get()
    if (currentPairs.length === 0) return

    try {
      // DexScreener pairs endpoint accepts up to 30 addresses comma-separated
      const addresses = currentPairs.map((p) => p.pairAddress)
      const batches: string[][] = []
      for (let i = 0; i < addresses.length; i += 30) {
        batches.push(addresses.slice(i, i + 30))
      }

      const results = await Promise.all(
        batches.map(async (batch) => {
          const res = await fetch(`${PAIRS_API}${batch.join(',')}`)
          if (!res.ok) throw new Error(`${res.status}`)
          const data = await res.json()
          return (data.pairs ?? []) as DexPairRaw[]
        })
      )

      const rawPairs = results.flat()
      const updated = new Map<string, MemecoinPair>()
      for (const raw of rawPairs) {
        updated.set(raw.pairAddress, mapDexPairToMemecoinPair(raw))
      }

      // Merge: update existing pairs in-place, keep order
      const merged = currentPairs.map((p) => updated.get(p.pairAddress) ?? p)

      set({
        prevPrices: buildPrevPrices(currentPairs),
        pairs: merged,
        lastUpdated: Date.now(),
      })
    } catch {
      // Silent fail on fast refresh — don't show error for background updates
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortMode: (mode) => set({ sortMode: mode }),
}))
