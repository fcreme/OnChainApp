import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { DAI, USDC } from '../../lib/erc20'
import type { AppEvent } from './useAppStore'

// src/setupTests.ts replaces this module with a hand-written mock store so that the
// component tests render against fixed data. Cancel that here (hoisted, so it applies
// before any import of the store) — these tests exercise the real store.
vi.unmock('./useAppStore')

// Only genuinely external things are mocked: the RPC client, the wallet client and the
// wagmi config they come from. Everything else (zustand, viem formatting, localStorage,
// the sibling stores) is the real implementation.
const mocks = vi.hoisted(() => ({
  publicClient: {
    readContract: vi.fn(),
    getBalance: vi.fn(),
    getBlockNumber: vi.fn(),
    getBlock: vi.fn(),
    getLogs: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    watchEvent: vi.fn()
  },
  walletClient: { writeContract: vi.fn() },
  walletAvailable: true
}))

vi.mock('wagmi/actions', () => ({
  getPublicClient: () => mocks.publicClient,
  getWalletClient: async () => (mocks.walletAvailable ? mocks.walletClient : null)
}))

vi.mock('../../lib/web3', () => ({ config: {} }))

const SEPOLIA_ID = 11155111
const MAINNET_ID = 1
const ACCOUNT = '0x1111111111111111111111111111111111111111' as const
const SPENDER = '0x2222222222222222222222222222222222222222' as const
const RECIPIENT = '0x3333333333333333333333333333333333333333' as const
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const TX_HASH = '0xdeadbeef'
const EVENTS_KEY = 'onchain_events'
const NOW = Date.UTC(2026, 0, 1)

type AppStoreHook = (typeof import('./useAppStore'))['useAppStore']
type LogHandler = (logs: unknown[]) => void

let store: AppStoreHook

// The store reads localStorage once, while the module is evaluated, so every test gets a
// freshly evaluated module instead of a shared singleton.
async function loadStore(): Promise<AppStoreHook> {
  vi.resetModules()
  const mod = await import('./useAppStore')
  return mod.useAppStore
}

function connect(chainId: number = SEPOLIA_ID) {
  store.setState({ isConnected: true, account: ACCOUNT, chainId })
}

function storedEvents(): unknown {
  return JSON.parse(localStorage.getItem(EVENTS_KEY) ?? 'null')
}

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  localStorage.clear()
  delete (window as unknown as Record<string, unknown>).__onchain_unwatchers

  mocks.walletAvailable = true
  mocks.walletClient.writeContract.mockReset().mockResolvedValue(TX_HASH)
  mocks.publicClient.readContract.mockReset().mockResolvedValue(0n)
  mocks.publicClient.getBalance.mockReset().mockResolvedValue(0n)
  mocks.publicClient.getBlockNumber.mockReset().mockResolvedValue(1_000n)
  mocks.publicClient.getBlock.mockReset().mockResolvedValue({ timestamp: 0n })
  mocks.publicClient.getLogs.mockReset().mockResolvedValue([])
  mocks.publicClient.waitForTransactionReceipt.mockReset().mockResolvedValue({ status: 'success' })
  mocks.publicClient.watchEvent.mockReset().mockImplementation(() => vi.fn())

  store = await loadStore()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useAppStore initial state', () => {
  it('starts disconnected, with zero balances, no events and an idle transaction', () => {
    const state = store.getState()

    expect(state.isConnected).toBe(false)
    expect(state.account).toBeUndefined()
    expect(state.chainId).toBeUndefined()
    expect(state.balances).toEqual({ DAI: '0', USDC: '0' })
    expect(state.nativeBalance).toBe('0')
    expect(state.isLoadingBalances).toBe(false)
    expect(state.isLoadingEvents).toBe(false)
    expect(state.transactionStatus).toBe('idle')
    expect(state.transactionHash).toBeUndefined()
    expect(state.transactionError).toBeUndefined()
    expect(state.events).toEqual([])
  })

  it('pushes state changes to components subscribed through the hook', () => {
    const { result } = renderHook(() => store((s) => s.isConnected))
    expect(result.current).toBe(false)

    act(() => {
      store.getState().setConnection(true, ACCOUNT, MAINNET_ID)
    })

    expect(result.current).toBe(true)
  })
})

