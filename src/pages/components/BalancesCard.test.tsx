import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { sepolia } from 'wagmi/chains'
import { theme } from '../../theme'
import { useAppStore } from '../store/useAppStore'
import { useCustomTokensStore } from '../../stores/useCustomTokensStore'
import BalancesCard from './BalancesCard'

// src/lib/web3 builds a live wagmi config and boots the WalletConnect/AppKit
// modal (a real HTTP call) at import time. AddTokenDialog pulls it in, so stub
// the one export it uses — wallet/RPC wiring is genuinely external.
vi.mock('../../lib/web3', () => ({ config: {} }))

// jsdom has no ResizeObserver; the card observes its scroller with one.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (NoopResizeObserver as never)

// useAppStore is mocked globally in src/setupTests.ts; drive it per test.
const mockUseAppStore = useAppStore as unknown as Mock

type StoreOverrides = {
  balances?: Record<string, string>
  fetchBalances?: Mock
  isConnected?: boolean
  chainId?: number
  isLoadingBalances?: boolean
}

function setStore(overrides: StoreOverrides = {}) {
  const full = {
    balances: { DAI: '0', USDC: '0' },
    fetchBalances: vi.fn(),
    isConnected: true,
    chainId: sepolia.id,
    isLoadingBalances: false,
    ...overrides,
  }
  mockUseAppStore.mockImplementation((selector?: (s: typeof full) => unknown) =>
    selector ? selector(full) : full
  )
  return full
}

function renderCard() {
  return render(
    <ThemeProvider theme={theme}>
      <BalancesCard />
    </ThemeProvider>
  )
}

describe('BalancesCard', () => {
  beforeEach(() => {
    useCustomTokensStore.setState({ tokens: [] })
    setStore()
  })

  it('asks the user to connect instead of showing balances when disconnected', () => {
    const store = setStore({ isConnected: false })

    renderCard()

    expect(screen.getByText('Connect your wallet to see balances')).toBeInTheDocument()
    expect(screen.queryByTestId('dai-balance')).not.toBeInTheDocument()
    expect(store.fetchBalances).not.toHaveBeenCalled()
  })

  it('asks the user to switch network instead of fetching on the wrong chain', () => {
    const store = setStore({ chainId: 1 })

    renderCard()

    expect(screen.getByText('Please switch to Sepolia network')).toBeInTheDocument()
    expect(screen.queryByTestId('dai-balance')).not.toBeInTheDocument()
    expect(store.fetchBalances).not.toHaveBeenCalled()
  })

  it('fetches balances on mount once connected to Sepolia', () => {
    const store = setStore()

    renderCard()

    expect(store.fetchBalances).toHaveBeenCalledTimes(1)
  })

  it('shows placeholders and hides the refresh control while balances load', () => {
    setStore({ isLoadingBalances: true })

    renderCard()

    expect(screen.getByText('Token Balances')).toBeInTheDocument()
    expect(screen.queryByTestId('refresh-balances')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dai-balance')).not.toBeInTheDocument()
  })

  it('shows each built-in token balance with thousands separators and 2 decimals', () => {
    setStore({ balances: { DAI: '1234.5', USDC: '50.256789' } })

    renderCard()

    expect(screen.getByTestId('dai-balance')).toHaveTextContent('1,234.50')
    expect(screen.getByTestId('usdc-balance')).toHaveTextContent('50.2568')
    expect(screen.getByText('DAI Balance')).toBeInTheDocument()
    expect(screen.getByText('USDC Balance')).toBeInTheDocument()
  })

  it('shows 0.00 for a zero or unparseable balance', () => {
    setStore({ balances: { DAI: '0', USDC: 'n/a' } })

    renderCard()

    expect(screen.getByTestId('dai-balance')).toHaveTextContent('0.00')
    expect(screen.getByTestId('usdc-balance')).toHaveTextContent('0.00')
  })

  it('re-fetches balances when the refresh control is used', () => {
    const store = setStore()

    renderCard()
    const callsAfterMount = store.fetchBalances.mock.calls.length

    fireEvent.click(screen.getByTestId('refresh-balances'))

    expect(store.fetchBalances.mock.calls.length).toBe(callsAfterMount + 1)
  })

  it('shows a card for each custom token alongside the built-in ones', () => {
    useCustomTokensStore.setState({
      tokens: [
        { address: '0x3333333333333333333333333333333333333333', symbol: 'WAGMI', name: 'Wagmi Token', decimals: 18 },
      ],
    })
    setStore({ balances: { DAI: '0', USDC: '0', WAGMI: '7.5' } })

    renderCard()

    expect(screen.getByText('WAGMI')).toBeInTheDocument()
    expect(screen.getByText('Wagmi Token')).toBeInTheDocument()
    expect(screen.getByText('7.50')).toBeInTheDocument()
  })

  it('opens the add-token dialog from the "Add token" card', () => {
    renderCard()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Add token'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
