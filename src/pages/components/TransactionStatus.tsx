import { useAppStore } from '../store/useAppStore'
import {
  Alert,
  AlertTitle,
  Box,
  Link,
  Fade
} from '@mui/material'
import { HourglassTop as PendingIcon } from '@mui/icons-material'

export default function TransactionStatus() {
  const {
    transactionStatus,
    transactionHash,
    clearTransactionStatus
  } = useAppStore()

  // Only render for pending and confirming states — success/error are now toasts
  if (transactionStatus !== 'pending' && transactionStatus !== 'confirming') {
    return null
  }

  const spinSx = { animation: 'spin 2s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }

  const title = transactionStatus === 'confirming'
    ? 'Waiting for Confirmation...'
    : 'Transaction Pending'

  const message = transactionStatus === 'confirming'
    ? 'Transaction sent. Waiting for block confirmation...'
    : 'Please confirm the transaction in your wallet...'

  return (
    <Fade in>
      <Box
        data-testid="transaction-status"
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          maxWidth: 400,
          zIndex: 1300
        }}
      >
        <Alert
          severity="warning"
          icon={<PendingIcon sx={spinSx} />}
          onClose={clearTransactionStatus}
          sx={{
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          }}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>
          <Box sx={{ fontSize: '0.875rem', mb: transactionHash ? 1 : 0 }}>
            {message}
          </Box>
          {transactionHash && (
            <Link
              href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                wordBreak: 'break-all'
              }}
            >
              Tx: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
            </Link>
          )}
        </Alert>
      </Box>
    </Fade>
  )
}
