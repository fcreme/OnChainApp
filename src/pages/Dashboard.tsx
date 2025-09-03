import { Box, Container, Card, CardContent, Typography, Button, Fade } from '@mui/material'
import { History as HistoryIcon, Token as TokenIcon, SwapHoriz as SwapIcon } from '@mui/icons-material'
import ConnectBar from './components/ConnectBar'
import NetworkStatus from './components/NetworkStatus'
import BalancesCard from './components/BalancesCard'
import ActionsForm from './components/ActionsForm'
import EventsTable from './components/EventsTable'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(76, 175, 80, 0.05) 0%, transparent 50%)
          `,
          zIndex: 0
        }}
      />
      
      <ConnectBar />
      
      <Container maxWidth="xl" sx={{ py: 6, position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Fade in timeout={600}>
          <Box 
            sx={{ 
              textAlign: 'center',
              mb: { xs: 5, md: 6 },
              p: { xs: 3, md: 4 },
              borderRadius: '28px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background gradient animation */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 30% 20%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(76, 175, 80, 0.1) 0%, transparent 50%)',
                animation: 'pulse 4s ease-in-out infinite alternate',
                '@keyframes pulse': {
                  '0%': { opacity: 0.3 },
                  '100%': { opacity: 0.6 }
                }
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontWeight: 900,
                  fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
                  lineHeight: 1.1,
                  mb: 2.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4caf50 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                }}
              >
                Web3 Challenge
              </Typography>
              
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 400,
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  lineHeight: 1.6,
                  color: 'text.secondary',
                  mb: 4,
                  maxWidth: '700px',
                  mx: 'auto',
                  px: { xs: 2, sm: 0 }
                }}
              >
                Experience the future of decentralized finance. Interact with ERC20 tokens on the Sepolia testnet with a modern, intuitive interface. 
                <Box component="span" sx={{ 
                  display: 'inline-block', 
                  mt: 1, 
                  p: 1, 
                  borderRadius: '8px', 
                  background: 'rgba(76, 175, 80, 0.1)', 
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#4caf50'
                }}>
                  🧪 TESTNET MODE - Safe for testing
                </Box>
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2.5,
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => window.open('https://github.com/fcreme/-Web3-Challenge---React-Blockchain-Integration', '_blank')}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '14px',
                    px: 3.5,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: { xs: '180px', sm: '160px' },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(102, 126, 234, 0.6)',
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                    }
                  }}
                >
                  View on GitHub
                </Button>
                
                <Button
                  component={Link}
                  to="/transfers"
                  variant="contained"
                  size="large"
                  startIcon={<HistoryIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    borderRadius: '14px',
                    px: 3.5,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: { xs: '180px', sm: '160px' },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(76, 175, 80, 0.6)',
                      background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)'
                    }
                  }}
                >
                  View Transaction History
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => window.open('https://sepolia.etherscan.io/', '_blank')}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '14px',
                    px: 3.5,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    color: 'text.primary',
                    backdropFilter: 'blur(10px)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: { xs: '180px', sm: '160px' },
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  Sepolia Explorer
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* Network Status */}
        <Fade in timeout={1000}>
          <Box sx={{ mb: 6 }}>
            <NetworkStatus />
          </Box>
        </Fade>

        {/* Main Content - Enhanced Layout */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '100%' }}>
          {/* Token Balances */}
          <Fade in timeout={1200}>
            <Card 
              sx={{ 
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <TokenIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: { xs: '1.75rem', sm: '2rem' }
                    }}
                  >
                    Token Balances
                  </Typography>
                </Box>
                <BalancesCard />
              </CardContent>
            </Card>
          </Fade>

          {/* Token Operations */}
          <Fade in timeout={1400}>
            <Card 
              sx={{ 
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <SwapIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: { xs: '1.75rem', sm: '2rem' }
                    }}
                  >
                    Token Operations
                  </Typography>
                </Box>
                <ActionsForm />
              </CardContent>
            </Card>
          </Fade>

          {/* Recent Events */}
          <Fade in timeout={1600}>
            <Card 
              sx={{ 
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <HistoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: { xs: '1.75rem', sm: '2rem' }
                    }}
                  >
                    Recent Events
                  </Typography>
                </Box>
                <EventsTable />
              </CardContent>
            </Card>
          </Fade>
        </Box>
      </Container>
    </Box>
  )
}
