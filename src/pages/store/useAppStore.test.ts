import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppStore } from './useAppStore'

// Mock wagmi
vi.mock('wagmi/actions', () => ({
  getPublicClient: vi.fn(() => ({
    readContract: vi.fn()
  })),
  getWalletClient: vi.fn(() => ({
    writeContract: vi.fn()
  }))
}))

// Mock web3 config
vi.mock('../../lib/web3', () => ({
  config: {}
}))

// Mock ERC20 constants
vi.mock('../../lib/erc20', () => ({
  DAI: '0x1D70D57ccD2798323232B2dD027B3aBcA5C00091',
  USDC: '0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47',
  ERC20_ABI: []
}))

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useAppStore())
    act(() => {
      result.current.setConnection(false, undefined, undefined)
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAppStore())

    expect(result.current.isConnected).toBe(false)
    expect(result.current.account).toBeUndefined()
    expect(result.current.chainId).toBeUndefined()
    expect(result.current.balances).toEqual({ DAI: '0', USDC: '0' })
    expect(result.current.allowances).toEqual({ DAI: '0', USDC: '0' })
    expect(result.current.transactionStatus).toBe('idle')
    expect(result.current.transactionHash).toBeUndefined()
    expect(result.current.transactionError).toBeUndefined()
    expect(result.current.events).toEqual([])
  })

  it('should set connection state', () => {
    const { result } = renderHook(() => useAppStore())
    const testAccount = '0x1234567890123456789012345678901234567890' as const
    const testChainId = 11155111

    act(() => {
      result.current.setConnection(true, testAccount, testChainId)
    })

    expect(result.current.isConnected).toBe(true)
    expect(result.current.account).toBe(testAccount)
    expect(result.current.chainId).toBe(testChainId)
  })

  it('should clear connection state', () => {
    const { result } = renderHook(() => useAppStore())
    const testAccount = '0x1234567890123456789012345678901234567890' as const
    const testChainId = 11155111

    // Set connection first
    act(() => {
      result.current.setConnection(true, testAccount, testChainId)
    })

    // Then clear it
    act(() => {
      result.current.setConnection(false, undefined, undefined)
    })

    expect(result.current.isConnected).toBe(false)
    expect(result.current.account).toBeUndefined()
    expect(result.current.chainId).toBeUndefined()
  })

  it('should clear transaction status', () => {
    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.clearTransactionStatus()
    })

    expect(result.current.transactionStatus).toBe('idle')
    expect(result.current.transactionHash).toBeUndefined()
    expect(result.current.transactionError).toBeUndefined()
  })

  it('should handle fetchBalances when not connected', async () => {
    const { result } = renderHook(() => useAppStore())

    await act(async () => {
      await result.current.fetchBalances()
    })

    // Should not change balances when not connected
    expect(result.current.balances).toEqual({ DAI: '0', USDC: '0' })
  })

  it('should handle fetchBalances when connected', async () => {
    const { result } = renderHook(() => useAppStore())
    const testAccount = '0x1234567890123456789012345678901234567890' as const
    const testChainId = 11155111

    act(() => {
      result.current.setConnection(true, testAccount, testChainId)
    })

    await act(async () => {
      await result.current.fetchBalances()
    })

    // Should attempt to fetch balances when connected
    expect(result.current.balances).toEqual({ DAI: '0', USDC: '0' })
  })

  it('should handle approve when not connected', async () => {
    const { result } = renderHook(() => useAppStore())

    await expect(
      act(async () => {
        await result.current.approve('DAI', '0x1234567890123456789012345678901234567890' as const, '100')
      })
    ).rejects.toThrow('Connect your wallet')
  })

  it('should handle transfer when not connected', async () => {
    const { result } = renderHook(() => useAppStore())

    await expect(
      act(async () => {
        await result.current.transfer('DAI', '0x1234567890123456789012345678901234567890' as const, '100')
      })
    ).rejects.toThrow('Connect your wallet')
  })

  it('should handle mint when not connected', async () => {
    const { result } = renderHook(() => useAppStore())

    await expect(
      act(async () => {
        await result.current.mint('DAI', '100')
      })
    ).rejects.toThrow('Connect your wallet')
  })

  it('should handle approve when connected but wrong network', async () => {
    const { result } = renderHook(() => useAppStore())
    const testAccount = '0x1234567890123456789012345678901234567890' as const
    const wrongChainId = 1 // Mainnet

    act(() => {
      result.current.setConnection(true, testAccount, wrongChainId)
    })

    await expect(
      act(async () => {
        await result.current.approve('DAI', '0x1234567890123456789012345678901234567890' as const, '100')
      })
    ).rejects.toThrow('Please switch to Sepolia network')
  })

  it('should handle transfer when connected but wrong network', async () => {
    const { result } = renderHook(() => useAppStore())
    const testAccount = '0x1234567890123456789012345678901234567890' as const
    const wrongChainId = 1 // Mainnet

    act(() => {
      result.current.setConnection(true, testAccount, wrongChainId)
    })

    await expect(
      act(async () => {
        await result.current.transfer('DAI', '0x1234567890123456789012345678901234567890' as const, '100')
      })
    ).rejects.toThrow('Please switch to Sepolia network')
  })

  it('should handle mint when connected but wrong network', async () => {
    const { result } = renderHook(() => useAppStore())
    const testAccount = '0x1234567890123456789012345678901234567890' as const
    const wrongChainId = 1 // Mainnet

    act(() => {
      result.current.setConnection(true, testAccount, wrongChainId)
    })

    await expect(
      act(async () => {
        await result.current.mint('DAI', '100')
      })
    ).rejects.toThrow('Please switch to Sepolia network')
  })
})
