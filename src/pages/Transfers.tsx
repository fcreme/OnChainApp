import { useState } from 'react'
import { useAppStore, type AppEvent } from './store/useAppStore'
import { useCustomTokensStore } from '../stores/useCustomTokensStore'
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Tooltip,
  IconButton,
  TextField,
  Skeleton
} from '@mui/material'
import {
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  FileDownload as ExportIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { useResolveContact } from '../hooks/useResolveContact'
import { exportEventsToCSV } from '../lib/csvExport'
import PageTransition from './components/PageTransition'
import TransactionDetailDrawer from './components/TransactionDetailDrawer'

function CopyableText({ text, display }: { text: string; display?: string }) {
  const { copy, copiedText } = useCopyToClipboard()
  const isCopied = copiedText === text

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {display || text}
      <Tooltip title={isCopied ? 'Copied!' : 'Copy'}>
        <IconButton
          size="small"
          onClick={() => copy(text)}
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

  const chipSx = (active: boolean) => ({
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
    borderColor: active ? 'primary.main' : (theme: any) => theme.palette.custom.subtleBorder,
    color: active ? 'primary.main' : 'text.secondary',
    background: active ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
    '&:hover': {
      borderColor: 'primary.main',
      background: 'rgba(20, 184, 166, 0.05)'
    }
  })

  const statCardSx = (active: boolean) => ({
    bgcolor: 'background.paper',
    border: active ? '1px solid rgba(20, 184, 166, 0.4)' : 1,
    borderColor: active ? 'rgba(20, 184, 166, 0.4)' : 'divider',
    boxShadow: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
    '&:hover': {
      borderColor: 'rgba(20, 184, 166, 0.3)'
    }
  })

  return (
    <PageTransition>
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header - Full Width */}
      <Box sx={{ mb: 6, maxWidth: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ExportIcon sx={{ fontSize: '1rem !important' }} />}
            disabled={events.length === 0}
            onClick={() => exportEventsToCSV(filteredEvents)}
          >
            Export CSV
          </Button>
        </Box>

        <Typography
          variant="h1"
          sx={{
            mb: 2,
            color: 'text.primary',
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

      {/* Filter Bar */}
      <Box sx={{
        mb: 4,
        p: 3,
        borderRadius: '8px',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        alignItems: { xs: 'stretch', md: 'center' }
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1, fontWeight: 600 }}>Type:</Typography>
          {(['all', 'transfer', 'approval', 'mint'] as TypeFilter[]).map(t => (
            <Chip
              key={t}
              label={t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              size="small"
              variant="outlined"
              onClick={() => setTypeFilter(t)}
              sx={chipSx(typeFilter === t)}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1, fontWeight: 600 }}>Token:</Typography>
          {allTokenFilters.map(t => (
            <Chip
              key={t}
              label={t === 'all' ? 'All' : t}
              size="small"
              variant="outlined"
              onClick={() => setTokenFilter(t)}
              sx={chipSx(tokenFilter === t)}
            />
          ))}
        </Box>

        <TextField
          size="small"
          placeholder="Search by tx hash or address..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
            }
          }}
          sx={{
            flex: 1,
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              fontSize: '0.875rem'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: (theme: any) => theme.palette.custom.subtleBorder,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: (theme: any) => theme.palette.custom.subtleBorder,
            }
          }}
        />
      </Box>

      {/* Statistics Cards - Full Width */}
      {isLoadingEvents && events.length === 0 ? (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, mb: 6, maxWidth: '100%' }}>
          {[0, 1, 2, 3].map(i => (
            <Card key={i} sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', boxShadow: 'none', borderRadius: '8px' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Skeleton variant="text" width="40%" height={50} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg, mx: 'auto' }} />
                <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg, mx: 'auto' }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, mb: 6, maxWidth: '100%' }}>
          <Card
            onClick={() => setTypeFilter('all')}
            sx={statCardSx(typeFilter === 'all')}
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
            onClick={() => setTypeFilter(typeFilter === 'transfer' ? 'all' : 'transfer')}
            sx={statCardSx(typeFilter === 'transfer')}
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
            onClick={() => setTypeFilter(typeFilter === 'approval' ? 'all' : 'approval')}
            sx={statCardSx(typeFilter === 'approval')}
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
            onClick={() => setTypeFilter(typeFilter === 'mint' ? 'all' : 'mint')}
            sx={statCardSx(typeFilter === 'mint')}
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
      )}

      {/* Transactions List - Left Aligned */}
      <Card
        sx={{
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          boxShadow: 'none',
          maxWidth: '100%'
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

          {isLoadingEvents && events.length === 0 ? (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {[0, 1, 2].map(i => (
                <Card key={i} sx={{ bgcolor: (theme: any) => theme.palette.custom.bgTertiary, border: 1, borderColor: 'divider', borderRadius: '8px' }}>
                  <CardContent sx={{ p: 3 }}>
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
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : filteredEvents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>
                {events.length === 0 ? 'No transactions yet' : 'No matching transactions'}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                {events.length === 0
                  ? 'Perform a transfer or approval to see the history'
                  : 'Try adjusting your filters or search query'}
              </Typography>
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
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {filteredEvents.slice().reverse().map((event, index) => (
                <Card
                  key={index}
                  onClick={() => setSelectedEvent(event)}
                  sx={{
                    bgcolor: (theme: any) => theme.palette.custom.bgTertiary,
                    border: 1,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: (theme: any) => theme.palette.custom.subtleBorder,
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
                        <strong>From:</strong>{' '}
                        {event.from ? (
                          <CopyableAddress address={event.from} />
                        ) : '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        <strong>To:</strong>{' '}
                        {event.to ? (
                          <CopyableAddress address={event.to} />
                        ) : '-'}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <CopyableText
                        text={event.tx}
                        display={`Tx: ${event.tx.slice(0, 10)}...`}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
      <TransactionDetailDrawer
        open={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </Container>
    </PageTransition>
  )
}