describe('useAppStore event persistence', () => {
  const persisted: AppEvent = {
    type: 'Transfer',
    token: 'DAI',
    amount: '1.5',
    from: ACCOUNT,
    to: RECIPIENT,
    tx: '0xabc',
    timestamp: 1_700_000_000_000,
    source: 'onchain'
  }

  it('restores the events saved in localStorage when the store is created', async () => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify([persisted]))

    store = await loadStore()

    expect(store.getState().events).toEqual([persisted])
  })

  it('relabels a persisted Transfer from the zero address as a Mint', async () => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify([{ ...persisted, from: ZERO_ADDRESS }]))

    store = await loadStore()

    expect(store.getState().events).toEqual([{ ...persisted, type: 'Mint', from: ZERO_ADDRESS }])
  })

  it.each([
    ['is not valid JSON', 'this is not json {{{'],
    ['is valid JSON but not a list of events', '{"events":"nope"}']
  ])('starts with no events, and still works, when the stored value %s', async (_case, stored) => {
    localStorage.setItem(EVENTS_KEY, stored)

    store = await loadStore()

    expect(store.getState().events).toEqual([])
    // The store is usable rather than half-built: an action still runs.
    store.getState().clearTransactionStatus()
    expect(store.getState().transactionStatus).toBe('idle')
  })

  it('keeps an event in memory even when localStorage refuses to save it', async () => {
    connect()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    await store.getState().approve('DAI', SPENDER, '100')

    expect(store.getState().events).toHaveLength(1)
    expect(store.getState().transactionStatus).toBe('success')
  })
})

describe('useAppStore connection', () => {
  it('records the account and chain of a new connection', () => {
    store.getState().setConnection(true, ACCOUNT, MAINNET_ID)

    const state = store.getState()
    expect(state.isConnected).toBe(true)
    expect(state.account).toBe(ACCOUNT)
    expect(state.chainId).toBe(MAINNET_ID)
  })

  it('clears the account and chain on disconnect', () => {
    store.getState().setConnection(true, ACCOUNT, MAINNET_ID)

    store.getState().setConnection(false, undefined, undefined)

    const state = store.getState()
    expect(state.isConnected).toBe(false)
    expect(state.account).toBeUndefined()
    expect(state.chainId).toBeUndefined()
  })

  it('loads the balances of the account when it connects on Sepolia', async () => {
    mocks.publicClient.readContract.mockImplementation(async (args: { address: string }) =>
      args.address === DAI ? 1_500_000_000_000_000_000n : 2_500_000n
    )
    mocks.publicClient.getBalance.mockResolvedValue(3_000_000_000_000_000_000n)

    store.getState().setConnection(true, ACCOUNT, SEPOLIA_ID)

    await vi.waitFor(() => {
      expect(store.getState().balances).toEqual({ DAI: '1.5', USDC: '2.5' })
    })
    expect(store.getState().nativeBalance).toBe('3')
    expect(store.getState().isLoadingBalances).toBe(false)
  })

  it('does not load balances or events when it connects on another chain', async () => {
    mocks.publicClient.readContract.mockResolvedValue(1_500_000_000_000_000_000n)
    mocks.publicClient.getBalance.mockResolvedValue(3_000_000_000_000_000_000n)

    store.getState().setConnection(true, ACCOUNT, MAINNET_ID)

    // fetchBalances and fetchOnChainEvents raise their loading flag before their first
    // await, so an unwanted call is visible immediately — no racing with microtasks.
    expect(store.getState().isLoadingBalances).toBe(false)
    expect(store.getState().isLoadingEvents).toBe(false)

    await vi.advanceTimersByTimeAsync(0)

    expect(store.getState().balances).toEqual({ DAI: '0', USDC: '0' })
    expect(store.getState().nativeBalance).toBe('0')
  })
})

