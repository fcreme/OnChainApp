import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('useBalanceHistoryStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  async function getStore() {
    const { useBalanceHistoryStore } = await import('../useBalanceHistoryStore')
    return useBalanceHistoryStore
  }

  it('starts empty when no localStorage data', async () => {
    const store = await getStore()
    expect(store.getState().snapshots).toEqual([])
  })

  it('addSnapshot records and persists', async () => {
    const store = await getStore()
    store.getState().addSnapshot({ DAI: '100', USDC: '50' })
    expect(store.getState().snapshots).toHaveLength(1)
    expect(store.getState().snapshots[0].DAI).toBe(100)
    expect(store.getState().snapshots[0].USDC).toBe(50)

    const stored = JSON.parse(localStorage.getItem('onchain_balance_history')!)
    expect(stored).toHaveLength(1)
  })

  it('skips snapshot within 60s debounce', async () => {
    const store = await getStore()
    store.getState().addSnapshot({ DAI: '100' })
    store.getState().addSnapshot({ DAI: '200' })
    expect(store.getState().snapshots).toHaveLength(1)
  })

  it('allows snapshot after 60s', async () => {
    const store = await getStore()
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)
    store.getState().addSnapshot({ DAI: '100' })

    vi.spyOn(Date, 'now').mockReturnValue(now + 61_000)
    store.getState().addSnapshot({ DAI: '200' })
    expect(store.getState().snapshots).toHaveLength(2)

    vi.restoreAllMocks()
  })

  it('caps at 50 entries', async () => {
    const store = await getStore()
    let time = Date.now()
    for (let i = 0; i < 55; i++) {
      vi.spyOn(Date, 'now').mockReturnValue(time)
      store.getState().addSnapshot({ DAI: String(i) })
      time += 61_000
    }
    expect(store.getState().snapshots).toHaveLength(50)
    vi.restoreAllMocks()
  })

  it('clearHistory empties snapshots and localStorage', async () => {
    const store = await getStore()
    store.getState().addSnapshot({ DAI: '100' })
    store.getState().clearHistory()
    expect(store.getState().snapshots).toEqual([])
    expect(localStorage.getItem('onchain_balance_history')).toBeNull()
  })

  it('handles corrupted localStorage gracefully', async () => {
    localStorage.setItem('onchain_balance_history', 'not-json')
    const store = await getStore()
    expect(store.getState().snapshots).toEqual([])
  })
})
