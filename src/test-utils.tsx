import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { vi } from 'vitest'

// Mock Zustand store
export const mockUseAppStore = {
  balances: { DAI: '100.0', USDC: '50.0' },
  decimals: { DAI: 18, USDC: 6 },
  balancesLoading: false,
  transactionStatus: 'idle' as const,
  transactionHash: undefined,
  transactionError: undefined,
  events: [],
  isConnected: true,
  isWrongNetwork: false,
  chainId: 11155111, // Sepolia
  account: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' as const,
  setSession: vi.fn(),
  setConnectionStatus: vi.fn(),
  fetchBalances: vi.fn(),
  approve: vi.fn(),
  transfer: vi.fn(),
  mint: vi.fn(),
  clearTransactionStatus: vi.fn()
}

// Mock wagmi hooks
export const mockUseAccount = {
  address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' as const,
  isConnected: true,
  isConnecting: false,
  isDisconnected: false
}

export const mockUseChainId = 11155111 // Sepolia

export const mockUseSwitchChain = {
  switchChain: vi.fn(),
  isPending: false
}

// Custom render function with providers
export function renderWithProviders(ui: ReactElement) {
  return render(ui)
}

// Mock the entire useAppStore module
vi.mock('../pages/store/useAppStore', () => ({
  useAppStore: vi.fn(() => mockUseAppStore)
}))

// Mock wagmi hooks
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useAccount: vi.fn(() => mockUseAccount),
    useChainId: vi.fn(() => mockUseChainId),
    useSwitchChain: vi.fn(() => mockUseSwitchChain)
  }
})

// Mock RainbowKit
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <div data-testid="connect-button">Connect Wallet</div>
}))
