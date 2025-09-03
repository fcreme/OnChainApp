import { useAppStore } from './store/useAppStore'
import { 
  Box, 
  Container, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip
} from '@mui/material'
import { 
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import ConnectBar from './components/ConnectBar'

export default function Transfers() {
  const { events } = useAppStore()
  
  const totalTransactions = events.length
  const transferCount = events.filter(e => e.type.toLowerCase() === 'transfer').length
  const approvalCount = events.filter(e => e.type.toLowerCase() === 'approval').length
  const mintCount = events.filter(e => e.type.toLowerCase() === 'mint').length

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #111111 100%)' }}>
      <ConnectBar />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header - Full Width */}
        <Box sx={{ mb: 6, maxWidth: '100%' }}>
          <Button
            component={Link}
            to="/"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{
              mb: 3,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(102, 126, 234, 0.1)'
              }
            }}
          >
            Back to Dashboard
          </Button>
          
          <Typography 
            variant="h1" 
            sx={{ 
              mb: 2,
              background: 'linear-gradient(135deg, #ffffff 0%, #667eea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textAlign: 'left'
            }}
          >
            Transaction History
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.secondary',
              maxWidth: 600,
              fontWeight: 400,
              textAlign: 'left'
            }}
          >
            Here you can see all transactions performed on the Sepolia network
          </Typography>
        </Box>

        {/* Statistics Cards - Full Width */}
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, mb: 6, maxWidth: '100%' }}>
          <Card 
            sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 700 }}>
                {totalTransactions}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Transactions
              </Typography>
            </CardContent>
          </Card>
          
          <Card 
            sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 700 }}>
                {transferCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Transfers
              </Typography>
            </CardContent>
          </Card>
          
          <Card 
            sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h3" sx={{ color: 'warning.main', fontWeight: 700 }}>
                {approvalCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Approvals
              </Typography>
            </CardContent>
          </Card>
          
          <Card 
            sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h3" sx={{ color: 'info.main', fontWeight: 700 }}>
                {mintCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Mints
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Transactions List - Left Aligned */}
        <Card 
          sx={{ 
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            maxWidth: '800px'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <HistoryIcon sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary'
                }}
              >
                All Transactions
              </Typography>
            </Box>
            
            {events.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>
                  No transactions yet
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                  Perform a transfer or approval to see the history
                </Typography>
                <Button
                  component={Link}
                  to="/"
                  variant="contained"
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                    }
                  }}
                >
                  Go to Dashboard
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 3 }}>
                {events.slice().reverse().map((event, index) => (
                  <Card 
                    key={index}
                    sx={{ 
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip 
                            label={event.type} 
                            size="small"
                            color={
                              event.type.toLowerCase() === 'transfer' ? 'success' :
                              event.type.toLowerCase() === 'approval' ? 'warning' : 'info'
                            }
                            variant="outlined"
                          />
                          <Chip 
                            label={event.token} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {event.amount}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong>From:</strong> {event.from ? `${event.from.slice(0, 6)}...${event.from.slice(-4)}` : '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong>To:</strong> {event.to ? `${event.to.slice(0, 6)}...${event.to.slice(-4)}` : '-'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography 
                          variant="body2" 
                          component="a"
                          href={`https://sepolia.etherscan.io/tx/${event.tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontFamily: 'monospace',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          Tx: {event.tx.slice(0, 10)}...
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
