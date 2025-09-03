import { create } from 'zustand'
import { formatUnits, parseUnits } from 'viem'
import type { Address } from 'viem'
import { sepolia } from 'wagmi/chains'
import { getPublicClient, getWalletClient } from 'wagmi/actions'
import { config } from '../../lib/web3'
import { DAI, USDC, ERC20_ABI } from '../../lib/erc20'

type Token = 'DAI' | 'USDC'
type Balances = Record<Token, string>
type TransactionStatus = 'idle' | 'pending' | 'success' | 'error'

interface Event {
  type: string
  token: Token
  amount: string
  from?: string
  to?: string
  tx: string
}

interface AppState {
  // Connection state
  isConnected: boolean
  account: Address | undefined
  chainId: number | undefined
  
  // Balances
  balances: Balances
  allowances: Balances
  
  // Transaction state
  transactionStatus: TransactionStatus
  transactionHash: string | undefined
  transactionError: string | undefined
  
  // Events
  events: Event[]
  
  // Actions
  setConnection: (isConnected: boolean, account: Address | undefined, chainId: number | undefined) => void
  fetchBalances: () => Promise<void>
  approve: (token: Token, spender: Address, amount: string) => Promise<string>
  transfer: (token: Token, to: Address, amount: string) => Promise<string>
  mint: (token: Token, amount: string) => Promise<string>
  clearTransactionStatus: () => void
}

const TOKENS = {
  DAI: { addr: DAI, decimals: 18 },
  USDC: { addr: USDC, decimals: 6 }
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isConnected: false,
  account: undefined,
  chainId: undefined,
  balances: { DAI: '0', USDC: '0' },
  allowances: { DAI: '0', USDC: '0' },
  transactionStatus: 'idle',
  transactionHash: undefined,
  transactionError: undefined,
  events: [],
  
  setConnection: (isConnected, account, chainId) => {
    set({ isConnected, account, chainId })
    if (isConnected && account) {
      get().fetchBalances()
    }
  },
  
  fetchBalances: async () => {
    const { account, isConnected } = get()
    if (!account || !isConnected) return
    
    try {
      const pc = getPublicClient(config)
      
      const [daiBalance, usdcBalance, daiAllowance, usdcAllowance] = await Promise.all([
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
        pc.readContract({
          address: DAI,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [account, account]
        }),
        pc.readContract({
          address: USDC,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [account, account]
        })
      ])
      
      set({
        balances: {
          DAI: formatUnits(daiBalance as bigint, 18),
          USDC: formatUnits(usdcBalance as bigint, 6)
        },
        allowances: {
          DAI: formatUnits(daiAllowance as bigint, 18),
          USDC: formatUnits(usdcAllowance as bigint, 6)
        }
      })
    } catch (error: unknown) {
      console.error('Error fetching balances:', error)
    }
  },
  
  approve: async (t, spender, amount) => {
    const { account, chainId, isConnected } = get()
    if(!account || !isConnected) throw new Error('Conecta tu wallet primero')
    if(chainId !== sepolia.id) throw new Error('Cambia a la red Sepolia')
    
    set({ transactionStatus: 'pending', transactionError: undefined })
    
    try {
      const wc = await getWalletClient(config)
      if (!wc) throw new Error('Wallet no disponible. Revisa tu conexión.')
      
      const value = parseUnits(amount, TOKENS[t].decimals)
      
      const hash = await wc.writeContract({ 
        address: TOKENS[t].addr, 
        abi: ERC20_ABI, 
        functionName: 'approve', 
        args: [spender, value], 
        chain: sepolia 
      })
      
      set({ 
        transactionStatus: 'success',
        transactionHash: hash,
        events:[...get().events, {type:'Approval', token:t, amount, from:account, to:spender, tx:hash}]
      })
      
      // Refresh balances after transaction
      setTimeout(() => get().fetchBalances(), 2000)
      return hash
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error en la transacción. Intenta de nuevo.'
      set({ 
        transactionStatus: 'error',
        transactionError: errorMessage
      })
      throw new Error(errorMessage)
    }
  },
  
  transfer: async (t, to, amount)=>{
    const { account, balances, chainId, isConnected } = get()
    if(!account || !isConnected) throw new Error('Conecta tu wallet primero')
    if(chainId !== sepolia.id) throw new Error('Cambia a la red Sepolia')
    if(Number(amount) > Number(balances[t])) throw new Error(`Saldo insuficiente de ${t}. Tienes ${balances[t]} ${t}`)
    
    set({ transactionStatus: 'pending', transactionError: undefined })
    
    try {
      const wc = await getWalletClient(config)
      if (!wc) throw new Error('Wallet no disponible. Revisa tu conexión.')
      
      const value = parseUnits(amount, TOKENS[t].decimals)
      
      const hash = await wc.writeContract({ 
        address: TOKENS[t].addr, 
        abi: ERC20_ABI, 
        functionName: 'transfer', 
        args: [to, value], 
        chain: sepolia 
      })
      
      set({ 
        transactionStatus: 'success',
        transactionHash: hash,
        events:[...get().events, {type:'Transfer', token:t, amount, from:account, to, tx:hash}]
      })
      
      // Refresh balances after transaction
      setTimeout(() => get().fetchBalances(), 2000)
      return hash
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed'
      set({ 
        transactionStatus: 'error',
        transactionError: errorMessage
      })
      throw new Error(errorMessage)
    }
  },
  
  mint: async (t, amount)=>{
    const { account, chainId, isConnected } = get()
    if(!account || !isConnected) throw new Error('Conecta tu wallet primero')
    if(chainId !== sepolia.id) throw new Error('Cambia a la red Sepolia')
    
    set({ transactionStatus: 'pending', transactionError: undefined })
    
    try {
      const wc = await getWalletClient(config)
      if (!wc) throw new Error('Wallet no disponible. Revisa tu conexión.')
      
      const value = parseUnits(amount, TOKENS[t].decimals)
      
      const hash = await wc.writeContract({ 
        address: TOKENS[t].addr, 
        abi: ERC20_ABI, 
        functionName: 'mint', 
        args: [account, value], 
        chain: sepolia 
      })
      
      set({ 
        transactionStatus: 'success',
        transactionHash: hash
      })
      
      // Refresh balances after transaction
      setTimeout(() => get().fetchBalances(), 2000)
      return hash
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed'
      set({ 
        transactionStatus: 'error',
        transactionError: errorMessage
      })
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
