import { create } from 'zustand'
import { formatUnits, parseUnits } from 'viem'
import type { Address } from 'viem'
import { sepolia } from 'wagmi/chains'
import { getPublicClient, getWalletClient } from 'wagmi/actions'
import { config } from '../../lib/web3'
import { DAI, USDC, ERC20_ABI } from '../../lib/erc20'
import { useCustomTokensStore } from '../../stores/useCustomTokensStore'
import { useBalanceHistoryStore } from '../../stores/useBalanceHistoryStore'
import { useToastStore } from '../../stores/useToastStore'

export type BuiltInToken = 'DAI' | 'USDC'
type Balances = Record<string, string>
type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

export interface AppEvent {
  type: string
  token: string
  amount: string
  from?: string
  to?: string
  tx: string
  timestamp?: number
  source?: 'local' | 'onchain'
}

interface AppState {
  // Connection state
  isConnected: boolean
  account: Address | undefined
  chainId: number | undefined

  // Balances
  balances: Balances
  nativeBalance: string
  isLoadingBalances: boolean

  // Transaction state
  transactionStatus: TransactionStatus
  transactionHash: string | undefined
  transactionError: string | undefined

  // Events
  events: AppEvent[]
  isLoadingEvents: boolean

  // Actions
  setConnection: (isConnected: boolean, account: Address | undefined, chainId: number | undefined) => void
  fetchBalances: () => Promise<void>
  fetchOnChainEvents: () => Promise<void>
  startWatchingEvents: () => void
  stopWatchingEvents: () => void
  approve: (token: string, spender: Address, amount: string) => Promise<string>
  transfer: (token: string, to: Address, amount: string) => Promise<string>
  mint: (token: BuiltInToken, amount: string) => Promise<string>
  clearTransactionStatus: () => void
}

const TOKENS: Record<BuiltInToken, { addr: `0x${string}`; decimals: number }> = {
  DAI: { addr: DAI, decimals: 18 },
  USDC: { addr: USDC, decimals: 6 }
}

function getTokenConfig(symbol: string): { addr: `0x${string}`; decimals: number } | undefined {
  if (symbol in TOKENS) return TOKENS[symbol as BuiltInToken]
  const custom = useCustomTokensStore.getState().tokens.find(
    (t) => t.symbol === symbol
  )
  if (custom) return { addr: custom.address as `0x${string}`, decimals: custom.decimals }
  return undefined
}

const EVENTS_STORAGE_KEY = 'onchain_events'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function loadEvents(): AppEvent[] {
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY)
    if (!stored) return []
    const events: AppEvent[] = JSON.parse(stored)
    // Fix legacy events: Transfer from zero address should be Mint
    return events.map(e =>
      e.type === 'Transfer' && e.from?.toLowerCase() === ZERO_ADDRESS
        ? { ...e, type: 'Mint' }
        : e
    )
  } catch {
    return []
  }
}

function saveEvents(events: AppEvent[]) {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
  } catch {
    // localStorage full or unavailable
  }
}

