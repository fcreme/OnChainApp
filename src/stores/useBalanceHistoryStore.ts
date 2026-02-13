import { create } from 'zustand'

export interface BalanceSnapshot {
  timestamp: number
  [token: string]: number
}

interface BalanceHistoryStore {
  snapshots: BalanceSnapshot[]
  addSnapshot: (balances: Record<string, string>) => void
  clearHistory: () => void
}

const STORAGE_KEY = 'onchain_balance_history'
const MAX_SNAPSHOTS = 50
const DEBOUNCE_MS = 60_000

function loadSnapshots(): BalanceSnapshot[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return []
}

function saveSnapshots(snapshots: BalanceSnapshot[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots))
  } catch {}
}

export const useBalanceHistoryStore = create<BalanceHistoryStore>((set, get) => ({
  snapshots: loadSnapshots(),

  addSnapshot: (balances) => {
    const { snapshots } = get()
    const now = Date.now()

    if (snapshots.length > 0) {
      const last = snapshots[snapshots.length - 1]
      if (now - last.timestamp < DEBOUNCE_MS) return
    }

    const entry: BalanceSnapshot = { timestamp: now }
    for (const [token, value] of Object.entries(balances)) {
      entry[token] = parseFloat(value) || 0
    }

    const updated = [...snapshots, entry].slice(-MAX_SNAPSHOTS)
    saveSnapshots(updated)
    set({ snapshots: updated })
  },

  clearHistory: () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    set({ snapshots: [] })
  },
}))
