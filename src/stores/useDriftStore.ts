import { create } from 'zustand'
import { fetchDrifts, syncDrift, fetchRiskScores, recalculateRisk } from '../api/drift'
import type { DriftResponse, WalletRiskResponse } from '../api/drift'

interface DriftState {
  drifts: DriftResponse[]
  riskScores: WalletRiskResponse[]
  isLoadingDrift: boolean
  isLoadingRisk: boolean
  isSyncingDrift: boolean

  fetchDrifts: () => Promise<void>
  syncDrift: () => Promise<void>
  fetchRiskScores: () => Promise<void>
  recalculateRisk: () => Promise<void>
}

export const useDriftStore = create<DriftState>((set) => ({
  drifts: [],
  riskScores: [],
  isLoadingDrift: false,
  isLoadingRisk: false,
  isSyncingDrift: false,

  fetchDrifts: async () => {
    set({ isLoadingDrift: true })
    try {
      const result = await fetchDrifts()
      set({ drifts: result.drifts })
    } catch {
      // Silent fail
    } finally {
      set({ isLoadingDrift: false })
    }
  },

  syncDrift: async () => {
    set({ isSyncingDrift: true })
    try {
      const result = await syncDrift()
      set({ drifts: result.drifts })
    } catch {
      // Silent fail
    } finally {
      set({ isSyncingDrift: false })
    }
  },

  fetchRiskScores: async () => {
    set({ isLoadingRisk: true })
    try {
      const result = await fetchRiskScores()
      set({ riskScores: result.scores })
    } catch {
      // Silent fail
    } finally {
      set({ isLoadingRisk: false })
    }
  },

  recalculateRisk: async () => {
    set({ isLoadingRisk: true })
    try {
      const result = await recalculateRisk()
      set({ riskScores: result.scores })
    } catch {
      // Silent fail
    } finally {
      set({ isLoadingRisk: false })
    }
  },
}))
