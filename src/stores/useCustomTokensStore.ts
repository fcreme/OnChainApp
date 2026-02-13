import { create } from 'zustand'

export interface CustomToken {
  address: string
  symbol: string
  name: string
  decimals: number
}

interface CustomTokensStore {
  tokens: CustomToken[]
  addToken: (token: CustomToken) => void
  removeToken: (address: string) => void
}

const STORAGE_KEY = 'onchain_custom_tokens'

function loadTokens(): CustomToken[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return []
}

function saveTokens(tokens: CustomToken[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  } catch {}
}

export const useCustomTokensStore = create<CustomTokensStore>((set, get) => ({
  tokens: loadTokens(),

  addToken: (token) => {
    const { tokens } = get()
    const exists = tokens.some(
      (t) => t.address.toLowerCase() === token.address.toLowerCase()
    )
    if (exists) return

    const updated = [...tokens, token]
    saveTokens(updated)
    set({ tokens: updated })
  },

  removeToken: (address) => {
    const { tokens } = get()
    const updated = tokens.filter(
      (t) => t.address.toLowerCase() !== address.toLowerCase()
    )
    saveTokens(updated)
    set({ tokens: updated })
  },
}))
