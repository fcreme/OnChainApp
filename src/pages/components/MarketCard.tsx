import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, Typography, Skeleton } from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'
import type { MarketCoin } from '../../lib/coingecko'
import { formatPrice, formatMarketCap } from '../../lib/coingecko'

type FlashDir = 'up' | 'down' | null

/** Ticker-style animated value — slides old out, new in */
function AnimatedValue({ value, sx }: { value: string; sx?: Record<string, any> }) {
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', display: 'inline-flex', ...sx }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ display: 'inline-block' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </Box>
  )
}

interface MarketCardProps {
  coin: MarketCoin
  prevPrice?: number
  onSelect?: (coin: MarketCoin) => void
}

export default function MarketCard({ coin, prevPrice, onSelect }: MarketCardProps) {
  const isPositive = coin.priceChangePct24h >= 0
  const [flash, setFlash] = useState<FlashDir>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (prevPrice === undefined || prevPrice === coin.price) return
    setFlash(coin.price > prevPrice ? 'up' : 'down')
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setFlash(null), 1500)
    return () => clearTimeout(timeoutRef.current)
  }, [coin.price, prevPrice])

  const flashBorder = flash === 'up'
    ? 'rgba(164, 207, 94, 0.6)'
    : flash === 'down'
    ? 'rgba(244, 91, 91, 0.6)'
    : undefined

  const flashShadow = flash === 'up'
    ? '0 0 12px rgba(164, 207, 94, 0.25)'
    : flash === 'down'
    ? '0 0 12px rgba(244, 91, 91, 0.25)'
    : undefined

  const accentColor = isPositive ? '#a4cf5e' : '#f45b5b'

  return (
    <Box
      onClick={() => onSelect?.(coin)}
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: flashBorder ?? 'divider',
        borderRadius: '10px',
        p: 0,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        boxShadow: flashShadow ?? 'none',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          borderColor: flash ? flashBorder : `${accentColor}50`,
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 20px ${accentColor}12, 0 0 0 1px ${accentColor}15`,
          '& .card-glow': { opacity: 1 },
        },
      }}
    >
      {/* Top accent line */}
      <Box
        sx={{
          height: '2px',
          background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}80, ${accentColor}00)`,
        }}
      />

      {/* Hover glow */}
      <Box
        className="card-glow"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: `linear-gradient(180deg, ${accentColor}06, transparent)`,
          opacity: 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ p: 2, position: 'relative' }}>
      {/* Header: rank + image + name + symbol */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, minWidth: 20, fontVariantNumeric: 'tabular-nums' }}>
          #{coin.rank}
        </Typography>
        <Box
          component="img"
          src={coin.image}
          alt={coin.symbol}
          sx={{ width: 34, height: 34, borderRadius: '8px', flexShrink: 0, border: '1px solid', borderColor: 'divider' }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.82rem',
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {coin.name}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.65rem',
              color: 'text.secondary',
              fontWeight: 500,
              mt: 0.25,
            }}
          >
            {coin.symbol.toUpperCase()}
          </Typography>
        </Box>
      </Box>

      {/* Price + 24h change */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
        <Typography component="span" sx={{
          fontWeight: 700,
          fontSize: '1.1rem',
          fontVariantNumeric: 'tabular-nums',
          color: flash === 'up' ? '#a4cf5e' : flash === 'down' ? '#f45b5b' : 'text.primary',
          transition: 'color 0.3s ease',
        }}>
          <AnimatedValue value={formatPrice(coin.price)} />
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={isPositive ? 'up' : 'down'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'inline-flex' }}
            >
              {isPositive ? (
                <TrendingUpIcon sx={{ fontSize: '0.85rem', color: '#a4cf5e' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: '0.85rem', color: '#f45b5b' }} />
              )}
            </motion.span>
          </AnimatePresence>
          <Typography
            component="span"
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: isPositive ? '#a4cf5e' : '#f45b5b',
            }}
          >
            <AnimatedValue value={`${isPositive ? '+' : ''}${coin.priceChangePct24h.toFixed(1)}%`} />
          </Typography>
        </Box>
      </Box>

      {/* Stats grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
        <StatRow label="MCap" value={formatMarketCap(coin.marketCap)} />
        <StatRow label="Vol 24h" value={formatMarketCap(coin.volume24h)} />
        <StatRow
          label="1h"
          value={`${coin.priceChangePct1h >= 0 ? '+' : ''}${coin.priceChangePct1h.toFixed(1)}%`}
          color={coin.priceChangePct1h >= 0 ? '#a4cf5e' : '#f45b5b'}
        />
        <StatRow
          label="7d"
          value={`${coin.priceChangePct7d >= 0 ? '+' : ''}${coin.priceChangePct7d.toFixed(1)}%`}
          color={coin.priceChangePct7d >= 0 ? '#a4cf5e' : '#f45b5b'}
        />
      </Box>
      </Box>
    </Box>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</Typography>
      <Typography component="span" sx={{ fontSize: '0.7rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: color ?? 'text.primary' }}>
        <AnimatedValue value={value} />
      </Typography>
    </Box>
  )
}

export function MarketCardSkeleton() {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '10px',
        p: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Skeleton variant="text" width={20} height={16} />
        <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: '8px' }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="30%" height={16} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
      <Skeleton width="50%" height={24} sx={{ mb: 1.5 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={16} />
        ))}
      </Box>
    </Box>
  )
}