describe('useAppStore fetchBalances', () => {
  it('leaves the balances untouched while no wallet is connected', async () => {
    mocks.publicClient.readContract.mockResolvedValue(5_000_000_000_000_000_000n)

    await store.getState().fetchBalances()

    expect(store.getState().balances).toEqual({ DAI: '0', USDC: '0' })
    expect(store.getState().isLoadingBalances).toBe(false)
  })

  it('formats each token balance with the decimals of that token', async () => {
    connect()
    mocks.publicClient.readContract.mockImplementation(async (args: { address: string }) =>
      args.address === DAI ? 10_000_000_000_000_000_000n : 1_234_567n
    )

    await store.getState().fetchBalances()

    // 18 decimals for DAI, 6 for USDC
    expect(store.getState().balances).toEqual({ DAI: '10', USDC: '1.234567' })
  })

  it('keeps the previous balances and stops loading when the RPC call fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    connect()
    store.setState({ balances: { DAI: '7', USDC: '3' } })
    mocks.publicClient.readContract.mockRejectedValue(new Error('RPC down'))

    await store.getState().fetchBalances()

    expect(store.getState().balances).toEqual({ DAI: '7', USDC: '3' })
    expect(store.getState().isLoadingBalances).toBe(false)
  })
})

describe('useAppStore custom tokens', () => {
  const CUSTOM = '0x4444444444444444444444444444444444444444'

  // The store module is re-evaluated per test, so the custom-token store it talks to is
  // the one in the same fresh module registry — not a statically imported sibling.
  async function registerCustomToken(decimals: number) {
    const { useCustomTokensStore } = await import('../../stores/useCustomTokensStore')
    useCustomTokensStore
      .getState()
      .addToken({ address: CUSTOM, symbol: 'MYT', name: 'My Token', decimals })
  }

  it('adds a registered custom token to the balances, formatted with its own decimals', async () => {
    await registerCustomToken(8)
    connect()
    mocks.publicClient.readContract.mockImplementation(async (args: { address: string }) =>
      args.address === CUSTOM ? 250_000_000n : 0n
    )

    await store.getState().fetchBalances()

    expect(store.getState().balances).toEqual({ DAI: '0', USDC: '0', MYT: '2.5' })
  })

  it('reports a zero balance for a custom token whose contract cannot be read', async () => {
    await registerCustomToken(8)
    connect()
    mocks.publicClient.readContract.mockImplementation(async (args: { address: string }) => {
      if (args.address === CUSTOM) throw new Error('not a contract')
      return 0n
    })

    await store.getState().fetchBalances()

    expect(store.getState().balances).toEqual({ DAI: '0', USDC: '0', MYT: '0' })
  })

  it('approves a registered custom token instead of rejecting it as unknown', async () => {
    await registerCustomToken(8)
    connect()

    await store.getState().approve('MYT', SPENDER, '1.5')

    const expected: AppEvent = {
      type: 'Approval',
      token: 'MYT',
      amount: '1.5',
      from: ACCOUNT,
      to: SPENDER,
      tx: TX_HASH,
      timestamp: NOW,
      source: 'local'
    }
    expect(store.getState().transactionStatus).toBe('success')
    expect(store.getState().events).toEqual([expected])
    expect(storedEvents()).toEqual([expected])
  })
})

describe('useAppStore fetchOnChainEvents', () => {
  const transferLog = {
    args: { from: ACCOUNT, to: RECIPIENT, value: 2_000_000_000_000_000_000n },
    transactionHash: '0xfeed',
    blockNumber: 42n
  }

  it('records on-chain transfers with the timestamp of their block', async () => {
    connect()
    mocks.publicClient.getBlock.mockResolvedValue({ timestamp: 1_700_000_000n })
    mocks.publicClient.getLogs.mockImplementation(
      async (args: { address: string; event: { name: string }; args: { from?: string } }) =>
        args.address === DAI && args.event.name === 'Transfer' && args.args.from === ACCOUNT
          ? [transferLog]
          : []
    )

    await store.getState().fetchOnChainEvents()

    const expected: AppEvent = {
      type: 'Transfer',
      token: 'DAI',
      amount: '2',
      from: ACCOUNT,
      to: RECIPIENT,
      tx: '0xfeed',
      timestamp: 1_700_000_000_000,
      source: 'onchain'
    }
    expect(store.getState().events).toEqual([expected])
    expect(storedEvents()).toEqual([expected])
    expect(store.getState().isLoadingEvents).toBe(false)
  })

  it('fetches nothing while connected to a chain other than Sepolia', async () => {
    connect(MAINNET_ID)
    mocks.publicClient.getLogs.mockResolvedValue([transferLog])

    await store.getState().fetchOnChainEvents()

    expect(store.getState().events).toEqual([])
    expect(localStorage.getItem(EVENTS_KEY)).toBeNull()
  })
})

