import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BalancesCard from './BalancesCard'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
}))

// Mock the store
vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn(),
}))

// Mock sepolia chain
vi.mock('wagmi/chains', () => ({
  sepolia: { id: 11155111 },
}))

describe('BalancesCard', () => {
  const mockUseAppStore = vi.fn()
  const mockUseAccount = vi.fn()
  const mockUseChainId = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockUseAppStore.mockReturnValue({
      balances: { DAI: '0', USDC: '0' },
      balancesLoading: false,
      fetchBalances: vi.fn(),
    })
    
    mockUseAccount.mockReturnValue({
      isConnected: false,
    })
    
    mockUseChainId.mockReturnValue(1) // Mainnet by default

    // Apply mocks
    vi.doMock('../store/useAppStore', () => ({
      useAppStore: mockUseAppStore,
    }))
    
    vi.doMock('wagmi', () => ({
      useAccount: mockUseAccount,
      useChainId: mockUseChainId,
    }))
  })

  it('should render token balances title', () => {
    render(<BalancesCard />)
    expect(screen.getByText('Token Balances')).toBeInTheDocument()
  })

  it('should show connect wallet message when not connected', () => {
    mockUseAccount.mockReturnValue({ isConnected: false })
    
    render(<BalancesCard />)
    expect(screen.getByText('Connect your wallet to see balances')).toBeInTheDocument()
  })

  it('should show wrong network message when on wrong network', () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(1) // Mainnet instead of Sepolia
    
    render(<BalancesCard />)
    expect(screen.getByText('Please switch to Sepolia network')).toBeInTheDocument()
  })

  it('should show loading state when fetching balances', () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      balances: { DAI: '0', USDC: '0' },
      balancesLoading: true,
      fetchBalances: vi.fn(),
    })
    
    render(<BalancesCard />)
    expect(screen.getByText('Loading balances...')).toBeInTheDocument()
  })

  it('should display balances when connected to correct network', () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      balances: { DAI: '100.5', USDC: '50.25' },
      balancesLoading: false,
      fetchBalances: vi.fn(),
    })
    
    render(<BalancesCard />)
    expect(screen.getByText('DAI: 100.5')).toBeInTheDocument()
    expect(screen.getByText('USDC: 50.25')).toBeInTheDocument()
  })

  it('should show refresh button when connected to correct network', () => {
    const mockFetchBalances = vi.fn()
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      balances: { DAI: '100', USDC: '50' },
      balancesLoading: false,
      fetchBalances: mockFetchBalances,
    })
    
    render(<BalancesCard />)
    const refreshButton = screen.getByText('Refresh')
    expect(refreshButton).toBeInTheDocument()
  })

  it('should call fetchBalances when refresh button is clicked', () => {
    const mockFetchBalances = vi.fn()
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      balances: { DAI: '100', USDC: '50' },
      balancesLoading: false,
      fetchBalances: mockFetchBalances,
    })
    
    render(<BalancesCard />)
    const refreshButton = screen.getByText('Refresh')
    
    fireEvent.click(refreshButton)
    expect(mockFetchBalances).toHaveBeenCalledTimes(1)
  })

  it('should not show refresh button when loading', () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      balances: { DAI: '100', USDC: '50' },
      balancesLoading: true,
      fetchBalances: vi.fn(),
    })
    
    render(<BalancesCard />)
    expect(screen.queryByText('Refresh')).not.toBeInTheDocument()
  })

  it('should handle zero balances display', () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      balances: { DAI: '0', USDC: '0' },
      balancesLoading: false,
      fetchBalances: vi.fn(),
    })
    
    render(<BalancesCard />)
    expect(screen.getByText('DAI: 0')).toBeInTheDocument()
    expect(screen.getByText('USDC: 0')).toBeInTheDocument()
  })
})
