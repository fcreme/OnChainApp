import { create } from 'zustand'
import type { TokenRiskResult } from '../lib/logisticRegression'
import { scoreAllTokens } from '../lib/logisticRegression'
import { useMemecoinStore } from './useMemecoinStore'

export type RiskFilter = 'all' | 'safe' | 'medium' | 'high'
export type SortField = 'score' | 'name' | 'tokenAge'

interface AnalysisStore {
  results: TokenRiskResult[]
  selectedToken: TokenRiskResult | null
  searchQuery: string
  riskFilter: RiskFilter
  sortField: SortField
  sortDirection: 'asc' | 'desc'
  lastAnalyzed: number | null
  runAnalysis: () => void
  setSelectedToken: (token: TokenRiskResult | null) => void
  setSearchQuery: (q: string) => void
  setRiskFilter: (filter: RiskFilter) => void
  setSortField: (field: SortField) => void
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  results: [],
  selectedToken: null,
  searchQuery: '',
  riskFilter: 'all',
  sortField: 'score',
  sortDirection: 'desc',
  lastAnalyzed: null,

  runAnalysis: () => {
    const pairs = useMemecoinStore.getState().pairs
    const results = scoreAllTokens(pairs)
    set({ results, lastAnalyzed: Date.now() })
  },

  setSelectedToken: (token) => set({ selectedToken: token }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setRiskFilter: (filter) => set({ riskFilter: filter }),

  setSortField: (field) => {
    const { sortField, sortDirection } = get()
    if (sortField === field) {
      set({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc' })
    } else {
      set({ sortField: field, sortDirection: 'desc' })
    }
  },
}))
