import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, Container, Button } from '@mui/material'
import {
  Refresh as RefreshIcon,
  ShowChart as ShowChartIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material'
import PageTransition from './components/PageTransition'
import MarketCard, { MarketCardSkeleton } from './components/MarketCard'
import MarketDetailDrawer from './components/MarketDetailDrawer'
import { useMarketsStore, type MarketSortMode } from '../stores/useMarketsStore'
import type { MarketCoin } from '../lib/coingecko'
import {
  PageHeader,
  FilterBar,
  FilterBarSeparator,
  FilterBarSearch,
  HudChip,
  EmptyState,
  ResultCount,
} from './components/HudPrimitives'

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
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        <PageHeader
          icon={<ShowChartIcon sx={{ fontSize: '1rem', color: '#14B8A6' }} />}
          title="Markets"
          subtitle="Top cryptocurrencies by market cap"
          timestamp={lastUpdatedLabel}
        />

        <FilterBar>
          <FilterBarSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name or symbol..."
          />
          <FilterBarSeparator />
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {SORT_OPTIONS.map((opt) => (
              <HudChip
                key={opt.value}
                label={opt.label}
                active={sortMode === opt.value}
                onClick={() => setSortMode(opt.value)}
              />
            ))}
          </Box>
          {coins.length > 0 && <ResultCount count={displayed.length} />}
        </FilterBar>

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
              gap: 1.5,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </Box>
        )}

        {!isLoading && error && (
          <EmptyState
            icon={<ErrorIcon sx={{ fontSize: '2rem', color: 'rgba(20,184,166,0.3)' }} />}
            message={error}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchMarkets}
              sx={{ borderRadius: '8px' }}
            >
              Retry
            </Button>
          </EmptyState>
        )}

        {!isLoading && !error && displayed.length === 0 && coins.length > 0 && (
          <EmptyState message={`No coins match "${searchQuery}"`} />
        )}

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
              gap: 1.5,
            }}
          >
            <AnimatePresence mode="popLayout">
              {displayed.map((coin, i) => (
                <motion.div
                  key={coin.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -8 }}
                  transition={{
                    type: 'spring',
                    damping: 28,
                    stiffness: 340,
                    delay: Math.min(i * 0.03, 0.3),
                  }}
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
