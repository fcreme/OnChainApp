import { create } from 'zustand'

interface TransactionNotesStore {
  notes: Record<string, string>
  setNote: (txHash: string, note: string) => void
  removeNote: (txHash: string) => void
  getNote: (txHash: string) => string | undefined
}

const STORAGE_KEY = 'onchain_tx_notes'

function load(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    const parsed = JSON.parse(stored)
    if (typeof parsed === 'object' && parsed !== null) return parsed
  } catch {}
  return {}
}

function save(notes: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {}
}

export const useTransactionNotesStore = create<TransactionNotesStore>((set, get) => ({
  notes: load(),

  setNote: (txHash, note) => {
    const { notes } = get()
    const trimmed = note.trim()
    const updated = { ...notes }
    if (trimmed) {
      updated[txHash] = trimmed
    } else {
      delete updated[txHash]
    }
    save(updated)
    set({ notes: updated })
  },

  removeNote: (txHash) => {
    const { notes } = get()
    const updated = { ...notes }
    delete updated[txHash]
    save(updated)
    set({ notes: updated })
  },

  getNote: (txHash) => {
    return get().notes[txHash]
  },
}))
