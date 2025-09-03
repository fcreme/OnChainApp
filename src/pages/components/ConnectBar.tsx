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
  Fade
} from '@mui/material'
import { 
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon,
  Bolt as BoltIcon,
  Help as HelpIcon
} from '@mui/icons-material'
import WalletHelp from './WalletHelp'

export default function ConnectBar() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { setConnection } = useAppStore()
  const [helpOpen, setHelpOpen] = useState(false)

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

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      <Toolbar sx={{ px: { xs: 3, md: 6 }, py: { xs: 2, sm: 2.5 } }}>
        <Fade in timeout={600}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: 'text.primary',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffffff 0%, #667eea 50%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: { xs: '1.2rem', sm: '1.4rem' },
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <BoltIcon sx={{ 
              fontSize: { xs: '1.3rem', sm: '1.5rem' },
              color: '#667eea'
            }} />
            Web3 Challenge
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
                  borderRadius: '12px',
                  px: 2,
                  py: 1,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'text.primary',
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    background: 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                Ayuda
              </Button>
            </Fade>
          )}
          {isConnected && address && (
            <Fade in timeout={800}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip
                  data-testid="wallet-address"
                  label={`${address?.slice(0, 6)}...${address?.slice(-4)}`}
                  size="small"
                  variant="outlined"
                  icon={<WalletIcon />}
                  sx={{ 
                    fontFamily: 'monospace',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'text.primary',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: '32px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)'
                    }
                  }}
                />
                <Chip
                  label={chainId === sepolia.id ? 'Sepolia' : `Chain ${chainId}`}
                  size="small"
                  color={chainId === sepolia.id ? 'success' : 'warning'}
                  variant="filled"
                  sx={{
                    backgroundColor: chainId === sepolia.id 
                      ? 'rgba(76, 175, 80, 0.2)' 
                      : 'rgba(255, 152, 0, 0.2)',
                    border: chainId === sepolia.id 
                      ? '1px solid rgba(76, 175, 80, 0.3)' 
                      : '1px solid rgba(255, 152, 0, 0.3)',
                    color: chainId === sepolia.id ? '#4CAF50' : '#ff9800',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: '32px',
                    backdropFilter: 'blur(10px)'
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
                  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                  borderRadius: '12px',
                  px: 3,
                  py: 1,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(244, 67, 54, 0.4)'
                  },
                  '&:disabled': {
                    background: 'rgba(244, 67, 54, 0.5)',
                    transform: 'none'
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
