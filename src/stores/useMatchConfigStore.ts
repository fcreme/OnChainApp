import { create } from 'zustand'
import { fetchMatchingConfig, updateMatchingConfig } from '../api/reconciliation'
import type { MatchingConfig } from '../api/reconciliation'

interface MatchConfigState {
  config: MatchingConfig | null
  isLoading: boolean
  isSaving: boolean
  error: string | null

  fetchConfig: () => Promise<void>
  saveConfig: (config: Partial<MatchingConfig>) => Promise<void>
}

export const useMatchConfigStore = create<MatchConfigState>((set) => ({
  config: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchConfig: async () => {
    set({ isLoading: true })
    try {
      const config = await fetchMatchingConfig()
      set({ config })
    } catch {
      // Silent fail
    } finally {
      set({ isLoading: false })
    }
  },

  saveConfig: async (updates) => {
    set({ isSaving: true, error: null })
    try {
      const config = await updateMatchingConfig({ ...updates, actor: 'user' })
      set({ config })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save config'
      set({ error: msg })
      throw err
    } finally {
      set({ isSaving: false })
    }
  },
}))
