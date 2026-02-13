import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('useContactsStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  async function getStore() {
    const { useContactsStore } = await import('../useContactsStore')
    return useContactsStore
  }

  it('starts empty when no localStorage data', async () => {
    const store = await getStore()
    expect(store.getState().contacts).toEqual([])
  })

  it('addContact adds and persists', async () => {
    const store = await getStore()
    store.getState().addContact('Alice', '0x1234567890abcdef1234567890abcdef12345678')
    expect(store.getState().contacts).toHaveLength(1)
    expect(store.getState().contacts[0].name).toBe('Alice')

    const stored = JSON.parse(localStorage.getItem('onchain_contacts')!)
    expect(stored).toHaveLength(1)
  })

  it('prevents duplicate by address (case-insensitive)', async () => {
    const store = await getStore()
    store.getState().addContact('Alice', '0x1234567890abcdef1234567890abcdef12345678')
    store.getState().addContact('Bob', '0x1234567890ABCDEF1234567890ABCDEF12345678')
    expect(store.getState().contacts).toHaveLength(1)
  })

  it('removeContact removes by address', async () => {
    const store = await getStore()
    store.getState().addContact('Alice', '0x1234567890abcdef1234567890abcdef12345678')
    store.getState().removeContact('0x1234567890abcdef1234567890abcdef12345678')
    expect(store.getState().contacts).toEqual([])
  })

  it('updateContact changes name', async () => {
    const store = await getStore()
    store.getState().addContact('Alice', '0x1234567890abcdef1234567890abcdef12345678')
    store.getState().updateContact('0x1234567890abcdef1234567890abcdef12345678', 'Bob')
    expect(store.getState().contacts[0].name).toBe('Bob')
  })

  it('handles corrupted localStorage gracefully', async () => {
    localStorage.setItem('onchain_contacts', 'broken')
    const store = await getStore()
    expect(store.getState().contacts).toEqual([])
  })
})
