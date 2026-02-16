import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, Container, Button } from '@mui/material'
import {
  Refresh as RefreshIcon,
  Whatshot as WhatshotIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material'
import PageTransition from './components/PageTransition'
import MemecoinCard, { MemecoinCardSkeleton } from './components/MemecoinCard'
import MemecoinDetailDrawer from './components/MemecoinDetailDrawer'
import { useMemecoinStore, type SortMode } from '../stores/useMemecoinStore'
import type { MemecoinPair } from '../lib/dexscreener'
import {
  PageHeader,
  FilterBar,
  FilterBarSeparator,
  FilterBarSearch,
  HudChip,
  EmptyState,
  ResultCount,
} from './components/HudPrimitives'

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: 'Trending', value: 'trending' },
  { label: 'Newest', value: 'newest' },
  { label: 'Volume', value: 'volume' },
  { label: 'Market Cap', value: 'marketCap' },
]

const DISCOVERY_INTERVAL = 60_000
const FAST_REFRESH_INTERVAL = 10_000

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

  useEffect(() => {
    fetchMemecoins()
    const id = setInterval(fetchMemecoins, DISCOVERY_INTERVAL)
    return () => clearInterval(id)
  }, [fetchMemecoins])

  useEffect(() => {
    const id = setInterval(refreshPairs, FAST_REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [refreshPairs])

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
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        <PageHeader
          icon={<WhatshotIcon sx={{ fontSize: '1rem', color: '#14B8A6' }} />}
          title="Memecoins"
          subtitle="Trending Solana memecoins"
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
          {pairs.length > 0 && <ResultCount count={displayed.length} />}
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
              <MemecoinCardSkeleton key={i} />
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
              onClick={fetchMemecoins}
              sx={{ borderRadius: '8px' }}
            >
              Retry
            </Button>
          </EmptyState>
        )}

        {!isLoading && !error && displayed.length === 0 && pairs.length > 0 && (
          <EmptyState message={`No memecoins match "${searchQuery}"`} />
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
              {displayed.map((pair, i) => (
                <motion.div
                  key={pair.pairAddress}
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
