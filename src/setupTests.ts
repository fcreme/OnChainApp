import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Zustand store globally
const mockStore = {
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

// Mock the entire useAppStore module
vi.mock('./pages/store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    if (selector) {
      return selector(mockStore)
    }
    return mockStore
  })
}))

// Mock wagmi hooks
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useAccount: vi.fn(() => ({
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      isConnected: true,
      isConnecting: false,
      isDisconnected: false
    })),
    useChainId: vi.fn(() => 11155111), // Sepolia
    useSwitchChain: vi.fn(() => ({
      switchChain: vi.fn(),
      isPending: false
    }))
  }
})

// Mock RainbowKit
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => React.createElement('div', { 'data-testid': 'connect-button' }, 'Connect Wallet')
}))

// Export mock store for individual test customization
export { mockStore }