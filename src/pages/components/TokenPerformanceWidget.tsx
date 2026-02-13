import { useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Skeleton,
  Stack,
  Typography
} from '@mui/material'
import {
  SyncAlt as SyncIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material'
import { useAppStore } from '../store/useAppStore'
import { useMarketsStore } from '../../stores/useMarketsStore'

const TOKEN_IDS: Array<{ id: string; symbol: 'DAI' | 'USDC'; label: string }> = [
  { id: 'dai', symbol: 'DAI', label: 'DAI' },
  { id: 'usd-coin', symbol: 'USDC', label: 'USDC' },
]

const parseNumber = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatUsd = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatChange = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

export default function TokenPerformanceWidget() {
  const balances = useAppStore((state) => state.balances)
  const { coins, isLoading, fetchMarkets, lastUpdated } = useMarketsStore()

  // Trigger initial fetch if Markets page hasn't been visited yet
  useEffect(() => {
    if (coins.length === 0 && !isLoading) {
      fetchMarkets()
    }
  }, [coins.length, isLoading, fetchMarkets])

  // Look up DAI and USDC from the markets data
  const tokenData = useMemo(() => {
    return TOKEN_IDS.map((t) => {
      const coin = coins.find((c) => c.id === t.id)
      return {
        ...t,
        price: coin?.price ?? 1.0, // stablecoins default to $1
        change: coin?.priceChangePct24h ?? 0,
        found: Boolean(coin),
      }
    })
  }, [coins])

  const totalUsd = useMemo(() => {
    return tokenData.reduce((sum, t) => {
      const balance = parseNumber(balances[t.symbol])
      return sum + balance * t.price
    }, 0)
  }, [balances, tokenData])

  const hasData = coins.length > 0

  const updatedLabel = lastUpdated
    ? `Updated ${new Date(lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : 'Fetching latest prices'

  return (
    <Card
      sx={{
        mb: 3,
        border: 1,
        borderColor: 'divider',
        background: 'background.paper',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Token Performance
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Live Sepolia USD pricing and balance value
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            {isLoading && <CircularProgress size={16} thickness={4} />}
            <Chip
              label={updatedLabel}
              size="small"
              variant="outlined"
              sx={{ borderColor: 'divider', color: 'text.secondary' }}
            />
          </Stack>
        </Box>

        <Box sx={{ mt: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {isLoading && !hasData ? (
            [0, 1].map((index) => (
              <Box key={index}>
                <Skeleton height={24} width="60%" sx={{ mb: 1 }} />
                <Skeleton height={32} width="80%" />
                <Skeleton height={20} width="40%" sx={{ mt: 1 }} />
                <Skeleton height={1} width="100%" sx={{ mt: 2 }} />
              </Box>
            ))
          ) : (
            tokenData.map((t) => {
              const balance = parseNumber(balances[t.symbol])
              const usdValue = balance * t.price
              const changeColor = t.change > 0 ? 'success.main' : t.change < 0 ? 'error.main' : 'text.secondary'
              const changeIcon =
                t.change > 0 ? (
                  <TrendingUpIcon sx={{ fontSize: '1rem', color: changeColor }} />
                ) : t.change < 0 ? (
                  <TrendingDownIcon sx={{ fontSize: '1rem', color: changeColor }} />
                ) : (
                  <SyncIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                )

              return (
                <Box key={t.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {t.label} / USD
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {changeIcon}
                      <Typography variant="body2" sx={{ color: changeColor }}>
                        {formatChange(t.change)}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ${formatUsd(t.price)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Holdings: {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{' '}
                    {t.symbol} (~${formatUsd(usdValue)})
                  </Typography>
                  <Divider sx={{ borderColor: 'divider', mt: 1 }} />
                </Box>
              )
            })
          )}
        </Box>

        {hasData && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Portfolio Value
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              ${formatUsd(totalUsd)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
