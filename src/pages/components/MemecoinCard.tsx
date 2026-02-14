import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, Typography, Chip, Skeleton } from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'
import type { MemecoinPair } from '../../lib/dexscreener'
import { formatMemePrice, formatCompactNumber, formatAge } from '../../lib/dexscreener'

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

interface MemecoinCardProps {
  pair: MemecoinPair
  prevPrice?: string
  onSelect?: (pair: MemecoinPair) => void
}

export default function MemecoinCard({ pair, prevPrice, onSelect }: MemecoinCardProps) {
  const isPositive = pair.priceChange24h >= 0
  const fallbackInitials = pair.tokenSymbol.slice(0, 2).toUpperCase()
  const [flash, setFlash] = useState<FlashDir>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Detect price change and trigger flash
  useEffect(() => {
    if (!prevPrice || prevPrice === pair.priceUsd) return
    const prev = parseFloat(prevPrice)
    const curr = parseFloat(pair.priceUsd)
    if (isNaN(prev) || isNaN(curr) || prev === curr) return

    setFlash(curr > prev ? 'up' : 'down')
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setFlash(null), 1500)

    return () => clearTimeout(timeoutRef.current)
  }, [pair.priceUsd, prevPrice])

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

  return (
    <Box
      onClick={() => onSelect ? onSelect(pair) : window.open(pair.url, '_blank', 'noopener,noreferrer')}
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: flashBorder ?? 'divider',
        borderRadius: '12px',
        p: 2,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: flashShadow ?? 'none',
        '&:hover': {
          borderColor: flash ? flashBorder : 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)',
        },
      }}
    >
      {/* Header: image + name + symbol */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        {pair.imageUrl ? (
          <Box
            component="img"
            src={pair.imageUrl}
            alt={pair.tokenSymbol}
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none'
              const next = e.currentTarget.nextElementSibling as HTMLElement
              if (next) next.style.display = 'flex'
            }}
          />
        ) : null}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: pair.imageUrl ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
            {fallbackInitials}
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {pair.tokenName}
          </Typography>
          <Chip
            label={`$${pair.tokenSymbol}`}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 600,
              bgcolor: (theme) => theme.palette.custom.subtleBg,
              color: 'text.secondary',
            }}
          />
        </Box>
      </Box>

      {/* Price + 24h change */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
        <Typography component="span" sx={{
          fontWeight: 700,
          fontSize: '1.1rem',
          color: flash === 'up' ? '#a4cf5e' : flash === 'down' ? '#f45b5b' : 'text.primary',
          transition: 'color 0.3s ease',
        }}>
          <AnimatedValue value={formatMemePrice(pair.priceUsd)} />
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
            <AnimatedValue value={`${isPositive ? '+' : ''}${pair.priceChange24h.toFixed(1)}%`} />
          </Typography>
        </Box>
      </Box>

      {/* Stats grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
        <StatRow label="MCap" value={formatCompactNumber(pair.marketCap)} />
        <StatRow label="Vol 24h" value={formatCompactNumber(pair.volume24h)} />
        <StatRow label="Liq" value={formatCompactNumber(pair.liquidity)} />
        <StatRow label="Age" value={formatAge(pair.pairCreatedAt)} />
        <StatRow label="Buys" value={pair.buys24h.toLocaleString()} color="#a4cf5e" />
        <StatRow label="Sells" value={pair.sells24h.toLocaleString()} color="#f45b5b" />
      </Box>
    </Box>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{label}</Typography>
      <Typography component="span" sx={{ fontSize: '0.7rem', fontWeight: 600, color: color ?? 'text.primary' }}>
        <AnimatedValue value={value} />
      </Typography>
    </Box>
  )
}

export function MemecoinCardSkeleton() {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '12px',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Skeleton variant="circular" width={36} height={36} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="30%" height={16} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
      <Skeleton width="50%" height={24} sx={{ mb: 1.5 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={16} />
        ))}
      </Box>
    </Box>
  )
}
