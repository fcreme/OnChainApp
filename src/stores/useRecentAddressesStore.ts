import { create } from 'zustand'

interface RecentAddressesStore {
  addresses: string[]
  addAddress: (address: string) => void
  clearAll: () => void
}

const STORAGE_KEY = 'onchain_recent_addresses'
const MAX_RECENT = 5

function load(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) return parsed.slice(0, MAX_RECENT)
  } catch {}
  return []
}

function save(addresses: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses))
  } catch {}
}

export const useRecentAddressesStore = create<RecentAddressesStore>((set, get) => ({
  addresses: load(),

  addAddress: (address) => {
    const { addresses } = get()
    const lower = address.toLowerCase()
    // Remove duplicate, prepend, cap at MAX_RECENT
    const filtered = addresses.filter((a) => a.toLowerCase() !== lower)
    const updated = [address, ...filtered].slice(0, MAX_RECENT)
    save(updated)
    set({ addresses: updated })
  },

  clearAll: () => {
    save([])
    set({ addresses: [] })
  },
}))
