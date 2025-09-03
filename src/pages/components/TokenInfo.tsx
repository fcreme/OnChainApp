import { useAppStore } from '../store/useAppStore'
import { sepolia } from 'wagmi/chains'

export default function TokenInfo() {
  const { isConnected, chainId } = useAppStore()
  
  if (!isConnected || chainId !== sepolia.id) {
    return null
  }

  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      padding: '16px', 
      margin: '10px 0',
      borderRadius: '8px',
      background: '#f9f9f9'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Token Information</h4>
      <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
        <p><strong>DAI:</strong> 0x1D70D57ccD2798323232B2dD027B3aBcA5C00091 (18 decimals)</p>
        <p><strong>USDC:</strong> 0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47 (6 decimals)</p>
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          These are test tokens on Sepolia network. You can mint them for testing purposes.
        </p>
      </div>
    </div>
  )
}
