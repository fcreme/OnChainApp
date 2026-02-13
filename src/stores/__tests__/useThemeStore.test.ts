import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  async function getStore() {
    const { useThemeStore } = await import('../useThemeStore')
    return useThemeStore
  }

  it('defaults to dark mode', async () => {
    const store = await getStore()
    expect(store.getState().mode).toBe('dark')
  })

  it('reads stored mode from localStorage', async () => {
    localStorage.setItem('onchain_theme', 'light')
    const store = await getStore()
    expect(store.getState().mode).toBe('light')
  })

  it('toggles dark to light', async () => {
    const store = await getStore()
    store.getState().toggleMode()
    expect(store.getState().mode).toBe('light')
    expect(localStorage.getItem('onchain_theme')).toBe('light')
  })

  it('toggles light to dark', async () => {
    localStorage.setItem('onchain_theme', 'light')
    const store = await getStore()
    store.getState().toggleMode()
    expect(store.getState().mode).toBe('dark')
    expect(localStorage.getItem('onchain_theme')).toBe('dark')
  })

  it('persists after toggle', async () => {
    const store = await getStore()
    store.getState().toggleMode()
    expect(localStorage.getItem('onchain_theme')).toBe('light')
  })

  it('handles corrupted localStorage gracefully', async () => {
    localStorage.setItem('onchain_theme', 'invalid_value')
    const store = await getStore()
    expect(store.getState().mode).toBe('dark')
  })
})
