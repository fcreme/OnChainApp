import { useEffect, useRef } from 'react'
import { Box, Alert, AlertTitle, Link, IconButton, Slide } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { useToastStore, type Toast } from '../../stores/useToastStore'
import { TESTNET_SETTINGS } from '../../lib/testnet-config'

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (toast.autoHideDuration > 0) {
      timerRef.current = setTimeout(() => removeToast(toast.id), toast.autoHideDuration)
      return () => clearTimeout(timerRef.current)
    }
  }, [toast.id, toast.autoHideDuration, removeToast])

  const explorerUrl = TESTNET_SETTINGS.network.explorer

  return (
    <Slide direction="left" in mountOnEnter unmountOnExit>
      <Alert
        severity={toast.severity}
        action={
          <IconButton size="small" onClick={() => removeToast(toast.id)} sx={{ color: 'inherit' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: 300,
          maxWidth: 400,
        }}
      >
        <AlertTitle sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
          {toast.severity === 'success' ? 'Success' :
           toast.severity === 'error' ? 'Error' :
           toast.severity === 'warning' ? 'Warning' : 'Info'}
        </AlertTitle>
        <Box sx={{ fontSize: '0.8125rem', mb: toast.txHash ? 0.5 : 0 }}>
          {toast.message}
        </Box>
        {toast.txHash && (
          <Link
            href={`${explorerUrl}/tx/${toast.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              wordBreak: 'break-all',
            }}
          >
            Tx: {toast.txHash.slice(0, 10)}...{toast.txHash.slice(-8)}
          </Link>
        )}
      </Alert>
    </Slide>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1400,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        pointerEvents: 'none',
        '& > *': { pointerEvents: 'auto' },
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </Box>
  )
}
