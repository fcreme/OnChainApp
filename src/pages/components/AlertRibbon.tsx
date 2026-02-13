import { useMemo } from 'react'
import {
  Box,
  Button,
  Stack,
  Typography,
  useTheme
} from '@mui/material'
import { useAppStore } from '../store/useAppStore'
import { TESTNET_CONFIG } from '../../lib/web3'
import { Link as RouterLink } from 'react-router-dom'

type AlertSeverity = 'error' | 'warning' | 'info'

const lowEthThreshold = 0.05
const largeTransferThreshold = 50

const getSeverityColor = (severity: AlertSeverity, theme: ReturnType<typeof useTheme>) => {
  if (severity === 'error') return theme.palette.error.main
  if (severity === 'warning') return theme.palette.warning.main
  return theme.palette.primary.main
}

export default function AlertRibbon() {
  const theme = useTheme()
  const {
    transactionStatus,
    transactionHash,
    transactionError,
    nativeBalance,
    events,
    isLoadingBalances
  } = useAppStore()

  const lowEth = !isLoadingBalances && Number(nativeBalance) < lowEthThreshold

  const latestLargeEvent = useMemo(() => {
    const reversed = [...events].reverse()
    return reversed.find(event => {
      const amount = Number(event.amount)
      return Number.isFinite(amount) && amount >= largeTransferThreshold
    })
  }, [events])

  const alerts = useMemo(() => {
    const next: { id: string; message: string; description?: string; severity: AlertSeverity; action?: { label: string; href: string; external?: boolean } }[] = []

    if (transactionStatus === 'error' && transactionError) {
      next.push({
        id: 'tx-error',
        message: 'Transaction failed',
        description: transactionError,
        severity: 'error'
      })
    } else if (transactionStatus === 'pending' || transactionStatus === 'confirming') {
      next.push({
        id: 'tx-pending',
        message: 'Transaction pending confirmation',
        description: transactionHash ? `Tx ${transactionHash.slice(0, 10)}...` : undefined,
        severity: 'warning',
          action: transactionHash
            ? {
                label: 'View on Etherscan',
                href: `https://sepolia.etherscan.io/tx/${transactionHash}`,
                external: true
              }
            : undefined
      })
    }

    if (lowEth) {
      next.push({
        id: 'low-eth',
        message: 'Sepolia ETH running low',
        description: `${Number(nativeBalance).toFixed(4)} SEP remaining`,
        severity: 'error',
        action: {
          label: 'Get test ETH',
          href: TESTNET_CONFIG.faucetUrl,
          external: true
        }
      })
    }

    if (latestLargeEvent) {
      next.push({
        id: `large-${latestLargeEvent.tx}`,
        message: `${latestLargeEvent.token} ${latestLargeEvent.type} spotted`,
        description: `Amount: ${latestLargeEvent.amount}`,
        severity: 'info',
        action: {
          label: 'Review history',
          href: '/transfers',
          external: false
        }
      })
    }

    return next
  }, [transactionStatus, transactionHash, transactionError, lowEth, nativeBalance, latestLargeEvent])

  if (alerts.length === 0) {
    return null
  }

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      {alerts.map(alert => (
        <Box
          key={alert.id}
          sx={{
            borderRadius: 2,
            border: 1,
            borderColor: theme.palette.divider,
            background: 'rgba(255, 255, 255, 0.02)',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: getSeverityColor(alert.severity, theme) }}>
              {alert.message}
            </Typography>
            {alert.description && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {alert.description}
              </Typography>
            )}
          </Box>
          {alert.action && (
            <Button
              component={alert.action.external ? 'a' : RouterLink}
              href={alert.action.external ? alert.action.href : undefined}
              to={alert.action.external ? undefined : alert.action.href}
              target={alert.action.external ? '_blank' : undefined}
              rel={alert.action.external ? 'noreferrer' : undefined}
              size="small"
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              {alert.action.label}
            </Button>
          )}
        </Box>
      ))}
    </Stack>
  )
}
