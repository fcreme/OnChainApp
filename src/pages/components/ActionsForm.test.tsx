import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ActionsForm from './ActionsForm'

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

describe('ActionsForm', () => {
  const mockUseAppStore = vi.fn()
  const mockUseAccount = vi.fn()
  const mockUseChainId = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockUseAppStore.mockReturnValue({
      approve: vi.fn(),
      transfer: vi.fn(),
      mint: vi.fn(),
      transactionStatus: 'idle',
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

  it('should render form elements', () => {
    render(<ActionsForm />)
    
    expect(screen.getByText('Token')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('Address (spender or recipient)')).toBeInTheDocument()
    expect(screen.getByText('APPROVE')).toBeInTheDocument()
    expect(screen.getByText('TRANSFER')).toBeInTheDocument()
    expect(screen.getByText('MINT')).toBeInTheDocument()
  })

  it('should show connect wallet message when not connected', () => {
    mockUseAccount.mockReturnValue({ isConnected: false })
    
    render(<ActionsForm />)
    expect(screen.getByText('Please connect your wallet to interact with the contracts')).toBeInTheDocument()
  })

  it('should show wrong network message when on wrong network', () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(1) // Mainnet instead of Sepolia
    
    render(<ActionsForm />)
    expect(screen.getByText('Please switch to Sepolia network to interact with the contracts')).toBeInTheDocument()
  })

  it('should disable buttons when not connected', () => {
    mockUseAccount.mockReturnValue({ isConnected: false })
    
    render(<ActionsForm />)
    
    const approveButton = screen.getByText('APPROVE')
    const transferButton = screen.getByText('TRANSFER')
    const mintButton = screen.getByText('MINT')
    
    expect(approveButton).toBeDisabled()
    expect(transferButton).toBeDisabled()
    expect(mintButton).toBeDisabled()
  })

  it('should disable buttons when on wrong network', () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(1) // Mainnet instead of Sepolia
    
    render(<ActionsForm />)
    
    const approveButton = screen.getByText('APPROVE')
    const transferButton = screen.getByText('TRANSFER')
    const mintButton = screen.getByText('MINT')
    
    expect(approveButton).toBeDisabled()
    expect(transferButton).toBeDisabled()
    expect(mintButton).toBeDisabled()
  })

  it('should disable buttons when transaction is pending', () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      approve: vi.fn(),
      transfer: vi.fn(),
      mint: vi.fn(),
      transactionStatus: 'pending',
    })
    
    render(<ActionsForm />)
    
    const approveButton = screen.getByText('Processing...')
    const transferButton = screen.getByText('Processing...')
    const mintButton = screen.getByText('Processing...')
    
    expect(approveButton).toBeDisabled()
    expect(transferButton).toBeDisabled()
    expect(mintButton).toBeDisabled()
  })

  it('should enable buttons when connected to correct network', () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      approve: vi.fn(),
      transfer: vi.fn(),
      mint: vi.fn(),
      transactionStatus: 'idle',
    })
    
    render(<ActionsForm />)
    
    const approveButton = screen.getByText('APPROVE')
    const transferButton = screen.getByText('TRANSFER')
    const mintButton = screen.getByText('MINT')
    
    expect(approveButton).not.toBeDisabled()
    expect(transferButton).not.toBeDisabled()
    expect(mintButton).not.toBeDisabled()
  })

  it('should have correct form inputs', () => {
    render(<ActionsForm />)
    
    expect(screen.getByRole('combobox', { name: 'Token' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.0')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()
  })

  it('should have DAI and USDC options in token select', () => {
    render(<ActionsForm />)
    
    const tokenSelect = screen.getByRole('combobox', { name: 'Token' })
    expect(tokenSelect).toHaveValue('DAI')
    
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('DAI')
    expect(options[1]).toHaveTextContent('USDC')
  })

  it('should show error message when validation fails', async () => {
    const mockApprove = vi.fn().mockRejectedValue(new Error('Invalid amount'))
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      approve: mockApprove,
      transfer: vi.fn(),
      mint: vi.fn(),
      transactionStatus: 'idle',
    })
    
    render(<ActionsForm />)
    
    // Fill form with invalid data
    const amountInput = screen.getByPlaceholderText('0.0')
    const addressInput = screen.getByPlaceholderText('0x...')
    const approveButton = screen.getByText('APPROVE')
    
    fireEvent.change(amountInput, { target: { value: '0' } })
    fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    fireEvent.click(approveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid amount')).toBeInTheDocument()
    })
  })

  it('should call approve function when approve button is clicked', async () => {
    const mockApprove = vi.fn().mockResolvedValue('0x123')
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      approve: mockApprove,
      transfer: vi.fn(),
      mint: vi.fn(),
      transactionStatus: 'idle',
    })
    
    render(<ActionsForm />)
    
    // Fill form with valid data
    const amountInput = screen.getByPlaceholderText('0.0')
    const addressInput = screen.getByPlaceholderText('0x...')
    const approveButton = screen.getByText('APPROVE')
    
    fireEvent.change(amountInput, { target: { value: '100' } })
    fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    fireEvent.click(approveButton)
    
    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith('DAI', '0x1234567890123456789012345678901234567890', '100')
    })
  })

  it('should call transfer function when transfer button is clicked', async () => {
    const mockTransfer = vi.fn().mockResolvedValue('0x123')
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      approve: vi.fn(),
      transfer: mockTransfer,
      mint: vi.fn(),
      transactionStatus: 'idle',
    })
    
    render(<ActionsForm />)
    
    // Fill form with valid data
    const amountInput = screen.getByPlaceholderText('0.0')
    const addressInput = screen.getByPlaceholderText('0x...')
    const transferButton = screen.getByText('TRANSFER')
    
    fireEvent.change(amountInput, { target: { value: '50' } })
    fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    fireEvent.click(transferButton)
    
    await waitFor(() => {
      expect(mockTransfer).toHaveBeenCalledWith('DAI', '0x1234567890123456789012345678901234567890', '50')
    })
  })

  it('should call mint function when mint button is clicked', async () => {
    const mockMint = vi.fn().mockResolvedValue('0x123')
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockUseChainId.mockReturnValue(11155111) // Sepolia
    mockUseAppStore.mockReturnValue({
      approve: vi.fn(),
      transfer: vi.fn(),
      mint: mockMint,
      transactionStatus: 'idle',
    })
    
    render(<ActionsForm />)
    
    // Fill form with valid data
    const amountInput = screen.getByPlaceholderText('0.0')
    const mintButton = screen.getByText('MINT')
    
    fireEvent.change(amountInput, { target: { value: '1000' } })
    fireEvent.click(mintButton)
    
    await waitFor(() => {
      expect(mockMint).toHaveBeenCalledWith('DAI', '1000')
    })
  })
})
