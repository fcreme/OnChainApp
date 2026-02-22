import { create } from 'zustand'
import {
  fetchSuggestions,
  runMatching,
  approveMatch,
  rejectMatch,
  batchReconcile,
} from '../api/reconciliation'
import { fetchTransactionStats, importClaims, syncAnchors } from '../api/transactions'
import type { SuggestionResponse } from '../api/reconciliation'
import type { TransactionStats, CreateClaim } from '../api/transactions'

interface ReconciliationState {
  suggestions: SuggestionResponse[]
  stats: TransactionStats | null
  isLoading: boolean
  isLoadingStats: boolean
  isRunningMatch: boolean
  isSyncing: boolean
  error: string | null

  // Pagination
  page: number
  totalPages: number
  total: number

  // Filters
  minScore: number
  tokenFilter: string | undefined
  statusFilter: string | undefined

  // Actions
  fetchSuggestions: () => Promise<void>
  fetchStats: () => Promise<void>
  runMatching: (token?: string, minScore?: number) => Promise<{ new_suggestions: number }>
  approve: (anchorId: number, claimId: number) => Promise<void>
  forceReconcile: (anchorId: number, claimId: number) => Promise<void>
  reject: (anchorId: number, claimId: number, reason?: string) => Promise<void>
  batchApprove: (pairs: Array<{ anchor_id: number; claim_id: number }>) => Promise<{ approved: number; failed: number }>
  importClaims: (claims: CreateClaim[]) => Promise<{ imported: number; failed: number }>
  syncAnchors: () => Promise<{ imported: number }>
  setPage: (page: number) => void
  setMinScore: (score: number) => void
  setTokenFilter: (token: string | undefined) => void
  setStatusFilter: (status: string | undefined) => void
}

export const useReconciliationStore = create<ReconciliationState>((set, get) => ({
  suggestions: [],
  stats: null,
  isLoading: false,
  isLoadingStats: false,
  isRunningMatch: false,
  isSyncing: false,
  error: null,
  page: 1,
  totalPages: 1,
  total: 0,
  minScore: 0,
  tokenFilter: undefined as string | undefined,
  statusFilter: 'pending' as string | undefined,

  fetchSuggestions: async () => {
    const { page, minScore, tokenFilter, statusFilter } = get()
    set({ isLoading: true, error: null })
    try {
      const result = await fetchSuggestions({
        page,
        limit: 20,
        min_score: minScore || undefined,
        token: tokenFilter || undefined,
        status: statusFilter || undefined,
      })
      set({
        suggestions: result.suggestions,
        total: result.pagination.total,
        totalPages: result.pagination.total_pages,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch suggestions' })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchStats: async () => {
    set({ isLoadingStats: true })
    try {
      const stats = await fetchTransactionStats()
      set({ stats })
    } catch {
      // Silent fail for stats
    } finally {
      set({ isLoadingStats: false })
    }
  },

  runMatching: async (token?, minScore = 70) => {
    set({ isRunningMatch: true, error: null })
    try {
      const result = await runMatching({ token, min_score: minScore })
      // Refresh suggestions and stats after matching
      await Promise.all([get().fetchSuggestions(), get().fetchStats()])
      return result
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Matching failed' })
      throw err
    } finally {
      set({ isRunningMatch: false })
    }
  },

  approve: async (anchorId, claimId) => {
    try {
      await approveMatch(anchorId, claimId, 'user')
      await Promise.all([get().fetchSuggestions(), get().fetchStats()])
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Approval failed' })
      throw err
    }
  },

  forceReconcile: async (anchorId, claimId) => {
    try {
      await approveMatch(anchorId, claimId, 'user', true)
      await Promise.all([get().fetchSuggestions(), get().fetchStats()])
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Force reconcile failed' })
      throw err
    }
  },

  reject: async (anchorId, claimId, reason?) => {
    try {
      await rejectMatch(anchorId, claimId, 'user', reason)
      await Promise.all([get().fetchSuggestions(), get().fetchStats()])
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Rejection failed' })
      throw err
    }
  },

  batchApprove: async (pairs) => {
    try {
      const result = await batchReconcile(pairs, 'user')
      await Promise.all([get().fetchSuggestions(), get().fetchStats()])
      return { approved: result.approved, failed: result.failed.length }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Batch approve failed' })
      throw err
    }
  },

  importClaims: async (claims) => {
    try {
      const result = await importClaims(claims)
      await get().fetchStats()
      return { imported: result.imported, failed: result.failed }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Import failed' })
      throw err
    }
  },

  syncAnchors: async () => {
    set({ isSyncing: true, error: null })
    try {
      const result = await syncAnchors('default')
      await get().fetchStats()
      return { imported: result.anchors_synced }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Sync failed' })
      throw err
    } finally {
      set({ isSyncing: false })
    }
  },

  setPage: (page) => set({ page }),
  setMinScore: (score) => set({ minScore: score, page: 1 }),
  setTokenFilter: (token) => set({ tokenFilter: token, page: 1 }),
  setStatusFilter: (status) => set({ statusFilter: status, page: 1 }),
}))
