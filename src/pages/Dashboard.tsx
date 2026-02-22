import { useEffect } from 'react'
import { Box, Container, Typography } from '@mui/material'
import { Dashboard as DashboardIcon } from '@mui/icons-material'
import { PageHeader, StatCard, SectionHeader, HudCard } from './components/HudPrimitives'
import BalancesCard from './components/BalancesCard'
import ActionsForm from './components/ActionsForm'
import EventsTable from './components/EventsTable'
import PageTransition from './components/PageTransition'
import TokenPerformanceWidget from './components/TokenPerformanceWidget'
import PortfolioChart from './components/PortfolioChart'
import AllowanceManager from './components/AllowanceManager'
import BatchTransfer from './components/BatchTransfer'
import NetworkHealthPanel from './components/NetworkHealthPanel'
import DriftAlertCard from './components/reconciliation/DriftAlertCard'
import { useReconciliationStore } from '../stores/useReconciliationStore'
import { useDriftStore } from '../stores/useDriftStore'

function ReconciliationSummary() {
  const { stats, fetchStats } = useReconciliationStore()
  const { drifts, riskScores, fetchDrifts, fetchRiskScores } = useDriftStore()

  useEffect(() => {
    fetchStats()
    fetchDrifts()
    fetchRiskScores()
  }, [fetchStats, fetchDrifts, fetchRiskScores])

  const criticalDrifts = drifts.filter((d) => d.alert_level === 'critical' || d.alert_level === 'warning')
  const highRiskWallets = riskScores.filter((r) => r.risk_score >= 60)

  return (
    <Box sx={{ mb: 3 }}>
      <SectionHeader>Reconciliation Overview</SectionHeader>

      {/* Recon stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <StatCard label="Anchors" count={stats?.total_anchors ?? '-'} color="#14B8A6" index={0} />
        <StatCard label="Pending" count={stats?.pending_claims ?? '-'} color="#ffb347" index={1} />
        <StatCard label="Reconciled" count={stats?.reconciled ?? '-'} color="#a4cf5e" index={2} />
        <StatCard label="Suggestions" count={stats?.suggestions ?? '-'} color="#f45b5b" index={3} />
      </Box>

      {/* Drift alerts */}
      {criticalDrifts.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            Drift Alerts
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5 }}>
            {criticalDrifts.slice(0, 4).map((d) => (
              <Box key={`${d.wallet_address}-${d.token_symbol}`} sx={{ minWidth: 260, flex: '0 0 auto' }}>
                <DriftAlertCard drift={d} />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Wallet risk summary */}
      {highRiskWallets.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            High Risk Wallets
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5 }}>
            {highRiskWallets.slice(0, 4).map((r) => {
              const color = r.risk_score >= 80 ? '#f45b5b' : '#ffb347'
              return (
                <HudCard key={r.wallet_address} accentColor={color}>
                  <Box sx={{ p: 2, minWidth: 200 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'text.secondary' }}>
                        {r.wallet_address.slice(0, 8)}...{r.wallet_address.slice(-4)}
                      </Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color }}>
                        {r.risk_score.toFixed(0)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {r.risk_breakdown.new_counterparty > 0 && (
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.05)', px: 0.5, borderRadius: '3px' }}>
                          New party +{r.risk_breakdown.new_counterparty}
                        </Typography>
                      )}
                      {r.risk_breakdown.amount_anomaly > 0 && (
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.05)', px: 0.5, borderRadius: '3px' }}>
                          Amt anomaly +{r.risk_breakdown.amount_anomaly.toFixed(0)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </HudCard>
              )
            })}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default function Dashboard() {
  return (
    <PageTransition>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        <PageHeader
          icon={<DashboardIcon sx={{ fontSize: '1rem', color: '#14B8A6' }} />}
          title="Dashboard"
          subtitle="Manage ERC20 tokens on Sepolia"
        />

        {/* Reconciliation Overview */}
        <ReconciliationSummary />

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
