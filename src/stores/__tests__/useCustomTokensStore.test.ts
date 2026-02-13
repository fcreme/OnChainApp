import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('useCustomTokensStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  async function getStore() {
    const { useCustomTokensStore } = await import('../useCustomTokensStore')
    return useCustomTokensStore
  }

  it('starts empty when no localStorage data', async () => {
    const store = await getStore()
    expect(store.getState().tokens).toEqual([])
  })

  it('addToken adds and persists', async () => {
    const store = await getStore()
    store.getState().addToken({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      symbol: 'TEST',
      name: 'Test Token',
      decimals: 18,
    })
    expect(store.getState().tokens).toHaveLength(1)
    expect(store.getState().tokens[0].symbol).toBe('TEST')

    const stored = JSON.parse(localStorage.getItem('onchain_custom_tokens')!)
    expect(stored).toHaveLength(1)
  })

  it('prevents duplicate by address (case-insensitive)', async () => {
    const store = await getStore()
    const token = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      symbol: 'TEST',
      name: 'Test Token',
      decimals: 18,
    }
    store.getState().addToken(token)
    store.getState().addToken({
      ...token,
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      symbol: 'TEST2',
    })
    expect(store.getState().tokens).toHaveLength(1)
  })

  it('removeToken removes by address (case-insensitive)', async () => {
    const store = await getStore()
    store.getState().addToken({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      symbol: 'TEST',
      name: 'Test Token',
      decimals: 18,
    })
    store.getState().removeToken('0x1234567890ABCDEF1234567890ABCDEF12345678')
    expect(store.getState().tokens).toEqual([])
  })

  it('handles corrupted localStorage gracefully', async () => {
    localStorage.setItem('onchain_custom_tokens', '{bad}')
    const store = await getStore()
    expect(store.getState().tokens).toEqual([])
  })
})