function addEvent(currentEvents: AppEvent[], newEvent: AppEvent): AppEvent[] {
  // Avoid duplicates by tx hash
  if (currentEvents.some(e => e.tx === newEvent.tx && e.type === newEvent.type)) {
    return currentEvents
  }
  const updated = [...currentEvents, newEvent]
  saveEvents(updated)
  return updated
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isConnected: false,
  account: undefined,
  chainId: undefined,
  balances: { DAI: '0', USDC: '0' },
  nativeBalance: '0',
  isLoadingBalances: false,
  transactionStatus: 'idle',
  transactionHash: undefined,
  transactionError: undefined,
  events: loadEvents(),
  isLoadingEvents: false,

  setConnection: (isConnected, account, chainId) => {
    set({ isConnected, account, chainId })
    if (isConnected && account && chainId === sepolia.id) {
      get().fetchBalances()
      get().fetchOnChainEvents()
      get().startWatchingEvents()
    } else {
      get().stopWatchingEvents()
    }
  },

  fetchBalances: async () => {
    const { account, isConnected } = get()
    if (!account || !isConnected) return

    set({ isLoadingBalances: true })
    try {
      const pc = getPublicClient(config)

      const [daiBalance, usdcBalance, nativeRaw] = await Promise.all([
        pc.readContract({
          address: DAI,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [account]
        }),
        pc.readContract({
          address: USDC,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [account]
        }),
        pc.getBalance({ address: account })
      ])

      const newBalances: Balances = {
        DAI: formatUnits(daiBalance as bigint, 18),
        USDC: formatUnits(usdcBalance as bigint, 6)
      }

      // Fetch custom token balances
      const customTokens = useCustomTokensStore.getState().tokens
      for (const ct of customTokens) {
        try {
          const bal = await pc.readContract({
            address: ct.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [account]
          })
          newBalances[ct.symbol] = formatUnits(bal as bigint, ct.decimals)
        } catch {
          newBalances[ct.symbol] = '0'
        }
      }

      set({
        balances: newBalances,
        nativeBalance: formatUnits(nativeRaw as bigint, 18)
      })

      useBalanceHistoryStore.getState().addSnapshot(newBalances)
    } catch (error: unknown) {
      console.error('Error fetching balances:', error)
    } finally {
      set({ isLoadingBalances: false })
    }
  },

  fetchOnChainEvents: async () => {
    const { account, isConnected, chainId } = get()
    if (!account || !isConnected || chainId !== sepolia.id) return

    set({ isLoadingEvents: true })
    try {
      const pc = getPublicClient(config)

      // Fetch last ~50000 blocks (~7 days on Sepolia) of events for both tokens
      const currentBlock = await pc.getBlockNumber()
      const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n

      const fetchTokenEvents = async (tokenAddr: `0x${string}`, tokenName: string) => {
        const [transfers, approvals] = await Promise.all([
          pc.getLogs({
            address: tokenAddr,
            event: {
              type: 'event',
              name: 'Transfer',
              inputs: [
                { name: 'from', type: 'address', indexed: true },
                { name: 'to', type: 'address', indexed: true },
                { name: 'value', type: 'uint256', indexed: false }
              ]
            },
            args: { from: account },
            fromBlock,
            toBlock: 'latest'
          }),
          pc.getLogs({
            address: tokenAddr,
            event: {
              type: 'event',
              name: 'Approval',
              inputs: [
                { name: 'owner', type: 'address', indexed: true },
                { name: 'spender', type: 'address', indexed: true },
                { name: 'value', type: 'uint256', indexed: false }
              ]
            },
            args: { owner: account },
            fromBlock,
            toBlock: 'latest'
          })
        ])

        // Also fetch incoming transfers
        const incomingTransfers = await pc.getLogs({
          address: tokenAddr,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { name: 'from', type: 'address', indexed: true },
              { name: 'to', type: 'address', indexed: true },
              { name: 'value', type: 'uint256', indexed: false }
            ]
          },
          args: { to: account },
          fromBlock,
          toBlock: 'latest'
        })

        const allLogs = [...transfers, ...incomingTransfers, ...approvals]
        const uniqueBlocks = [...new Set(allLogs.map(l => l.blockNumber).filter(Boolean))]
        const blockTimestamps = new Map<bigint, number>()
        await Promise.all(
          uniqueBlocks.map(async (bn) => {
            try {
              const block = await pc.getBlock({ blockNumber: bn })
              blockTimestamps.set(bn, Number(block.timestamp) * 1000)
            } catch { /* ignore */ }
          })
        )

        const tokenConf = getTokenConfig(tokenName)
        const decimals = tokenConf?.decimals ?? 18
        const transferEvents: AppEvent[] = transfers.map(log => ({
          type: (log.args.from as string).toLowerCase() === ZERO_ADDRESS ? 'Mint' : 'Transfer',
          token: tokenName,
          amount: formatUnits(log.args.value as bigint, decimals),
          from: log.args.from as string,
          to: log.args.to as string,
          tx: log.transactionHash,
          timestamp: blockTimestamps.get(log.blockNumber) ?? undefined,
          source: 'onchain' as const
        }))

        const incomingEvents: AppEvent[] = incomingTransfers
          .filter(log => (log.args.from as string).toLowerCase() !== account.toLowerCase())
          .map(log => ({
            type: (log.args.from as string).toLowerCase() === ZERO_ADDRESS ? 'Mint' : 'Transfer',
            token: tokenName,
            amount: formatUnits(log.args.value as bigint, decimals),
            from: log.args.from as string,
            to: log.args.to as string,
            tx: log.transactionHash,
            timestamp: blockTimestamps.get(log.blockNumber) ?? undefined,
            source: 'onchain' as const
          }))

        const approvalEvents: AppEvent[] = approvals.map(log => ({
          type: 'Approval',
          token: tokenName,
          amount: formatUnits(log.args.value as bigint, decimals),
          from: log.args.owner as string,
          to: log.args.spender as string,
          tx: log.transactionHash,
          timestamp: blockTimestamps.get(log.blockNumber) ?? undefined,
          source: 'onchain' as const
        }))

        return [...transferEvents, ...incomingEvents, ...approvalEvents]
      }

      const [daiEvents, usdcEvents] = await Promise.all([
        fetchTokenEvents(DAI, 'DAI'),
        fetchTokenEvents(USDC, 'USDC')
      ])

      const onChainEvents = [...daiEvents, ...usdcEvents]

      // Merge with existing local events, avoiding duplicates + backfill timestamps
      const existing = get().events
      const onChainMap = new Map(onChainEvents.map(e => [`${e.tx}-${e.type}`, e]))

      // Update existing events that are missing timestamps
      let updated = false
      const patched = existing.map(e => {
        if (!e.timestamp) {
          const match = onChainMap.get(`${e.tx}-${e.type}`)
          if (match?.timestamp) {
            updated = true
            return { ...e, timestamp: match.timestamp }
          }
        }
        return e
      })

      const existingTxSet = new Set(patched.map(e => `${e.tx}-${e.type}`))
      const newEvents = onChainEvents.filter(e => !existingTxSet.has(`${e.tx}-${e.type}`))

      if (newEvents.length > 0 || updated) {
        const merged = [...patched, ...newEvents]
        saveEvents(merged)
        set({ events: merged })
      }
    } catch (error: unknown) {
      console.error('Error fetching on-chain events:', error)
    } finally {
      set({ isLoadingEvents: false })
    }
  },

  startWatchingEvents: () => {
    const { account, isConnected, chainId } = get()
    if (!account || !isConnected || chainId !== sepolia.id) return

    // Stop any existing watchers
    get().stopWatchingEvents()

    const pc = getPublicClient(config)
    const unwatchers: (() => void)[] = []

    const handleTransferLog = (tokenName: string, decimals: number) => (logs: unknown[]) => {
      for (const log of logs) {
        const l = log as { args: { from: string; to: string; value: bigint }; transactionHash: string }
        const isMint = l.args.from.toLowerCase() === ZERO_ADDRESS
        const event: AppEvent = {
          type: isMint ? 'Mint' : 'Transfer',
          token: tokenName,
          amount: formatUnits(l.args.value, decimals),
          from: l.args.from,
          to: l.args.to,
          tx: l.transactionHash,
          timestamp: Date.now(),
          source: 'onchain'
        }
        set({ events: addEvent(get().events, event) })
      }
      // Refresh balances on new events
      get().fetchBalances()
    }

    const handleApprovalLog = (tokenName: string, decimals: number) => (logs: unknown[]) => {
      for (const log of logs) {
        const l = log as { args: { owner: string; spender: string; value: bigint }; transactionHash: string }
        const event: AppEvent = {
          type: 'Approval',
          token: tokenName,
          amount: formatUnits(l.args.value, decimals),
          from: l.args.owner,
          to: l.args.spender,
          tx: l.transactionHash,
          timestamp: Date.now(),
          source: 'onchain'
        }
        set({ events: addEvent(get().events, event) })
      }
    }

    const transferEvent = {
      type: 'event' as const,
      name: 'Transfer' as const,
      inputs: [
        { name: 'from', type: 'address' as const, indexed: true },
        { name: 'to', type: 'address' as const, indexed: true },
        { name: 'value', type: 'uint256' as const, indexed: false }
      ]
    }

    const approvalEvent = {
      type: 'event' as const,
      name: 'Approval' as const,
      inputs: [
        { name: 'owner', type: 'address' as const, indexed: true },
        { name: 'spender', type: 'address' as const, indexed: true },
        { name: 'value', type: 'uint256' as const, indexed: false }
      ]
    }

    // Watch transfers FROM the user (outgoing + mints)
    for (const [tokenName, tokenInfo] of Object.entries(TOKENS) as [BuiltInToken, { addr: `0x${string}`; decimals: number }][]) {
      unwatchers.push(
        pc.watchEvent({
          address: tokenInfo.addr,
          event: transferEvent,
          args: { from: account },
          onLogs: handleTransferLog(tokenName, tokenInfo.decimals)
        })
      )
      // Watch transfers TO the user (incoming)
      unwatchers.push(
        pc.watchEvent({
          address: tokenInfo.addr,
          event: transferEvent,
          args: { to: account },
          onLogs: handleTransferLog(tokenName, tokenInfo.decimals)
        })
      )
      // Watch approvals
      unwatchers.push(
        pc.watchEvent({
          address: tokenInfo.addr,
          event: approvalEvent,
          args: { owner: account },
          onLogs: handleApprovalLog(tokenName, tokenInfo.decimals)
        })
      )
    }

    // Store unwatchers for cleanup
    ;(window as unknown as Record<string, unknown>).__onchain_unwatchers = unwatchers
  },

  stopWatchingEvents: () => {
    const unwatchers = (window as unknown as Record<string, unknown>).__onchain_unwatchers as (() => void)[] | undefined
    if (unwatchers) {
      unwatchers.forEach(unwatch => unwatch())
      ;(window as unknown as Record<string, unknown>).__onchain_unwatchers = undefined
    }
  },

  approve: async (t, spender, amount) => {
    const { account, chainId, isConnected } = get()
    if (!account || !isConnected) throw new Error('Please connect your wallet first')
    if (chainId !== sepolia.id) throw new Error('Please switch to Sepolia network')

    const tc = getTokenConfig(t)
    if (!tc) throw new Error(`Unknown token: ${t}`)

    set({ transactionStatus: 'pending', transactionError: undefined })

    try {
      const wc = await getWalletClient(config)
      if (!wc) throw new Error('Wallet not available. Please check your connection.')

      const value = parseUnits(amount, tc.decimals)

      const hash = await wc.writeContract({
        address: tc.addr,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, value],
        chain: sepolia
      })

      // Wait for transaction receipt
      set({ transactionStatus: 'confirming', transactionHash: hash })
      const pc = getPublicClient(config)
      await pc.waitForTransactionReceipt({ hash, pollingInterval: 4_000, timeout: 120_000 })

      const newEvent: AppEvent = { type: 'Approval', token: t, amount, from: account, to: spender, tx: hash, timestamp: Date.now(), source: 'local' }
      set({
        transactionStatus: 'success',
        transactionHash: hash,
        events: addEvent(get().events, newEvent)
      })

      useToastStore.getState().addToast({ message: 'Approval confirmed', severity: 'success', txHash: hash, autoHideDuration: 5000 })
      setTimeout(() => get().fetchBalances(), 1000)
      return hash
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed. Please try again.'
      set({
        transactionStatus: 'error',
        transactionError: errorMessage
      })
      useToastStore.getState().addToast({ message: errorMessage, severity: 'error', autoHideDuration: 0 })
      throw new Error(errorMessage)
    }
  },

  transfer: async (t, to, amount) => {
    const { account, balances, chainId, isConnected } = get()
    if (!account || !isConnected) throw new Error('Please connect your wallet first')
    if (chainId !== sepolia.id) throw new Error('Please switch to Sepolia network')
    if (Number(amount) > Number(balances[t] ?? '0')) throw new Error(`Insufficient ${t} balance. You have ${balances[t] ?? '0'} ${t}`)

    const tc = getTokenConfig(t)
    if (!tc) throw new Error(`Unknown token: ${t}`)

    set({ transactionStatus: 'pending', transactionError: undefined })

    try {
      const wc = await getWalletClient(config)
      if (!wc) throw new Error('Wallet not available. Please check your connection.')

      const value = parseUnits(amount, tc.decimals)

      const hash = await wc.writeContract({
        address: tc.addr,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, value],
        chain: sepolia
      })

      // Wait for transaction receipt
      set({ transactionStatus: 'confirming', transactionHash: hash })
      const pc = getPublicClient(config)
      await pc.waitForTransactionReceipt({ hash, pollingInterval: 4_000, timeout: 120_000 })

      const newEvent: AppEvent = { type: 'Transfer', token: t, amount, from: account, to, tx: hash, timestamp: Date.now(), source: 'local' }
      set({
        transactionStatus: 'success',
        transactionHash: hash,
        events: addEvent(get().events, newEvent)
      })

      useToastStore.getState().addToast({ message: 'Transfer confirmed', severity: 'success', txHash: hash, autoHideDuration: 5000 })
      setTimeout(() => get().fetchBalances(), 1000)
      return hash
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed'
      set({
        transactionStatus: 'error',
        transactionError: errorMessage
      })
      useToastStore.getState().addToast({ message: errorMessage, severity: 'error', autoHideDuration: 0 })
      throw new Error(errorMessage)
    }
  },

  mint: async (t, amount) => {
    const { account, chainId, isConnected } = get()
    if (!account || !isConnected) throw new Error('Please connect your wallet first')
    if (chainId !== sepolia.id) throw new Error('Please switch to Sepolia network')

    const tc = TOKENS[t]
    if (!tc) throw new Error(`Unknown token: ${t}`)

    set({ transactionStatus: 'pending', transactionError: undefined })

    try {
      const wc = await getWalletClient(config)
      if (!wc) throw new Error('Wallet not available. Please check your connection.')

      const value = parseUnits(amount, tc.decimals)

      const hash = await wc.writeContract({
        address: tc.addr,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [account, value],
        chain: sepolia
      })

      // Wait for transaction receipt
      set({ transactionStatus: 'confirming', transactionHash: hash })
      const pc = getPublicClient(config)
      await pc.waitForTransactionReceipt({ hash, pollingInterval: 4_000, timeout: 120_000 })

      const newEvent: AppEvent = { type: 'Mint', token: t, amount, from: account, to: account, tx: hash, timestamp: Date.now(), source: 'local' }
      set({
        transactionStatus: 'success',
        transactionHash: hash,
        events: addEvent(get().events, newEvent)
      })

      useToastStore.getState().addToast({ message: 'Tokens minted', severity: 'success', txHash: hash, autoHideDuration: 5000 })
      setTimeout(() => get().fetchBalances(), 1000)
      return hash
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed'
      set({
        transactionStatus: 'error',
        transactionError: errorMessage
      })
      useToastStore.getState().addToast({ message: errorMessage, severity: 'error', autoHideDuration: 0 })
      throw new Error(errorMessage)
    }
  },

  clearTransactionStatus: () => {
    set({
      transactionStatus: 'idle',
      transactionHash: undefined,
      transactionError: undefined
    })
  }
}))
