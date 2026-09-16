import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createElement } from 'react'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// The API layer is the network boundary — the only thing mocked here.
const { syncAnchorsApi, fetchTransactionStatsApi } = vi.hoisted(() => ({
  syncAnchorsApi: vi.fn(),
  fetchTransactionStatsApi: vi.fn(),
}))

vi.mock('../../api/transactions', () => ({
  syncAnchors: syncAnchorsApi,
  fetchTransactionStats: fetchTransactionStatsApi,
  importClaims: vi.fn(),
}))

vi.mock('../../api/reconciliation', () => ({
  fetchSuggestions: vi.fn(async () => ({
    suggestions: [],
    pagination: { page: 1, limit: 20, total: 0, total_pages: 1 },
  })),
  runMatching: vi.fn(),
  approveMatch: vi.fn(),
  rejectMatch: vi.fn(),
  batchReconcile: vi.fn(),
}))

const WALLET = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'

describe('useReconciliationStore.syncAnchors', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    fetchTransactionStatsApi.mockResolvedValue({
      total_anchors: 0,
      total_claims: 0,
      pending_claims: 0,
      reconciled: 0,
      suggestions: 0,
      match_rate: 0,
    })
    const { useReconciliationStore } = await import('../useReconciliationStore')
    useReconciliationStore.setState({ isSyncing: false, error: null })
  })

  it('sends the wallet it was given to the sync endpoint', async () => {
    syncAnchorsApi.mockResolvedValue({ anchors_synced: 3 })
    const { useReconciliationStore } = await import('../useReconciliationStore')

    await useReconciliationStore.getState().syncAnchors(WALLET)

    expect(syncAnchorsApi).toHaveBeenCalledWith(WALLET)
  })

  it('maps anchors_synced from the response to imported', async () => {
    syncAnchorsApi.mockResolvedValue({ anchors_synced: 12 })
    const { useReconciliationStore } = await import('../useReconciliationStore')

    const result = await useReconciliationStore.getState().syncAnchors(WALLET)

    expect(result).toEqual({ imported: 12 })
  })

  it('records the failure message and rethrows when the sync call rejects', async () => {
    syncAnchorsApi.mockRejectedValue(new Error('wallet: String must contain at least 42 character(s)'))
    const { useReconciliationStore } = await import('../useReconciliationStore')

    await expect(useReconciliationStore.getState().syncAnchors(WALLET)).rejects.toThrow(
      'wallet: String must contain at least 42 character(s)',
    )
    expect(useReconciliationStore.getState().error).toBe(
      'wallet: String must contain at least 42 character(s)',
    )
  })

  it('raises isSyncing while the call is in flight and clears it when it settles', async () => {
    let resolveSync: (value: { anchors_synced: number }) => void = () => {}
    syncAnchorsApi.mockReturnValue(
      new Promise<{ anchors_synced: number }>((resolve) => {
        resolveSync = resolve
      }),
    )
    const { useReconciliationStore } = await import('../useReconciliationStore')

    const pending = useReconciliationStore.getState().syncAnchors(WALLET)
    expect(useReconciliationStore.getState().isSyncing).toBe(true)

    resolveSync({ anchors_synced: 1 })
    await pending

    expect(useReconciliationStore.getState().isSyncing).toBe(false)
  })

  it('clears isSyncing after a failed sync too', async () => {
    syncAnchorsApi.mockRejectedValue(new Error('boom'))
    const { useReconciliationStore } = await import('../useReconciliationStore')

    await expect(useReconciliationStore.getState().syncAnchors(WALLET)).rejects.toThrow('boom')

    expect(useReconciliationStore.getState().isSyncing).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// The page half of the same bug: Reconciliation must hand the connected
// account to the store action. Lives in this file because it is the only new
// test file this task may add.
// ---------------------------------------------------------------------------

interface PageHarnessOptions {
  address?: string
  isConnected?: boolean
  isSyncing?: boolean
}

async function renderReconciliation(options: PageHarnessOptions = {}) {
  const { isConnected = true, isSyncing = false } = options
  // wagmi drops the address on a clean disconnect, but keeps it while
  // reconnecting — so the two are separate knobs here.
  const address = 'address' in options ? options.address : isConnected ? WALLET : undefined

  vi.resetModules()

  const syncAnchors = vi.fn(async () => ({ imported: 0 }))
  const reconciliationState = {
    suggestions: [],
    stats: null,
    isLoading: false,
    isLoadingStats: false,
    isRunningMatch: false,
    isSyncing,
    error: null,
    page: 1,
    totalPages: 1,
    total: 0,
    minScore: 0,
    tokenFilter: undefined,
    statusFilter: 'pending',
    fetchSuggestions: vi.fn(async () => {}),
    fetchStats: vi.fn(async () => {}),
    runMatching: vi.fn(async () => ({ new_suggestions: 0 })),
    approve: vi.fn(async () => {}),
    forceReconcile: vi.fn(async () => {}),
    reject: vi.fn(async () => {}),
    batchApprove: vi.fn(async () => ({ approved: 0, failed: 0 })),
    importClaims: vi.fn(async () => ({ imported: 0, failed: 0 })),
    syncAnchors,
    setPage: vi.fn(),
    setMinScore: vi.fn(),
    setTokenFilter: vi.fn(),
    setStatusFilter: vi.fn(),
  }

  vi.doMock('../useReconciliationStore', () => ({
    useReconciliationStore: () => reconciliationState,
  }))
  vi.doMock('../useDriftStore', () => ({
    useDriftStore: () => ({
      drifts: [],
      riskScores: [],
      isLoadingDrift: false,
      isLoadingRisk: false,
      isSyncingDrift: false,
      fetchDrifts: vi.fn(async () => {}),
      syncDrift: vi.fn(async () => {}),
      fetchRiskScores: vi.fn(async () => {}),
      recalculateRisk: vi.fn(async () => {}),
    }),
  }))
  vi.doMock('../useToastStore', () => ({
    useToastStore: () => ({ toasts: [], addToast: vi.fn(), removeToast: vi.fn(), clearAll: vi.fn() }),
  }))
  vi.doMock('wagmi', async () => {
    const actual = await vi.importActual<Record<string, unknown>>('wagmi')
    return {
      ...actual,
      useAccount: () => ({
        address,
        isConnected,
        isConnecting: false,
        isDisconnected: !isConnected,
      }),
      useChainId: () => 11155111,
      useSwitchChain: () => ({ switchChain: vi.fn(), isPending: false }),
    }
  })

  const { default: Reconciliation } = await import('../../pages/Reconciliation')
  render(createElement(Reconciliation))

  const syncButton = await screen.findByRole('button', { name: /sync anchors/i })
  return { syncButton, syncAnchors }
}

describe('Reconciliation page — Sync Anchors', () => {
  afterEach(() => {
    cleanup()
    vi.resetModules()
  })

  it('passes the connected account to the store action when clicked', async () => {
    const { syncButton, syncAnchors } = await renderReconciliation({ address: WALLET })

    await userEvent.click(syncButton)

    await waitFor(() => expect(syncAnchors).toHaveBeenCalledWith(WALLET))
  })

  it('disables the button and explains why when no wallet is connected', async () => {
    const { syncButton, syncAnchors } = await renderReconciliation({ isConnected: false })

    expect(syncButton).toBeDisabled()
    expect(syncButton.closest('span[title]')).toHaveAttribute('title', 'Connect a wallet to sync anchors')
    expect(syncAnchors).not.toHaveBeenCalled()
  })

  it('stays disabled while reconnecting, when an address lingers but the wallet is not connected', async () => {
    const { syncButton } = await renderReconciliation({ address: WALLET, isConnected: false })

    expect(syncButton).toBeDisabled()
    expect(syncButton.closest('span[title]')).toHaveAttribute('title', 'Connect a wallet to sync anchors')
  })

  it('disables the button while a sync is already in flight', async () => {
    const { syncButton } = await renderReconciliation({ isSyncing: true })

    expect(syncButton).toBeDisabled()
  })

  it('leaves the button enabled with no disconnected tooltip when a wallet is connected', async () => {
    const { syncButton } = await renderReconciliation({ address: WALLET })

    expect(syncButton).toBeEnabled()
    expect(syncButton.closest('span[title]')).toBeNull()
  })
})
