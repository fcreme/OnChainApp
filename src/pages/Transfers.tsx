import { useState } from 'react'
import { useAppStore, type AppEvent } from './store/useAppStore'
import { useCustomTokensStore } from '../stores/useCustomTokensStore'
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Tooltip,
  IconButton,
  Skeleton
} from '@mui/material'
import {
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { useResolveContact } from '../hooks/useResolveContact'
import { exportEventsToCSV } from '../lib/csvExport'
import PageTransition from './components/PageTransition'
import TransactionDetailDrawer from './components/TransactionDetailDrawer'
import { PageHeader, FilterBar, FilterBarSeparator, FilterBarSearch, HudChip, StatCard, EmptyState, SectionHeader } from './components/HudPrimitives'

function CopyableText({ text, display }: { text: string; display?: string }) {
  const { copy, copiedText } = useCopyToClipboard()
  const isCopied = copiedText === text

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {display || text}
      <Tooltip title={isCopied ? 'Copied!' : 'Copy'}>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); copy(text) }}
          sx={{ p: 0.25, color: isCopied ? '#a4cf5e' : 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          {isCopied ? <CheckIcon sx={{ fontSize: '0.75rem' }} /> : <CopyIcon sx={{ fontSize: '0.75rem' }} />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

function CopyableAddress({ address }: { address: string }) {
  const contactName = useResolveContact(address)
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`
  const display = contactName ? `${contactName} (${short})` : short
  return <CopyableText text={address} display={display} />
}

type TypeFilter = 'all' | 'transfer' | 'approval' | 'mint'

function getEventAccentColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'transfer': return '#a4cf5e'
    case 'approval': return '#ffb347'
    case 'mint': return '#14B8A6'
    default: return '#14B8A6'
  }
}

export default function Transfers() {
  const { events, isLoadingEvents } = useAppStore()
  const customTokens = useCustomTokensStore((s) => s.tokens)
  const allTokenFilters = ['all', 'DAI', 'USDC', ...customTokens.map((t) => t.symbol)]

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [tokenFilter, setTokenFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null)

  const filteredEvents = events.filter(e => {
    if (typeFilter !== 'all' && e.type.toLowerCase() !== typeFilter) return false
    if (tokenFilter !== 'all' && e.token !== tokenFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesTx = e.tx.toLowerCase().includes(q)
      const matchesFrom = e.from?.toLowerCase().includes(q) ?? false
      const matchesTo = e.to?.toLowerCase().includes(q) ?? false
      if (!matchesTx && !matchesFrom && !matchesTo) return false
    }
    return true
  })

  const totalTransactions = filteredEvents.length
  const transferCount = filteredEvents.filter(e => e.type.toLowerCase() === 'transfer').length
  const approvalCount = filteredEvents.filter(e => e.type.toLowerCase() === 'approval').length
  const mintCount = filteredEvents.filter(e => e.type.toLowerCase() === 'mint').length

  const exportButton = (
    <Button
      variant="outlined"
      size="small"
      startIcon={<ExportIcon sx={{ fontSize: '1rem !important' }} />}
      disabled={events.length === 0}
      onClick={() => exportEventsToCSV(filteredEvents)}
      sx={{ fontSize: '0.75rem', height: 32 }}
    >
      Export CSV
    </Button>
  )

  return (
    <PageTransition>
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      {/* Header */}
      <PageHeader
        icon={<HistoryIcon sx={{ fontSize: '1rem', color: '#14B8A6' }} />}
        title="Transfers"
        subtitle="Transaction history on Sepolia network"
        action={exportButton}
      />

      {/* Filter Bar */}
      <FilterBar>
        {(['all', 'transfer', 'approval', 'mint'] as TypeFilter[]).map(t => (
          <HudChip
            key={t}
            label={t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            active={typeFilter === t}
            onClick={() => setTypeFilter(t)}
          />
        ))}
        <FilterBarSeparator />
        {allTokenFilters.map(t => (
          <HudChip
            key={t}
            label={t === 'all' ? 'All' : t}
            active={tokenFilter === t}
            onClick={() => setTokenFilter(t)}
          />
        ))}
        <FilterBarSeparator />
        <FilterBarSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by tx hash or address..."
        />
      </FilterBar>

      {/* Statistics Cards */}
      {isLoadingEvents && events.length === 0 ? (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, mb: 2.5 }}>
          {[0, 1, 2, 3].map(i => (
            <Box
              key={i}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: '10px',
                p: 2,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Skeleton variant="text" width="40%" height={40} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
              <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, mb: 2.5 }}>
          <StatCard label="Total" count={totalTransactions} color="#14B8A6" icon="Σ" index={0} onClick={() => setTypeFilter('all')} />
          <StatCard label="Transfers" count={transferCount} color="#a4cf5e" icon="↗" index={1} onClick={() => setTypeFilter(typeFilter === 'transfer' ? 'all' : 'transfer')} />
          <StatCard label="Approvals" count={approvalCount} color="#ffb347" icon="✓" index={2} onClick={() => setTypeFilter(typeFilter === 'approval' ? 'all' : 'approval')} />
          <StatCard label="Mints" count={mintCount} color="#14B8A6" icon="✦" index={3} onClick={() => setTypeFilter(typeFilter === 'mint' ? 'all' : 'mint')} />
        </Box>
      )}

      {/* Transactions List */}
      <SectionHeader>All Transactions</SectionHeader>

      {isLoadingEvents && events.length === 0 ? (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {[0, 1, 2].map(i => (
            <Box
              key={i}
              sx={{
                bgcolor: (theme: any) => theme.palette.custom.bgTertiary,
                border: 1,
                borderColor: 'divider',
                borderRadius: '10px',
                overflow: 'hidden',
                p: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="rounded" width={70} height={24} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
                  <Skeleton variant="rounded" width={50} height={24} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
                </Box>
                <Skeleton variant="text" width={60} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
              </Box>
              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <Skeleton variant="text" width="70%" sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
                <Skeleton variant="text" width="70%" sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
              </Box>
              <Skeleton variant="text" width="30%" sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg, mt: 2 }} />
            </Box>
          ))}
        </Box>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<TrendingUpIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4 }} />}
          message={events.length === 0 ? 'No transactions yet' : 'No matching transactions'}
          submessage={events.length === 0
            ? 'Perform a transfer or approval to see the history'
            : 'Try adjusting your filters or search query'}
        >
          {events.length === 0 && (
            <Button
              component={Link}
              to="/"
              variant="contained"
              size="large"
            >
              Go to Dashboard
            </Button>
          )}
        </EmptyState>
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {filteredEvents.slice().reverse().map((event, index) => {
            const accentColor = getEventAccentColor(event.type)
            return (
              <Box
                key={index}
                onClick={() => setSelectedEvent(event)}
                sx={{
                  bgcolor: (theme) => theme.palette.custom.bgTertiary,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(20,184,166,0.3)',
                    transform: 'translateY(-1px)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}60, ${accentColor}00)`,
                  },
                }}
              >
                <Box sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Chip
                        label={event.type}
                        size="small"
                        color={
                          event.type.toLowerCase() === 'transfer' ? 'success' :
                          event.type.toLowerCase() === 'approval' ? 'warning' : 'info'
                        }
                        variant="outlined"
                        sx={{ fontSize: '0.72rem', height: 24, borderRadius: '6px' }}
                      />
                      <Chip
                        label={event.token}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.72rem', height: 24, borderRadius: '6px' }}
                      />
                    </Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                      {event.amount}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      <strong>From:</strong>{' '}
                      {event.from ? (
                        <CopyableAddress address={event.from} />
                      ) : '-'}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      <strong>To:</strong>{' '}
                      {event.to ? (
                        <CopyableAddress address={event.to} />
                      ) : '-'}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1.5 }}>
                    <Typography component="span" sx={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'text.secondary' }}>
                      <CopyableText
                        text={event.tx}
                        display={`Tx: ${event.tx.slice(0, 10)}...`}
                      />
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )
          })}
        </Box>
      )}

      <TransactionDetailDrawer
        open={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </Container>
    </PageTransition>
  )
}
