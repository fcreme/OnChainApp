import { useAppStore } from '../store/useAppStore'
import { sepolia } from 'wagmi/chains'
import {
  Box,
  Button,
  Chip,
  Tooltip
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  AccountBalance as FaucetIcon
} from '@mui/icons-material'
import { TESTNET_CONFIG } from '../../lib/web3'

export default function NetworkStatus() {
  const { isConnected, chainId } = useAppStore()

  if (!isConnected) {
    return null
  }

  const isCorrectNetwork = chainId === sepolia.id

  if (!isCorrectNetwork) {
    return (
      <Tooltip title="Please switch to Sepolia network">
        <Chip
          data-testid="network-status"
          icon={<WarningIcon sx={{ fontSize: '0.9rem' }} />}
          label="Wrong Network"
          size="small"
          sx={{
            background: 'rgba(255, 179, 71, 0.15)',
            border: '1px solid rgba(255, 179, 71, 0.3)',
            color: '#ffb347',
            fontWeight: 600,
            fontSize: '0.75rem',
            height: '28px',
          }}
        />
      </Tooltip>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        data-testid="network-status"
        icon={<CheckIcon sx={{ fontSize: '0.9rem' }} />}
        label="Sepolia"
        size="small"
        sx={{
          background: 'rgba(164, 207, 94, 0.15)',
          border: '1px solid rgba(164, 207, 94, 0.3)',
          color: '#a4cf5e',
          fontWeight: 600,
          fontSize: '0.75rem',
          height: '28px',
        }}
      />
      <Button
        size="small"
        variant="outlined"
        startIcon={<FaucetIcon sx={{ fontSize: '0.8rem' }} />}
        onClick={() => window.open(TESTNET_CONFIG.faucetUrl, '_blank')}
        sx={{
          borderColor: 'divider',
          color: 'text.secondary',
          borderRadius: '6px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.7rem',
          px: 1.5,
          py: 0.5,
          height: '28px',
          '&:hover': {
            borderColor: 'primary.main',
            background: 'rgba(20, 184, 166, 0.1)',
          }
        }}
      >
        Faucet
      </Button>
    </Box>
  )
}
