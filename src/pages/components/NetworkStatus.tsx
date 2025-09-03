import { useAppStore } from '../store/useAppStore'
import { sepolia } from 'wagmi/chains'
import { 
  Alert, 
  AlertTitle, 
  Box,
  Button,
  Link as MuiLink
} from '@mui/material'
import { 
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Link as LinkIcon,
  AccountBalance as FaucetIcon
} from '@mui/icons-material'
import { TESTNET_CONFIG } from '../../lib/web3'

export default function NetworkStatus() {
  const { isConnected, chainId } = useAppStore()

  if (!isConnected) {
    return null
  }

  const isCorrectNetwork = chainId === sepolia.id

  return (
    <Box sx={{ mb: 4, maxWidth: '100%' }}>
      <Alert 
        data-testid="network-status"
        severity={isCorrectNetwork ? 'success' : 'warning'}
        icon={isCorrectNetwork ? <CheckIcon /> : <WarningIcon />}
        sx={{
          py: 2,
          px: 3,
          borderRadius: '12px',
          background: isCorrectNetwork 
            ? 'rgba(76, 175, 80, 0.1)' 
            : 'rgba(255, 152, 0, 0.1)',
          border: isCorrectNetwork 
            ? '1px solid rgba(76, 175, 80, 0.3)' 
            : '1px solid rgba(255, 152, 0, 0.3)',
          '& .MuiAlert-message': {
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            minHeight: '1.5rem'
          },
          '& .MuiAlert-icon': {
            fontSize: '1.5rem',
            alignSelf: 'center',
            mt: 0
          },
          '& .MuiAlertTitle-root': {
            display: 'flex',
            alignItems: 'center',
            minHeight: '1.5rem',
            lineHeight: 1.2
          }
        }}
      >
        <AlertTitle sx={{ 
          mb: 0, 
          fontSize: { xs: '0.875rem', sm: '1rem' }, 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          lineHeight: 1.2
        }}>
          {isCorrectNetwork ? '✅ Connected to Sepolia Testnet' : '⚠️ Wrong Network Detected'}
        </AlertTitle>
        
        {isCorrectNetwork ? (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ fontSize: '0.875rem', mb: 1, color: 'text.secondary' }}>
              You're connected to the Sepolia testnet. This is a safe environment for testing.
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => window.open('https://sepolia.etherscan.io/', '_blank')}
                sx={{ fontSize: '0.75rem' }}
              >
                Sepolia Explorer
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FaucetIcon />}
                onClick={() => window.open(TESTNET_CONFIG.faucetUrl, '_blank')}
                sx={{ fontSize: '0.75rem' }}
              >
                Get Test ETH
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ fontSize: '0.875rem', mt: 1, color: 'text.secondary' }}>
            Please switch to Sepolia network to interact with the test contracts.
            <br />
            <MuiLink 
              href="https://sepoliafaucet.com/" 
              target="_blank" 
              rel="noopener"
              sx={{ display: 'inline-flex', alignItems: 'center', mt: 0.5 }}
            >
              <FaucetIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
              Get free test ETH here
            </MuiLink>
          </Box>
        )}
      </Alert>
    </Box>
  )
}
