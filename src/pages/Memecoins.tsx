import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, Container, Typography, TextField, Chip, Button } from '@mui/material'
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material'
import PageTransition from './components/PageTransition'
import MemecoinCard, { MemecoinCardSkeleton } from './components/MemecoinCard'
import MemecoinDetailDrawer from './components/MemecoinDetailDrawer'
import { useMemecoinStore, type SortMode } from '../stores/useMemecoinStore'
import type { MemecoinPair } from '../lib/dexscreener'

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: 'Trending', value: 'trending' },
  { label: 'Newest', value: 'newest' },
  { label: 'Volume', value: 'volume' },
  { label: 'Market Cap', value: 'marketCap' },
]

const DISCOVERY_INTERVAL = 60_000  // Full search every 60s
const FAST_REFRESH_INTERVAL = 10_000  // Price updates every 10s

export default function Memecoins() {
  const {
    pairs,
    prevPrices,
    isLoading,
    error,
    searchQuery,
    sortMode,
    lastUpdated,
    fetchMemecoins,
    refreshPairs,
    setSearchQuery,
    setSortMode,
  } = useMemecoinStore()

  // Initial discovery fetch + periodic full refresh
  useEffect(() => {
    fetchMemecoins()
    const id = setInterval(fetchMemecoins, DISCOVERY_INTERVAL)
    return () => clearInterval(id)
  }, [fetchMemecoins])

  // Fast price refresh every 10s (uses pairs endpoint)
  useEffect(() => {
    const id = setInterval(refreshPairs, FAST_REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [refreshPairs])

  // Client-side filter + sort
  const displayed = useMemo(() => {
    let filtered = pairs
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = pairs.filter(
        (p) =>
          p.tokenName.toLowerCase().includes(q) ||
          p.tokenSymbol.toLowerCase().includes(q)
      )
    }

    const sorted = [...filtered]
    switch (sortMode) {
      case 'trending':
        sorted.sort((a, b) => (b.buys24h + b.sells24h) - (a.buys24h + a.sells24h))
        break
      case 'newest':
        sorted.sort((a, b) => b.pairCreatedAt - a.pairCreatedAt)
        break
      case 'volume':
        sorted.sort((a, b) => b.volume24h - a.volume24h)
        break
      case 'marketCap':
        sorted.sort((a, b) => b.marketCap - a.marketCap)
        break
    }
    return sorted
  }, [pairs, searchQuery, sortMode])

  const [selectedPair, setSelectedPair] = useState<MemecoinPair | null>(null)

  const lastUpdatedLabel = lastUpdated
    ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
    : null

  return (
    <PageTransition>
      <Container maxWidth="lg" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                color: 'text.primary',
              }}
            >
              Memecoins
            </Typography>
            {lastUpdatedLabel && (
              <Chip
                label={lastUpdatedLabel}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  bgcolor: (theme) => theme.palette.custom.subtleBg,
                  color: 'text.secondary',
                }}
              />
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', fontSize: '0.875rem' }}
          >
            Trending Solana memecoins
          </Typography>
        </Box>

        {/* Filter bar */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            mb: 3,
          }}
        >
          <TextField
            size="small"
            placeholder="Search by name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon sx={{ fontSize: '1.1rem', color: 'text.secondary', mr: 1 }} />
                ),
              },
            }}
            sx={{
              minWidth: 220,
              '& .MuiOutlinedInput-root': {
                fontSize: '0.85rem',
                borderRadius: '8px',
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {SORT_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                size="small"
                onClick={() => setSortMode(opt.value)}
                sx={{
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  bgcolor:
                    sortMode === opt.value
                      ? 'rgba(20, 184, 166, 0.15)'
                      : (theme) => theme.palette.custom.subtleBg,
                  color: sortMode === opt.value ? 'primary.main' : 'text.secondary',
                  border: 1,
                  borderColor:
                    sortMode === opt.value
                      ? 'rgba(20, 184, 166, 0.3)'
                      : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(20, 184, 166, 0.1)',
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Loading skeletons */}
        {isLoading && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <MemecoinCardSkeleton key={i} />
            ))}
          </Box>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: '12px',
            }}
          >
            <ErrorIcon sx={{ fontSize: '2.5rem', color: 'text.secondary', mb: 1 }} />
            <Typography sx={{ color: 'text.secondary', mb: 2, fontSize: '0.9rem' }}>
              {error}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchMemecoins}
              sx={{ borderRadius: '8px' }}
            >
              Retry
            </Button>
          </Box>
        )}

        {/* Empty search results */}
        {!isLoading && !error && displayed.length === 0 && pairs.length > 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: '12px',
            }}
          >
            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
              No memecoins match "{searchQuery}"
            </Typography>
          </Box>
        )}

        {/* Data grid */}
        {!isLoading && !error && displayed.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            <AnimatePresence mode="popLayout">
              {displayed.map((pair) => (
                <motion.div
                  key={pair.pairAddress}
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  <MemecoinCard pair={pair} prevPrice={prevPrices[pair.pairAddress]} onSelect={setSelectedPair} />
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        )}
      </Container>

      <MemecoinDetailDrawer
        open={Boolean(selectedPair)}
        onClose={() => setSelectedPair(null)}
        pair={selectedPair}
      />
    </PageTransition>
  )
}