describe('useAppStore transactions', () => {
  const ACTIONS = ['approve', 'transfer', 'mint'] as const
  type ActionName = (typeof ACTIONS)[number]

  function runAction(name: ActionName): Promise<string> {
    const state = store.getState()
    if (name === 'approve') return state.approve('DAI', SPENDER, '100')
    if (name === 'transfer') return state.transfer('DAI', RECIPIENT, '1')
    return state.mint('DAI', '100')
  }

  it.each(ACTIONS)('rejects %s while no wallet is connected', async (name) => {
    await expect(runAction(name)).rejects.toThrow('Please connect your wallet first')
    expect(store.getState().transactionStatus).toBe('idle')
    expect(store.getState().events).toEqual([])
  })

  it.each(ACTIONS)('rejects %s on a chain other than Sepolia', async (name) => {
    connect(MAINNET_ID)

    await expect(runAction(name)).rejects.toThrow('Please switch to Sepolia network')
    expect(store.getState().transactionStatus).toBe('idle')
    expect(store.getState().events).toEqual([])
  })

  it('records a confirmed approval as an Approval event and persists it', async () => {
    connect()

    const hash = await store.getState().approve('DAI', SPENDER, '100')

    const state = store.getState()
    const expected: AppEvent = {
      type: 'Approval',
      token: 'DAI',
      amount: '100',
      from: ACCOUNT,
      to: SPENDER,
      tx: TX_HASH,
      timestamp: NOW,
      source: 'local'
    }
    expect(hash).toBe(TX_HASH)
    expect(state.transactionStatus).toBe('success')
    expect(state.transactionHash).toBe(TX_HASH)
    expect(state.transactionError).toBeUndefined()
    expect(state.events).toEqual([expected])
    expect(storedEvents()).toEqual([expected])
  })

  it('records a confirmed transfer as a Transfer event and persists it', async () => {
    connect()
    store.setState({ balances: { DAI: '100', USDC: '0' } })

    await store.getState().transfer('DAI', RECIPIENT, '25')

    const expected: AppEvent = {
      type: 'Transfer',
      token: 'DAI',
      amount: '25',
      from: ACCOUNT,
      to: RECIPIENT,
      tx: TX_HASH,
      timestamp: NOW,
      source: 'local'
    }
    expect(store.getState().events).toEqual([expected])
    expect(storedEvents()).toEqual([expected])
  })

  it('records a confirmed mint as a Mint event addressed to the connected account', async () => {
    connect()

    await store.getState().mint('USDC', '10')

    const expected: AppEvent = {
      type: 'Mint',
      token: 'USDC',
      amount: '10',
      from: ACCOUNT,
      to: ACCOUNT,
      tx: TX_HASH,
      timestamp: NOW,
      source: 'local'
    }
    expect(store.getState().events).toEqual([expected])
    expect(storedEvents()).toEqual([expected])
  })

  it('refuses a transfer larger than the balance and keeps the transaction idle', async () => {
    connect()
    store.setState({ balances: { DAI: '10', USDC: '0' } })

    await expect(store.getState().transfer('DAI', RECIPIENT, '25')).rejects.toThrow(
      'Insufficient DAI balance. You have 10 DAI'
    )
    expect(store.getState().transactionStatus).toBe('idle')
    expect(store.getState().events).toEqual([])
    expect(localStorage.getItem(EVENTS_KEY)).toBeNull()
  })

  it('refuses a token that is neither built in nor a registered custom token', async () => {
    connect()

    await expect(store.getState().approve('FOO', SPENDER, '1')).rejects.toThrow('Unknown token: FOO')
    expect(store.getState().transactionStatus).toBe('idle')
  })

  it('records the same transaction only once', async () => {
    connect()

    await store.getState().approve('DAI', SPENDER, '100')
    await store.getState().approve('DAI', SPENDER, '100')

    expect(store.getState().events).toHaveLength(1)
    expect(storedEvents()).toHaveLength(1)
  })

  it('surfaces a rejected wallet request as a transaction error and records no event', async () => {
    connect()
    mocks.walletClient.writeContract.mockRejectedValue(new Error('User rejected the request'))

    await expect(store.getState().approve('DAI', SPENDER, '100')).rejects.toThrow(
      'User rejected the request'
    )
    const state = store.getState()
    expect(state.transactionStatus).toBe('error')
    expect(state.transactionError).toBe('User rejected the request')
    expect(state.events).toEqual([])
    expect(localStorage.getItem(EVENTS_KEY)).toBeNull()
  })

  it('surfaces an unavailable wallet client as a transaction error', async () => {
    connect()
    mocks.walletAvailable = false

    await expect(store.getState().approve('DAI', SPENDER, '100')).rejects.toThrow(
      'Wallet not available. Please check your connection.'
    )
    expect(store.getState().transactionStatus).toBe('error')
    expect(store.getState().transactionError).toBe('Wallet not available. Please check your connection.')
  })

  it('clears the status, hash and error of a finished transaction but keeps its event', async () => {
    connect()
    await store.getState().approve('DAI', SPENDER, '100')

    store.getState().clearTransactionStatus()

    const state = store.getState()
    expect(state.transactionStatus).toBe('idle')
    expect(state.transactionHash).toBeUndefined()
    expect(state.transactionError).toBeUndefined()
    expect(state.events).toHaveLength(1)
  })
})

