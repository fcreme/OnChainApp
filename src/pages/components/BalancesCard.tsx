import { useAppStore } from '../store/useAppStore'
import { useEffect } from 'react'
import { sepolia } from 'wagmi/chains'
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Chip,
  Fade
} from '@mui/material'
import { 
  Refresh as RefreshIcon,
  AccountBalance as BalanceIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material'

export default function BalancesCard(){
  const { 
    balances, 
    fetchBalances, 
    isConnected, 
    chainId 
  } = useAppStore()

  const isWrongNetwork = isConnected && chainId !== sepolia.id

  useEffect(() => {
    if (isConnected && chainId === sepolia.id) {
      fetchBalances()
    }
  }, [isConnected, chainId, fetchBalances])

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        gap: { xs: 2, sm: 0 },
        mb: 4 
      }}>
        <Typography variant="h5" component="h3" sx={{ 
          fontWeight: 700,
          fontSize: { xs: '1.5rem', sm: '1.75rem' },
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <BalanceIcon sx={{ 
            fontSize: { xs: '1.6rem', sm: '1.8rem' },
            color: 'primary.main'
          }} />
          Token Balances
        </Typography>
        {isConnected && !isWrongNetwork && (
          <Button
            data-testid="refresh-balances"
            onClick={fetchBalances}
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'text.primary',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600,
              borderRadius: '12px',
              px: 3,
              py: 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(102, 126, 234, 0.15)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
              }
            }}
          >
            Refresh
          </Button>
        )}
      </Box>
      
      {!isConnected ? (
        <Fade in timeout={600}>
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <BalanceIcon sx={{ 
              fontSize: 64, 
              color: 'text.secondary', 
              mb: 2,
              opacity: 0.5
            }} />
            <Typography color="text.secondary" sx={{ 
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 500
            }}>
              Connect your wallet to see balances
            </Typography>
          </Box>
        </Fade>
      ) : isWrongNetwork ? (
        <Fade in timeout={600}>
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            background: 'rgba(244, 67, 54, 0.05)',
            borderRadius: '20px',
            border: '1px solid rgba(244, 67, 54, 0.1)'
          }}>
            <TrendingUpIcon sx={{ 
              fontSize: 64, 
              color: 'error.main', 
              mb: 2,
              opacity: 0.7
            }} />
            <Typography color="error" sx={{ 
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 500
            }}>
              Please switch to Sepolia network
            </Typography>
          </Box>
        </Fade>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
          gap: 4 
        }}>
          <Fade in timeout={800}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '20px'
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Chip 
                  label="DAI" 
                  size="medium" 
                  color="primary" 
                  variant="outlined"
                  sx={{ 
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                    color: '#667eea',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    mb: 3,
                    height: '32px'
                  }}
                />
                <Typography 
                  variant="h3" 
                  data-testid="dai-balance"
                  sx={{ 
                    fontWeight: 800,
                    color: 'text.primary',
                    fontFamily: 'monospace',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    mb: 1
                  }}
                >
                  {balances.DAI}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: '0.875rem'
                  }}
                >
                  DAI Balance
                </Typography>
              </CardContent>
            </Card>
          </Fade>
          
          <Fade in timeout={1000}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '20px'
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Chip 
                  label="USDC" 
                  size="medium" 
                  color="secondary" 
                  variant="outlined"
                  sx={{ 
                    borderColor: 'rgba(76, 175, 80, 0.5)',
                    color: '#4caf50',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    mb: 3,
                    height: '32px'
                  }}
                />
                <Typography 
                  variant="h3" 
                  data-testid="usdc-balance"
                  sx={{ 
                    fontWeight: 800,
                    color: 'text.primary',
                    fontFamily: 'monospace',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    mb: 1
                  }}
                >
                  {balances.USDC}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: '0.875rem'
                  }}
                >
                  USDC Balance
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        </Box>
      )}
    </Box>
  )
}
