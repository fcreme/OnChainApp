import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, Container, Typography, TextField, Chip, Button, InputAdornment } from '@mui/material'
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Security as ShieldIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material'
import PageTransition from './components/PageTransition'
import RiskScoreCard from './components/RiskScoreCard'
import RiskDistributionChart from './components/RiskDistributionChart'
import FeatureImportanceChart from './components/FeatureImportanceChart'
import SigmoidChart from './components/SigmoidChart'
import TokenRiskDetailDrawer from './components/TokenRiskDetailDrawer'
import { useAnalysisStore, type RiskFilter } from '../stores/useAnalysisStore'
import { useMemecoinStore } from '../stores/useMemecoinStore'

const RISK_FILTERS: { label: string; value: RiskFilter; icon?: string }[] = [
  { label: 'All Tokens', value: 'all' },
  { label: 'Safe', value: 'safe' },
  { label: 'Medium', value: 'medium' },
  { label: 'High Risk', value: 'high' },
]

const RISK_FILTER_COLORS: Record<RiskFilter, string> = {
  all: '#14B8A6',
  safe: '#a4cf5e',
  medium: '#ffb347',
  high: '#f45b5b',
}

const statCardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

export default function Analysis() {
  const {
    results,
    selectedToken,
    searchQuery,
    riskFilter,
    sortField,
    sortDirection,
    lastAnalyzed,
    runAnalysis,
    setSelectedToken,
    setSearchQuery,
    setRiskFilter,
  } = useAnalysisStore()

  const { pairs, fetchMemecoins, hasFetchedOnce } = useMemecoinStore()

  // Fetch memecoins if not already loaded, then run analysis
  useEffect(() => {
    if (!hasFetchedOnce) {
      fetchMemecoins()
    }
  }, [hasFetchedOnce, fetchMemecoins])

  useEffect(() => {
    if (pairs.length > 0) {
      runAnalysis()
    }
  }, [pairs, runAnalysis])

  // Filter + sort
  const displayed = useMemo(() => {
    let filtered = results
    if (riskFilter !== 'all') {
      filtered = filtered.filter((r) => r.riskLevel === riskFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.tokenName.toLowerCase().includes(q) ||
          r.tokenSymbol.toLowerCase().includes(q)
      )
    }

    const sorted = [...filtered]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'score':
          cmp = a.score - b.score
          break
        case 'name':
          cmp = a.tokenName.localeCompare(b.tokenName)
          break
        case 'tokenAge':
          cmp = a.features.tokenAgeHours - b.features.tokenAgeHours
          break
      }
      return sortDirection === 'desc' ? -cmp : cmp
    })
    return sorted
  }, [results, riskFilter, searchQuery, sortField, sortDirection])

  const safeCount = results.filter((r) => r.riskLevel === 'safe').length
  const mediumCount = results.filter((r) => r.riskLevel === 'medium').length
  const highCount = results.filter((r) => r.riskLevel === 'high').length

  const lastAnalyzedLabel = lastAnalyzed
    ? `${new Date(lastAnalyzed).toLocaleTimeString()}`
    : null

  const stats = [
    { label: 'Scanned', count: results.length, color: '#14B8A6', icon: '⬡' },
    { label: 'Safe', count: safeCount, color: '#a4cf5e', icon: '◈' },
    { label: 'Medium', count: mediumCount, color: '#ffb347', icon: '◇' },
    { label: 'High Risk', count: highCount, color: '#f45b5b', icon: '⬢' },
  ]

  return (
    <PageTransition>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(20,184,166,0.05))',
                    border: '1px solid rgba(20,184,166,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldIcon sx={{ fontSize: '1rem', color: '#14B8A6' }} />
                </Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.35rem', sm: '1.6rem' },
                    color: 'text.primary',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  Risk Analysis
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.8rem',
                  pl: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                Logistic regression scoring for rug-pull risk
                {lastAnalyzedLabel && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: '0.65rem',
                      color: 'rgba(20,184,166,0.7)',
                      fontFamily: 'monospace',
                      bgcolor: 'rgba(20,184,166,0.06)',
                      px: 1,
                      py: 0.25,
                      borderRadius: '4px',
                      border: '1px solid rgba(20,184,166,0.12)',
                    }}
                  >
                    {lastAnalyzedLabel}
                  </Box>
                )}
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: '0.85rem !important' }} />}
              onClick={runAnalysis}
              sx={{
                fontSize: '0.75rem',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                bgcolor: (theme) => theme.palette.custom.subtleBg,
                px: 2,
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  bgcolor: 'rgba(20,184,166,0.06)',
                },
              }}
            >
              Re-analyze
            </Button>
          </Box>
        </Box>

        {/* Summary stat cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 1.5,
            mb: 3,
          }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={statCardVariants}
            >
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: '10px',
                  p: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: `${stat.color}40`,
                    boxShadow: `0 0 20px ${stat.color}08`,
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${stat.color}00, ${stat.color}60, ${stat.color}00)`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '0.65rem',
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 600,
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', opacity: 0.3 }}>
                    {stat.icon}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: stat.color,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {stat.count}
                </Typography>
                {results.length > 0 && stat.label !== 'Scanned' && (
                  <Typography
                    sx={{
                      fontSize: '0.6rem',
                      color: 'text.secondary',
                      mt: 0.5,
                      fontFamily: 'monospace',
                    }}
                  >
                    {((stat.count / results.length) * 100).toFixed(0)}% of total
                  </Typography>
                )}
              </Box>
            </motion.div>
          ))}
        </Box>

        {/* Charts row */}
        {results.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <RiskDistributionChart results={results} />
            <FeatureImportanceChart />
          </Box>
        )}

        {/* Sigmoid visualization */}
        {results.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <SigmoidChart results={results} />
          </Box>
        )}

        {/* Filter bar */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            mb: 2.5,
            p: 2,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: '10px',
          }}
        >
          <TextField
            size="small"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              minWidth: 200,
              flex: { xs: 1, sm: 'none' },
              '& .MuiOutlinedInput-root': {
                fontSize: '0.8rem',
                borderRadius: '8px',
                height: 36,
              },
            }}
          />
          <Box sx={{ height: 20, width: '1px', bgcolor: 'divider', display: { xs: 'none', sm: 'block' } }} />
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {RISK_FILTERS.map((opt) => {
              const filterColor = RISK_FILTER_COLORS[opt.value]
              const isActive = riskFilter === opt.value
              return (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  size="small"
                  onClick={() => setRiskFilter(opt.value)}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    height: 30,
                    borderRadius: '6px',
                    bgcolor: isActive ? `${filterColor}18` : 'transparent',
                    color: isActive ? filterColor : 'text.secondary',
                    border: 1,
                    borderColor: isActive ? `${filterColor}40` : 'divider',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: `${filterColor}12`,
                      borderColor: `${filterColor}30`,
                      color: filterColor,
                    },
                  }}
                />
              )
            })}
          </Box>
          {results.length > 0 && (
            <Typography
              sx={{
                ml: 'auto',
                fontSize: '0.7rem',
                color: 'text.secondary',
                fontFamily: 'monospace',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {displayed.length} result{displayed.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Empty state */}
        {results.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.04) 0%, transparent 70%)',
              },
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block', marginBottom: 12 }}
            >
              <TrendingIcon sx={{ fontSize: '2rem', color: 'rgba(20,184,166,0.3)' }} />
            </motion.div>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500 }}>
              Analyzing memecoins...
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem', mt: 0.5, opacity: 0.6 }}>
              Running logistic regression scoring
            </Typography>
          </Box>
        )}

        {/* No results after filtering */}
        {results.length > 0 && displayed.length === 0 && (
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
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              No tokens match the current filters
            </Typography>
          </Box>
        )}

        {/* Token risk cards grid */}
        {displayed.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 1.5,
            }}
          >
            <AnimatePresence mode="popLayout">
              {displayed.map((result, i) => (
                <motion.div
                  key={result.pairAddress}
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
                  <RiskScoreCard
                    result={result}
                    onClick={() => setSelectedToken(result)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        )}
      </Container>

      <TokenRiskDetailDrawer
        open={Boolean(selectedToken)}
        onClose={() => setSelectedToken(null)}
        result={selectedToken}
      />
    </PageTransition>
  )
}
