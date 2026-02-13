import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, Container, Typography, TextField, Chip, Button } from '@mui/material'
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material'
import PageTransition from './components/PageTransition'
import MarketCard, { MarketCardSkeleton } from './components/MarketCard'
import MarketDetailDrawer from './components/MarketDetailDrawer'
import { useMarketsStore, type MarketSortMode } from '../stores/useMarketsStore'
import type { MarketCoin } from '../lib/coingecko'

const SORT_OPTIONS: { label: string; value: MarketSortMode }[] = [
  { label: 'Rank', value: 'rank' },
  { label: 'Top Gainers', value: 'gainers' },
  { label: 'Top Losers', value: 'losers' },
  { label: 'Volume', value: 'volume' },
]

const REFRESH_INTERVAL = 60_000

export default function Markets() {
  const {
    coins,
    prevPrices,
    isLoading,
    error,
    searchQuery,
    sortMode,
    lastUpdated,
    fetchMarkets,
    setSearchQuery,
    setSortMode,
  } = useMarketsStore()

  useEffect(() => {
    fetchMarkets()
    const id = setInterval(fetchMarkets, REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [fetchMarkets])

  const displayed = useMemo(() => {
    let filtered = coins
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = coins.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
      )
    }

    const sorted = [...filtered]
    switch (sortMode) {
      case 'rank':
        sorted.sort((a, b) => a.rank - b.rank)
        break
      case 'gainers':
        sorted.sort((a, b) => b.priceChangePct24h - a.priceChangePct24h)
        break
      case 'losers':
        sorted.sort((a, b) => a.priceChangePct24h - b.priceChangePct24h)
        break
      case 'volume':
        sorted.sort((a, b) => b.volume24h - a.volume24h)
        break
    }
    return sorted
  }, [coins, searchQuery, sortMode])

  const [selectedCoin, setSelectedCoin] = useState<MarketCoin | null>(null)

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
              Markets
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
            Top cryptocurrencies by market cap
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
              <MarketCardSkeleton key={i} />
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
              onClick={fetchMarkets}
              sx={{ borderRadius: '8px' }}
            >
              Retry
            </Button>
          </Box>
        )}

        {/* Empty search results */}
        {!isLoading && !error && displayed.length === 0 && coins.length > 0 && (
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
              No coins match "{searchQuery}"
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
              {displayed.map((coin) => (
                <motion.div
                  key={coin.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  <MarketCard coin={coin} prevPrice={prevPrices[coin.id]} onSelect={setSelectedCoin} />
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        )}
      </Container>

      <MarketDetailDrawer
        open={Boolean(selectedCoin)}
        onClose={() => setSelectedCoin(null)}
        coin={selectedCoin}
      />
    </PageTransition>
  )
}
