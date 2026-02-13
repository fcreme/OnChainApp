// src/components/ConnectBar.tsx
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useAppStore } from '../store/useAppStore'
import { useEffect, useState } from 'react'
import { sepolia } from 'wagmi/chains'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  Button,
  Fade,
  Tooltip
} from '@mui/material'
import {
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon,
  Bolt as BoltIcon,
  Help as HelpIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon
} from '@mui/icons-material'
import WalletHelp from './WalletHelp'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'

export default function ConnectBar() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { setConnection } = useAppStore()
  const [helpOpen, setHelpOpen] = useState(false)
  const { copy, copiedText } = useCopyToClipboard()

  // Sync wallet state with Zustand store
  useEffect(() => {
    setConnection(isConnected, address, chainId)
  }, [address, chainId, isConnected, setConnection])

  const isWrongNetwork = isConnected && chainId !== sepolia.id

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: sepolia.id })
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  const isCopied = copiedText === address

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: '#0a0a0a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'none'
      }}
    >
      <Toolbar sx={{ px: { xs: 3, md: 6 }, py: { xs: 2, sm: 2.5 } }}>
        <Fade in timeout={600}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              color: '#f5f5f5',
              fontWeight: 600,
              fontSize: { xs: '1.2rem', sm: '1.4rem' },
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <BoltIcon sx={{
              fontSize: { xs: '1.3rem', sm: '1.5rem' },
              color: '#06b6d4'
            }} />
            Onchain
          </Typography>
        </Fade>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2 },
          flexWrap: 'wrap'
        }}>
          {!isConnected && (
            <Fade in timeout={800}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HelpIcon />}
                onClick={() => setHelpOpen(true)}
                sx={{
                  borderRadius: '6px',
                  px: 2,
                  py: 1,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'text.primary',
                  background: 'rgba(255, 255, 255, 0.03)',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: '#06b6d4',
                    background: 'rgba(6, 182, 212, 0.1)'
                  }
                }}
              >
                Help
              </Button>
            </Fade>
          )}
          {isConnected && address && (
            <Fade in timeout={800}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Tooltip title={isCopied ? 'Copied!' : 'Copy address'}>
                  <Chip
                    data-testid="wallet-address"
                    label={`${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    size="small"
                    variant="outlined"
                    icon={<WalletIcon />}
                    deleteIcon={isCopied ? <CheckIcon sx={{ fontSize: '0.85rem' }} /> : <CopyIcon sx={{ fontSize: '0.85rem' }} />}
                    onDelete={() => copy(address)}
                    onClick={() => copy(address)}
                    sx={{
                      fontFamily: 'monospace',
                      borderColor: isCopied ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                      color: 'text.primary',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: '32px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '& .MuiChip-deleteIcon': {
                        color: isCopied ? '#22c55e' : 'rgba(255, 255, 255, 0.4)',
                        '&:hover': { color: isCopied ? '#22c55e' : '#06b6d4' }
                      },
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  />
                </Tooltip>
                <Chip
                  label={chainId === sepolia.id ? 'Sepolia' : `Chain ${chainId}`}
                  size="small"
                  color={chainId === sepolia.id ? 'success' : 'warning'}
                  variant="filled"
                  sx={{
                    backgroundColor: chainId === sepolia.id
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                    border: chainId === sepolia.id
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid rgba(245, 158, 11, 0.3)',
                    color: chainId === sepolia.id ? '#22c55e' : '#f59e0b',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: '32px',
                  }}
                />
              </Box>
            </Fade>
          )}
          {isWrongNetwork && (
            <Fade in timeout={1000}>
              <Button
                data-testid="switch-network-button"
                onClick={handleSwitchNetwork}
                disabled={isSwitching}
                variant="contained"
                size="small"
                startIcon={<WarningIcon />}
                sx={{
                  background: '#ef4444',
                  borderRadius: '6px',
                  px: 3,
                  py: 1,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    background: '#dc2626',
                    boxShadow: 'none'
                  },
                  '&:disabled': {
                    background: 'rgba(239, 68, 68, 0.5)',
                  }
                }}
              >
                {isSwitching ? 'Switching...' : 'Switch to Sepolia'}
              </Button>
            </Fade>
          )}
          <Fade in timeout={1200}>
            <Box data-testid="connect-button">
              <ConnectButton />
            </Box>
          </Fade>
        </Box>
      </Toolbar>

      <WalletHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </AppBar>
  );
}
