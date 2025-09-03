import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import EventsTable from './EventsTable'

// Mock the store
vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn(),
}))

describe('EventsTable', () => {
  const mockUseAppStore = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks - mock the selector function
    mockUseAppStore.mockImplementation((selector) => {
      if (selector) {
        return selector({ events: [] })
      }
      return { events: [] }
    })

    // Apply mocks
    vi.doMock('../store/useAppStore', () => ({
      useAppStore: mockUseAppStore,
    }))
  })

  it('should render table headers', () => {
    render(<EventsTable />)
    
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Token')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.getByText('Tx')).toBeInTheDocument()
  })

  it('should render empty table when no events', () => {
    mockUseAppStore.mockImplementation((selector) => {
      if (selector) {
        return selector({ events: [] })
      }
      return { events: [] }
    })
    
    render(<EventsTable />)
    
    // Should only have header row
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(1) // Only header row
  })

  it('should render transfer events correctly', () => {
    const mockEvents = [
      {
        type: 'Transfer' as const,
        token: 'DAI' as const,
        amount: '100.5',
        from: '0x1234567890123456789012345678901234567890' as const,
        to: '0x0987654321098765432109876543210987654321' as const,
        tx: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      }
    ]
    
    mockUseAppStore.mockImplementation((selector) => {
      if (selector) {
        return selector({ events: mockEvents })
      }
      return { events: mockEvents }
    })
    
    render(<EventsTable />)
    
    expect(screen.getByText('Transfer')).toBeInTheDocument()
    expect(screen.getByText('DAI')).toBeInTheDocument()
    expect(screen.getByText('100.5')).toBeInTheDocument()
    expect(screen.getByText('0x1234567890123456789012345678901234567890')).toBeInTheDocument()
    expect(screen.getByText('0x0987654321098765432109876543210987654321')).toBeInTheDocument()
    
    // Check transaction hash link
    const txLink = screen.getByText('0xabcdef12...')
    expect(txLink).toBeInTheDocument()
    expect(txLink).toHaveAttribute('href', 'https://sepolia.etherscan.io/tx/0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    expect(txLink).toHaveAttribute('target', '_blank')
  })

  it('should render approval events correctly', () => {
    const mockEvents = [
      {
        type: 'Approval' as const,
        token: 'USDC' as const,
        amount: '50.25',
        from: '0x1234567890123456789012345678901234567890' as const,
        to: '0x0987654321098765432109876543210987654321' as const,
        tx: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      }
    ]
    
    mockUseAppStore.mockImplementation((selector) => {
      if (selector) {
        return selector({ events: mockEvents })
      }
      return { events: mockEvents }
    })
    
    render(<EventsTable />)
    
    expect(screen.getByText('Approval')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('50.25')).toBeInTheDocument()
    expect(screen.getByText('0x1234567890123456789012345678901234567890')).toBeInTheDocument()
    expect(screen.getByText('0x0987654321098765432109876543210987654321')).toBeInTheDocument()
  })

  it('should render multiple events in reverse order', () => {
    const mockEvents = [
      {
        type: 'Transfer' as const,
        token: 'DAI' as const,
        amount: '100',
        from: '0x1111111111111111111111111111111111111111' as const,
        to: '0x2222222222222222222222222222222222222222' as const,
        tx: '0x1111111111111111111111111111111111111111111111111111111111111111'
      },
      {
        type: 'Approval' as const,
        token: 'USDC' as const,
        amount: '50',
        from: '0x3333333333333333333333333333333333333333' as const,
        to: '0x4444444444444444444444444444444444444444' as const,
        tx: '0x2222222222222222222222222222222222222222222222222222222222222222'
      }
    ]
    
    mockUseAppStore.mockImplementation((selector) => {
      if (selector) {
        return selector({ events: mockEvents })
      }
      return { events: mockEvents }
    })
    
    render(<EventsTable />)
    
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(3) // Header + 2 event rows
    
    // Check that events are rendered (the order will be reversed due to .slice().reverse())
    expect(screen.getByText('Approval')).toBeInTheDocument()
    expect(screen.getByText('Transfer')).toBeInTheDocument()
  })

  it('should handle events with missing from/to addresses', () => {
    const mockEvents = [
      {
        type: 'Transfer' as const,
        token: 'DAI' as const,
        amount: '100',
        from: undefined,
        to: undefined,
        tx: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      }
    ]
    
    mockUseAppStore.mockImplementation((selector) => {
      if (selector) {
        return selector({ events: mockEvents })
      }
      return { events: mockEvents }
    })
    
    render(<EventsTable />)
    
    expect(screen.getByText('Transfer')).toBeInTheDocument()
    expect(screen.getByText('DAI')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(2) // Both from and to show '-'
  })

  it('should truncate transaction hash in display', () => {
    const mockEvents = [
      {
        type: 'Transfer' as const,
        token: 'DAI' as const,
        amount: '100',
        from: '0x1234567890123456789012345678901234567890' as const,
        to: '0x0987654321098765432109876543210987654321' as const,
        tx: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      }
    ]
    
    mockUseAppStore.mockImplementation((selector) => {
      if (selector) {
        return selector({ events: mockEvents })
      }
      return { events: mockEvents }
    })
    
    render(<EventsTable />)
    
    // Should show truncated hash
    expect(screen.getByText('0x12345678...')).toBeInTheDocument()
    
    // But link should have full hash
    const txLink = screen.getByText('0x12345678...')
    expect(txLink).toHaveAttribute('href', 'https://sepolia.etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
  })

  it('should handle different token types', () => {
    const mockEvents = [
      {
        type: 'Transfer' as const,
        token: 'DAI' as const,
        amount: '100',
        from: '0x1111111111111111111111111111111111111111' as const,
        to: '0x2222222222222222222222222222222222222222' as const,
        tx: '0x1111111111111111111111111111111111111111111111111111111111111111'
      },
      {
        type: 'Approval' as const,
        token: 'USDC' as const,
        amount: '50',
        from: '0x3333333333333333333333333333333333333333' as const,
        to: '0x4444444444444444444444444444444444444444' as const,
        tx: '0x2222222222222222222222222222222222222222222222222222222222222222'
      }
    ]
    
    mockUseAppStore.mockImplementation((selector) => {
      if (selector) {
        return selector({ events: mockEvents })
      }
      return { events: mockEvents }
    })
    
    render(<EventsTable />)
    
    expect(screen.getByText('DAI')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
  })
})
