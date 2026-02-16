import { Box, Container } from '@mui/material'
import { Dashboard as DashboardIcon } from '@mui/icons-material'
import { PageHeader } from './components/HudPrimitives'
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
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        <PageHeader
          icon={<DashboardIcon sx={{ fontSize: '1rem', color: '#14B8A6' }} />}
          title="Dashboard"
          subtitle="Manage ERC20 tokens on Sepolia"
        />

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
