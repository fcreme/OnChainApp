import { describe, it, expect } from 'vitest'
import { DAI, USDC, ERC20_ABI } from './erc20'

describe('ERC20 Constants', () => {
  describe('Token Addresses', () => {
    it('should have correct DAI address', () => {
      expect(DAI).toBe('0x1D70D57ccD2798323232B2dD027B3aBcA5C00091')
      expect(typeof DAI).toBe('string')
      expect(DAI).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should have correct USDC address', () => {
      expect(USDC).toBe('0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47')
      expect(typeof USDC).toBe('string')
      expect(USDC).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should have different addresses for DAI and USDC', () => {
      expect(DAI).not.toBe(USDC)
    })
  })

  describe('ERC20_ABI', () => {
    it('should be an array', () => {
      expect(Array.isArray(ERC20_ABI)).toBe(true)
    })

    it('should contain required ERC20 functions', () => {
      const functionNames = ERC20_ABI
        .filter(item => item.type === 'function')
        .map(item => (item as any).name)

      expect(functionNames).toContain('balanceOf')
      expect(functionNames).toContain('decimals')
      expect(functionNames).toContain('symbol')
      expect(functionNames).toContain('allowance')
      expect(functionNames).toContain('approve')
      expect(functionNames).toContain('transfer')
    })

    it('should contain mint function for test tokens', () => {
      const functionNames = ERC20_ABI
        .filter(item => item.type === 'function')
        .map(item => (item as any).name)

      expect(functionNames).toContain('mint')
    })

    it('should contain required events', () => {
      const eventNames = ERC20_ABI
        .filter(item => item.type === 'event')
        .map(item => (item as any).name)

      expect(eventNames).toContain('Transfer')
      expect(eventNames).toContain('Approval')
    })

    it('should have correct balanceOf function signature', () => {
      const balanceOfFunction = ERC20_ABI.find(
        item => item.type === 'function' && (item as any).name === 'balanceOf'
      ) as any

      expect(balanceOfFunction).toBeDefined()
      expect(balanceOfFunction.stateMutability).toBe('view')
      expect(balanceOfFunction.inputs).toHaveLength(1)
      expect(balanceOfFunction.inputs?.[0].name).toBe('a')
      expect(balanceOfFunction.inputs?.[0].type).toBe('address')
      expect(balanceOfFunction.outputs).toHaveLength(1)
      expect(balanceOfFunction.outputs?.[0].type).toBe('uint256')
    })

    it('should have correct approve function signature', () => {
      const approveFunction = ERC20_ABI.find(
        item => item.type === 'function' && (item as any).name === 'approve'
      ) as any

      expect(approveFunction).toBeDefined()
      expect(approveFunction.stateMutability).toBe('nonpayable')
      expect(approveFunction.inputs).toHaveLength(2)
      expect(approveFunction.inputs?.[0].name).toBe('s')
      expect(approveFunction.inputs?.[0].type).toBe('address')
      expect(approveFunction.inputs?.[1].name).toBe('amt')
      expect(approveFunction.inputs?.[1].type).toBe('uint256')
      expect(approveFunction.outputs).toHaveLength(1)
      expect(approveFunction.outputs?.[0].type).toBe('bool')
    })

    it('should have correct transfer function signature', () => {
      const transferFunction = ERC20_ABI.find(
        item => item.type === 'function' && (item as any).name === 'transfer'
      ) as any

      expect(transferFunction).toBeDefined()
      expect(transferFunction.stateMutability).toBe('nonpayable')
      expect(transferFunction.inputs).toHaveLength(2)
      expect(transferFunction.inputs?.[0].name).toBe('to')
      expect(transferFunction.inputs?.[0].type).toBe('address')
      expect(transferFunction.inputs?.[1].name).toBe('amt')
      expect(transferFunction.inputs?.[1].type).toBe('uint256')
      expect(transferFunction.outputs).toHaveLength(1)
      expect(transferFunction.outputs?.[0].type).toBe('bool')
    })

    it('should have correct mint function signature', () => {
      const mintFunction = ERC20_ABI.find(
        item => item.type === 'function' && (item as any).name === 'mint'
      ) as any

      expect(mintFunction).toBeDefined()
      expect(mintFunction.stateMutability).toBe('nonpayable')
      expect(mintFunction.inputs).toHaveLength(2)
      expect(mintFunction.inputs?.[0].name).toBe('to')
      expect(mintFunction.inputs?.[0].type).toBe('address')
      expect(mintFunction.inputs?.[1].name).toBe('amt')
      expect(mintFunction.inputs?.[1].type).toBe('uint256')
      expect(mintFunction.outputs).toHaveLength(0) // mint doesn't return anything
    })

    it('should have correct Transfer event signature', () => {
      const transferEvent = ERC20_ABI.find(
        item => item.type === 'event' && (item as any).name === 'Transfer'
      ) as any

      expect(transferEvent).toBeDefined()
      expect(transferEvent.inputs).toHaveLength(3)
      expect(transferEvent.inputs?.[0].name).toBe('from')
      expect(transferEvent.inputs?.[0].type).toBe('address')
      expect(transferEvent.inputs?.[0].indexed).toBe(true)
      expect(transferEvent.inputs?.[1].name).toBe('to')
      expect(transferEvent.inputs?.[1].type).toBe('address')
      expect(transferEvent.inputs?.[1].indexed).toBe(true)
      expect(transferEvent.inputs?.[2].name).toBe('value')
      expect(transferEvent.inputs?.[2].type).toBe('uint256')
      expect(transferEvent.inputs?.[2].indexed).toBe(false)
    })

    it('should have correct Approval event signature', () => {
      const approvalEvent = ERC20_ABI.find(
        item => item.type === 'event' && (item as any).name === 'Approval'
      ) as any

      expect(approvalEvent).toBeDefined()
      expect(approvalEvent.inputs).toHaveLength(3)
      expect(approvalEvent.inputs?.[0].name).toBe('owner')
      expect(approvalEvent.inputs?.[0].type).toBe('address')
      expect(approvalEvent.inputs?.[0].indexed).toBe(true)
      expect(approvalEvent.inputs?.[1].name).toBe('spender')
      expect(approvalEvent.inputs?.[1].type).toBe('address')
      expect(approvalEvent.inputs?.[1].indexed).toBe(true)
      expect(approvalEvent.inputs?.[2].name).toBe('value')
      expect(approvalEvent.inputs?.[2].type).toBe('uint256')
      expect(approvalEvent.inputs?.[2].indexed).toBe(false)
    })
  })
})