describe('useAppStore event watching', () => {
  const watchers = new Map<string, LogHandler>()
  let unwatchers: ReturnType<typeof vi.fn>[]

  beforeEach(() => {
    watchers.clear()
    unwatchers = []
    mocks.publicClient.watchEvent.mockImplementation(
      (args: {
        address: string
        event: { name: string }
        args: Record<string, string>
        onLogs: LogHandler
      }) => {
        const filter = Object.keys(args.args)[0]
        watchers.set(`${args.address}:${args.event.name}:${filter}`, args.onLogs)
        const unwatch = vi.fn()
        unwatchers.push(unwatch)
        return unwatch
      }
    )
  })

  function watcher(key: string): LogHandler {
    const handler = watchers.get(key)
    if (!handler) throw new Error(`no watcher registered for ${key}`)
    return handler
  }

  it('turns a watched transfer out of the zero address into a persisted Mint event', () => {
    connect()
    store.getState().startWatchingEvents()

    watcher(`${DAI}:Transfer:from`)([
      {
        args: { from: ZERO_ADDRESS, to: ACCOUNT, value: 1_000_000_000_000_000_000n },
        transactionHash: TX_HASH
      }
    ])

    const expected: AppEvent = {
      type: 'Mint',
      token: 'DAI',
      amount: '1',
      from: ZERO_ADDRESS,
      to: ACCOUNT,
      tx: TX_HASH,
      timestamp: NOW,
      source: 'onchain'
    }
    expect(store.getState().events).toEqual([expected])
    expect(storedEvents()).toEqual([expected])
  })

  it('formats a watched approval with the decimals of the token it belongs to', () => {
    connect()
    store.getState().startWatchingEvents()

    watcher(`${USDC}:Approval:owner`)([
      { args: { owner: ACCOUNT, spender: SPENDER, value: 2_500_000n }, transactionHash: '0xcafe' }
    ])

    expect(store.getState().events).toEqual([
      {
        type: 'Approval',
        token: 'USDC',
        amount: '2.5',
        from: ACCOUNT,
        to: SPENDER,
        tx: '0xcafe',
        timestamp: NOW,
        source: 'onchain'
      }
    ])
  })

  it('registers no watchers while connected to a chain other than Sepolia', () => {
    connect(MAINNET_ID)

    store.getState().startWatchingEvents()

    expect(watchers.size).toBe(0)
  })

  it('releases every RPC subscription when watching stops', () => {
    connect()
    store.getState().startWatchingEvents()
    expect(unwatchers).toHaveLength(6)

    store.getState().stopWatchingEvents()

    // The unwatch handles come from the RPC client, so calling them is the only
    // observable proof the subscriptions were released.
    expect(unwatchers.every((unwatch) => unwatch.mock.calls.length === 1)).toBe(true)
    expect((window as unknown as Record<string, unknown>).__onchain_unwatchers).toBeUndefined()
  })
})
