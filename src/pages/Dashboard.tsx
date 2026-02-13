import { Box, Container, Typography } from '@mui/material'
import BalancesCard from './components/BalancesCard'
import ActionsForm from './components/ActionsForm'
import EventsTable from './components/EventsTable'
import PageTransition from './components/PageTransition'
import TokenPerformanceWidget from './components/TokenPerformanceWidget'
import PortfolioChart from './components/PortfolioChart'
import AllowanceManager from './components/AllowanceManager'
import BatchTransfer from './components/BatchTransfer'
import NetworkHealthPanel from './components/NetworkHealthPanel'

export default function Dashboard() {
  return (
    <PageTransition>
      <Container maxWidth="lg" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
        {/* Compact Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              color: 'text.primary',
            }}
          >
            Dashboard
          </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', fontSize: '0.875rem' }}
        >
          Manage ERC20 tokens on Sepolia
        </Typography>
      </Box>

      {/* Token Performance Snapshot */}
      <TokenPerformanceWidget />

      {/* Portfolio Chart */}
      <PortfolioChart />

      {/* Balance Cards */}
      <Box sx={{ mb: 3 }}>
        <BalancesCard />
      </Box>

        {/* Two-column layout: Operations + Events */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 3
        }}>
          <ActionsForm />
          <EventsTable />
        </Box>

        {/* Batch Transfer */}
        <Box sx={{ mb: 3 }}>
          <BatchTransfer />
        </Box>

        {/* Allowance Manager + Network Health */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}>
          <AllowanceManager />
          <NetworkHealthPanel />
        </Box>
      </Container>
    </PageTransition>
  )
}
