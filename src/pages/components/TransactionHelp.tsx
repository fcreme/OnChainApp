import { useAppStore } from '../store/useAppStore'
import { sepolia } from 'wagmi/chains'

export default function TransactionHelp() {
  const { isConnected, chainId } = useAppStore()
  
  if (!isConnected || chainId !== sepolia.id) {
    return null
  }

  return (
    <div style={{ 
      border: '1px solid #e3f2fd', 
      padding: '16px', 
      margin: '10px 0',
      borderRadius: '8px',
      background: '#f3f8ff'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>How to use transactions</h4>
      <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
        <div style={{ marginBottom: '12px' }}>
          <strong>🔐 APPROVE:</strong> Allow another address to spend your tokens. Enter the spender's address and amount.
        </div>
        <div style={{ marginBottom: '12px' }}>
          <strong>💸 TRANSFER:</strong> Send tokens to another address. Enter the recipient's address and amount.
        </div>
        <div style={{ marginBottom: '12px' }}>
          <strong>🪙 MINT:</strong> Create new tokens for yourself (test tokens only). Leave address field empty.
        </div>
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: '#fff3cd', 
          borderRadius: '4px',
          fontSize: '12px',
          color: '#856404'
        }}>
          💡 <strong>Tip:</strong> Make sure you have enough Sepolia ETH for gas fees. You can get test ETH from a faucet.
        </div>
      </div>
    </div>
  )
}
