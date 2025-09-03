import { useAppStore } from '../store/useAppStore'
import { useEffect } from 'react'

export default function TransactionStatus() {
  const { 
    transactionStatus, 
    transactionHash, 
    transactionError, 
    clearTransactionStatus 
  } = useAppStore()

  // Auto-clear success status after 5 seconds
  useEffect(() => {
    if (transactionStatus === 'success') {
      const timer = setTimeout(() => {
        clearTransactionStatus()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [transactionStatus, clearTransactionStatus])

  if (transactionStatus === 'idle') {
    return null
  }

  const getStatusConfig = () => {
    switch (transactionStatus) {
      case 'pending':
        return {
          icon: '⏳',
          title: 'Transaction Pending',
          message: 'Please confirm the transaction in your wallet...',
          color: '#ff9800',
          background: '#fff3cd',
          border: '#ff9800'
        }
      case 'success':
        return {
          icon: '✅',
          title: 'Transaction Successful!',
          message: 'Your transaction has been confirmed on the blockchain.',
          color: '#4CAF50',
          background: '#e8f5e8',
          border: '#4CAF50'
        }
      case 'error':
        return {
          icon: '❌',
          title: 'Transaction Failed',
          message: transactionError || 'An error occurred during the transaction.',
          color: '#f44336',
          background: '#ffebee',
          border: '#f44336'
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  return (
    <div data-testid="transaction-status" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px',
      borderRadius: '8px',
      border: `2px solid ${config.border}`,
      background: config.background,
      color: config.color,
      maxWidth: '400px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '24px', flexShrink: 0 }}>
          {config.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {config.title}
          </h4>
          <p style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            {config.message}
          </p>
          
          {transactionHash && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ 
                margin: '0 0 4px 0', 
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Transaction Hash:
              </p>
              <a 
                href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '12px',
                  color: '#2196F3',
                  textDecoration: 'none',
                  wordBreak: 'break-all'
                }}
              >
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </a>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={clearTransactionStatus}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: config.color,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {transactionStatus === 'success' ? 'Close' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
