import { useState, useEffect } from 'react'
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Button,
  Skeleton,
  Tooltip,
  LinearProgress,
} from '@mui/material'
import {
  OpenInNew as ExternalIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material'
import type { MemecoinPair, TimeframeData } from '../../lib/dexscreener'
import { formatMemePrice, formatCompactNumber, formatAge } from '../../lib/dexscreener'
import { useThemeStore } from '../../stores/useThemeStore'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'

interface Props {
  open: boolean
  onClose: () => void
  pair: MemecoinPair | null
}

type Timeframe = 'm5' | 'h1' | 'h6' | 'h24'
const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: 'm5', label: '5M' },
  { key: 'h1', label: '1H' },
  { key: 'h6', label: '6H' },
  { key: 'h24', label: '24H' },
]

function PriceChangeChip({ value }: { value: number }) {
  const isPos = value >= 0
  return (
    <Typography
      sx={{
        fontSize: '0.8rem',
        fontWeight: 700,
        color: value === 0 ? 'text.secondary' : isPos ? '#a4cf5e' : '#f45b5b',
      }}
    >
      {isPos ? '+' : ''}{value.toFixed(2)}%
    </Typography>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}>
      {children}
    </Typography>
  )
}

function StatCell({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 0.25, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: color ?? 'text.primary' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
    </Box>
  )
}

function StatsRow({ items, bgcolor }: { items: { label: string; value: string | number; color?: string }[]; bgcolor?: string }) {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      gap: 0.5,
      p: 1.25,
      borderRadius: '8px',
      bgcolor: bgcolor ?? ((theme: any) => theme.palette.custom.subtleBg),
      border: 1,
      borderColor: 'divider',
    }}>
      {items.map((item) => (
        <StatCell key={item.label} {...item} />
      ))}
    </Box>
  )
}

function getTimeframeValue(data: TimeframeData, tf: Timeframe): number {
  return data[tf]
}

interface RugcheckRisk {
  name: string
  description: string
  level: string
  score: number
}

interface RugcheckHolder {
  address: string
  pct: number
  insider: boolean
}

interface RugcheckReport {
  score: number
  rugged: boolean
  risks: RugcheckRisk[]
  topHolders: RugcheckHolder[]
  totalMarketLiquidity: number
  totalHolders: number
  freezeAuthority: string | null
  mintAuthority: string | null
  graphInsidersDetected: number
  mutable: boolean
  launchpad: string | null
  transferFeePct: number
}

function useRugcheck(tokenAddress: string | null) {
  const [report, setReport] = useState<RugcheckReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenAddress) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setReport(null)

    fetch(`https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setReport({
          score: data.score ?? 0,
          rugged: data.rugged ?? false,
          risks: data.risks ?? [],
          topHolders: (data.topHolders ?? []).slice(0, 10).map((h: any) => ({
            address: h.address ?? '',
            pct: h.pct ?? 0,
            insider: h.insider ?? false,
          })),
          totalMarketLiquidity: data.totalMarketLiquidity ?? 0,
          totalHolders: data.totalHolders ?? 0,
          freezeAuthority: data.freezeAuthority,
          mintAuthority: data.mintAuthority,
          graphInsidersDetected: data.graphInsidersDetected ?? 0,
          mutable: data.tokenMeta?.mutable ?? false,
          launchpad: data.launchpad?.name ?? null,
          transferFeePct: data.transferFee?.pct ?? 0,
        })
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [tokenAddress])

  return { report, loading, error }
}

function getRiskColor(score: number): string {
  if (score <= 300) return '#a4cf5e'
  if (score <= 700) return '#ffb347'
  return '#f45b5b'
}

function getRiskLabel(score: number): string {
  if (score <= 300) return 'Good'
  if (score <= 700) return 'Warning'
  return 'Danger'
}

function getRiskLevelColor(level: string): string {
  switch (level) {
    case 'critical': return '#f45b5b'
    case 'high': return '#f45b5b'
    case 'warn': return '#ffb347'
    case 'medium': return '#ffb347'
    default: return 'text.secondary'
  }
}

export default function MemecoinDetailDrawer({ open, onClose, pair }: Props) {
  const { mode } = useThemeStore()
  const [activeTab, setActiveTab] = useState<Timeframe>('h24')
  const { copy, copied } = useCopyToClipboard()
  const rugcheck = useRugcheck(open && pair ? pair.tokenAddress : null)

  if (!pair) return null

  const isPositive = pair.priceChange24h >= 0
  const fallbackInitials = pair.tokenSymbol.slice(0, 2).toUpperCase()
  const embedUrl = `${pair.url}?embed=1&info=0&theme=${mode}`

  const tfBuys = getTimeframeValue(pair.buys, activeTab)
  const tfSells = getTimeframeValue(pair.sells, activeTab)
  const tfTxns = tfBuys + tfSells
  const tfVolume = getTimeframeValue(pair.volume, activeTab)
  const tfMakers = tfBuys + tfSells // unique makers not available, use txn total as proxy

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <Box sx={{
          px: 3,
          py: 1.5,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={onClose} size="small" sx={{ mr: 0.5 }}>
              <BackIcon />
            </IconButton>
            {pair.imageUrl ? (
              <Box
                component="img"
                src={pair.imageUrl}
                alt={pair.tokenSymbol}
                sx={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
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
              <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                {fallbackInitials}
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
              {pair.tokenName}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy ticker'} arrow>
              <Chip
                label={`$${pair.tokenSymbol}`}
                size="small"
                icon={<CopyIcon sx={{ fontSize: '0.65rem !important' }} />}
                onClick={(e) => { e.stopPropagation(); copy(pair.tokenSymbol) }}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: (theme) => theme.palette.custom.subtleBg,
                  color: 'text.secondary',
                  cursor: 'pointer',
                  '& .MuiChip-icon': { color: 'text.secondary', ml: 0.5 },
                  '&:hover': { bgcolor: (theme: any) => theme.palette.custom.hoverBg },
                }}
              />
            </Tooltip>
            <Chip
              label={`${pair.chainId.charAt(0).toUpperCase() + pair.chainId.slice(1)} › ${pair.dexId.charAt(0).toUpperCase() + pair.dexId.slice(1)}`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 600,
                bgcolor: 'rgba(20, 184, 166, 0.1)',
                color: 'primary.main',
                border: 0,
              }}
            />
            <Divider orientation="vertical" flexItem sx={{ mx: 0.25, borderColor: 'divider' }} />
            {[
              { label: 'MCap', value: formatCompactNumber(pair.marketCap) },
              { label: 'Liq', value: formatCompactNumber(pair.liquidity) },
              { label: 'Vol 24h', value: formatCompactNumber(pair.volume24h) },
              { label: 'Age', value: formatAge(pair.pairCreatedAt) },
            ].map((s) => (
              <Chip
                key={s.label}
                label={`${s.label}: ${s.value}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                  color: 'text.secondary',
                  border: 0,
                }}
              />
            ))}
            <Divider orientation="vertical" flexItem sx={{ mx: 0.25, borderColor: 'divider' }} />
            {[
              { label: '5m', value: pair.priceChange.m5 },
              { label: '1h', value: pair.priceChange.h1 },
              { label: '6h', value: pair.priceChange.h6 },
              { label: '24h', value: pair.priceChange.h24 },
            ].map((t) => (
              <Chip
                key={t.label}
                label={`${t.label}: ${t.value >= 0 ? '+' : ''}${t.value.toFixed(1)}%`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: t.value === 0 ? (theme: any) => theme.palette.custom.subtleBg
                    : t.value > 0 ? 'rgba(164, 207, 94, 0.1)' : 'rgba(244, 91, 91, 0.1)',
                  color: t.value === 0 ? 'text.secondary' : t.value > 0 ? '#a4cf5e' : '#f45b5b',
                  border: 0,
                }}
              />
            ))}
            <Box sx={{ flex: 1 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
              {formatMemePrice(pair.priceUsd)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mr: 1 }}>
              {isPositive ? (
                <TrendingUpIcon sx={{ fontSize: '0.9rem', color: '#a4cf5e' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: '0.9rem', color: '#f45b5b' }} />
              )}
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', color: isPositive ? '#a4cf5e' : '#f45b5b' }}>
                {isPositive ? '+' : ''}{pair.priceChange24h.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main content: chart left, stats right */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
        }}>
          {/* Chart area */}
          <Box sx={{
            flex: 1,
            position: 'relative',
            minHeight: { xs: 350, md: 'auto' },
            overflow: 'hidden',
          }}>
            <Skeleton
              variant="rectangular"
              sx={{ position: 'absolute', inset: 0, zIndex: 0 }}
            />
            <Box
              component="iframe"
              src={embedUrl}
              title={`${pair.tokenSymbol} chart`}
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                width: '100%',
                height: 'calc(100% + 50px)',
                border: 'none',
              }}
            />
          </Box>

          {/* Stats panel */}
          <Box sx={{
            width: { xs: '100%', md: 340 },
            flexShrink: 0,
            borderLeft: { md: 1 },
            borderTop: { xs: 1, md: 0 },
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflowY: 'auto',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            {/* Header banner */}
            {pair.headerUrl && (
              <Box
                component="img"
                src={pair.headerUrl}
                alt={`${pair.tokenName} banner`}
                sx={{
                  width: '100%',
                  height: 100,
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: 1,
                  borderColor: 'divider',
                }}
              />
            )}

            {/* Social links */}
            {(pair.websites.length > 0 || pair.socials.length > 0) && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {pair.websites.map((w) => (
                  <Chip
                    key={w.url}
                    label={w.label || 'Website'}
                    size="small"
                    component="a"
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    icon={<ExternalIcon sx={{ fontSize: '0.75rem !important' }} />}
                    sx={{
                      height: 26,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                      color: 'text.primary',
                      '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.1)', color: 'primary.main' },
                    }}
                  />
                ))}
                {pair.socials.map((s) => (
                  <Chip
                    key={s.url}
                    label={s.type === 'twitter' ? 'Twitter' : s.type === 'telegram' ? 'Telegram' : s.type === 'discord' ? 'Discord' : s.type}
                    size="small"
                    component="a"
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    icon={
                      s.type === 'twitter' ? <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 700, ml: 0.5 }}>𝕏</Box>
                      : s.type === 'telegram' ? <Box component="span" sx={{ fontSize: '0.75rem', ml: 0.5 }}>✈</Box>
                      : <ExternalIcon sx={{ fontSize: '0.75rem !important' }} />
                    }
                    sx={{
                      height: 26,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                      color: 'text.primary',
                      '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.1)', color: 'primary.main' },
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Key metrics row */}
            <Box>
              <SectionLabel>Key Metrics</SectionLabel>
              <StatsRow items={[
                { label: 'Liquidity', value: formatCompactNumber(pair.liquidity) },
                { label: 'FDV', value: formatCompactNumber(pair.fdv) },
                { label: 'MCap', value: formatCompactNumber(pair.marketCap) },
              ]} />
            </Box>

            {/* Price change across timeframes */}
            <Box>
              <SectionLabel>Price Change</SectionLabel>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 0.75,
              }}>
                {TIMEFRAMES.map(({ key, label }) => {
                  const val = getTimeframeValue(pair.priceChange, key)
                  return (
                    <Box key={key} sx={{
                      textAlign: 'center',
                      p: 1,
                      borderRadius: '8px',
                      bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                      border: 1,
                      borderColor: 'divider',
                    }}>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 0.25, textTransform: 'uppercase' }}>
                        {label}
                      </Typography>
                      <PriceChangeChip value={val} />
                    </Box>
                  )
                })}
              </Box>
            </Box>

            <Divider />

            {/* Timeframe tabs */}
            <Box>
              <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5 }}>
                {TIMEFRAMES.map(({ key, label }) => (
                  <Chip
                    key={key}
                    label={label}
                    size="small"
                    onClick={() => setActiveTab(key)}
                    sx={{
                      height: 26,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: activeTab === key ? 'primary.main' : ((theme: any) => theme.palette.custom.subtleBg),
                      color: activeTab === key ? '#fff' : 'text.secondary',
                      border: 1,
                      borderColor: activeTab === key ? 'primary.main' : 'divider',
                      '&:hover': {
                        bgcolor: activeTab === key ? 'primary.dark' : ((theme: any) => theme.palette.custom.hoverBg),
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Transactions */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <StatsRow items={[
                  { label: 'TXNS', value: tfTxns },
                  { label: 'BUYS', value: tfBuys, color: '#a4cf5e' },
                  { label: 'SELLS', value: tfSells, color: '#f45b5b' },
                ]} />

                {/* Buy/Sell bar */}
                <Box sx={{
                  display: 'flex',
                  height: 6,
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                }}>
                  {tfTxns > 0 && (
                    <>
                      <Box sx={{ width: `${(tfBuys / tfTxns) * 100}%`, bgcolor: '#a4cf5e', transition: 'width 0.3s ease' }} />
                      <Box sx={{ width: `${(tfSells / tfTxns) * 100}%`, bgcolor: '#f45b5b', transition: 'width 0.3s ease' }} />
                    </>
                  )}
                </Box>

                {/* Volume */}
                <StatsRow items={[
                  { label: 'VOLUME', value: formatCompactNumber(tfVolume) },
                  { label: 'BUY VOL', value: formatCompactNumber(tfTxns > 0 ? tfVolume * (tfBuys / tfTxns) : 0), color: '#a4cf5e' },
                  { label: 'SELL VOL', value: formatCompactNumber(tfTxns > 0 ? tfVolume * (tfSells / tfTxns) : 0), color: '#f45b5b' },
                ]} />

                {/* Makers */}
                <StatsRow items={[
                  { label: 'MAKERS', value: tfMakers },
                  { label: 'BUYERS', value: tfBuys, color: '#a4cf5e' },
                  { label: 'SELLERS', value: tfSells, color: '#f45b5b' },
                ]} />
              </Box>
            </Box>

            <Divider />

            {/* Pair Info */}
            <Box>
              <SectionLabel>Pair Info</SectionLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Token</Typography>
                  <Tooltip title={copied ? 'Copied!' : 'Copy address'} arrow>
                    <Typography
                      onClick={() => copy(pair.tokenAddress)}
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'text.primary',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      {pair.tokenAddress.slice(0, 6)}...{pair.tokenAddress.slice(-4)}
                    </Typography>
                  </Tooltip>
                </Box>
                <InfoRow label="Pair" value={`${pair.pairAddress.slice(0, 6)}...${pair.pairAddress.slice(-4)}`} mono />
                <InfoRow label="Chain" value={pair.chainId.charAt(0).toUpperCase() + pair.chainId.slice(1)} />
                <InfoRow label="DEX" value={pair.dexId.charAt(0).toUpperCase() + pair.dexId.slice(1)} />
                <InfoRow label="Price (Native)" value={`${parseFloat(pair.priceNative).toPrecision(4)} ${pair.quoteSymbol}`} />
                <InfoRow label="Age" value={formatAge(pair.pairCreatedAt)} />
              </Box>
            </Box>

            <Divider />

            {/* Rugcheck */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <SectionLabel>Rugcheck</SectionLabel>
                <Tooltip title="View on Rugcheck">
                  <IconButton
                    size="small"
                    onClick={() => window.open(`https://rugcheck.xyz/tokens/${pair.tokenAddress}`, '_blank', 'noopener,noreferrer')}
                    sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                  >
                    <ExternalIcon sx={{ fontSize: '0.8rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              {rugcheck.loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Skeleton variant="rounded" height={52} sx={{ borderRadius: '8px' }} />
                  <Skeleton variant="rounded" height={32} sx={{ borderRadius: '8px' }} />
                  <Skeleton variant="rounded" height={32} sx={{ borderRadius: '8px' }} />
                  <Skeleton variant="rounded" height={60} sx={{ borderRadius: '8px' }} />
                </Box>
              )}
              {rugcheck.error && (
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  Could not load Rugcheck data
                </Typography>
              )}
              {rugcheck.report && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Score badge */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                    border: 1,
                    borderColor: 'divider',
                  }}>
                    <Box sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${getRiskColor(rugcheck.report.score)}20`,
                      border: 2,
                      borderColor: getRiskColor(rugcheck.report.score),
                      flexShrink: 0,
                    }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: getRiskColor(rugcheck.report.score) }}>
                        {rugcheck.report.score}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: getRiskColor(rugcheck.report.score) }}>
                          {getRiskLabel(rugcheck.report.score)}
                        </Typography>
                        {rugcheck.report.rugged && (
                          <Chip label="RUGGED" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: '#f45b5b', color: '#fff' }} />
                        )}
                      </Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        {rugcheck.report.risks.length} risk{rugcheck.report.risks.length !== 1 ? 's' : ''} detected
                      </Typography>
                    </Box>
                  </Box>

                  {/* Security flags */}
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 0.75,
                  }}>
                    <SecurityFlag label="Mint Auth" safe={!rugcheck.report.mintAuthority} />
                    <SecurityFlag label="Freeze Auth" safe={!rugcheck.report.freezeAuthority} />
                    <SecurityFlag label="Mutable" safe={!rugcheck.report.mutable} />
                    <SecurityFlag label="Transfer Fee" safe={rugcheck.report.transferFeePct === 0} value={rugcheck.report.transferFeePct > 0 ? `${rugcheck.report.transferFeePct}%` : undefined} />
                  </Box>

                  {/* Token stats row */}
                  <StatsRow items={[
                    { label: 'Holders', value: rugcheck.report.totalHolders.toLocaleString() },
                    { label: 'Liquidity', value: formatCompactNumber(rugcheck.report.totalMarketLiquidity) },
                    { label: 'Insiders', value: rugcheck.report.graphInsidersDetected.toString(), color: rugcheck.report.graphInsidersDetected > 0 ? '#f45b5b' : '#a4cf5e' },
                  ]} />

                  {/* Launchpad */}
                  {rugcheck.report.launchpad && (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.25,
                      py: 0.75,
                      borderRadius: '8px',
                      bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                      border: 1,
                      borderColor: 'divider',
                    }}>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Launched via</Typography>
                      <Chip label={rugcheck.report.launchpad} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, color: 'primary.main', borderColor: 'primary.main' }} variant="outlined" />
                    </Box>
                  )}

                  {/* Risk list */}
                  {rugcheck.report.risks.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.3, mb: 0.75 }}>
                        Risks
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {rugcheck.report.risks.slice(0, 6).map((risk, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                            <Chip
                              label={risk.level}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.5rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: getRiskLevelColor(risk.level),
                                borderColor: getRiskLevelColor(risk.level),
                                mt: 0.15,
                                minWidth: 48,
                              }}
                              variant="outlined"
                            />
                            <Typography sx={{ fontSize: '0.7rem', color: 'text.primary', lineHeight: 1.3 }}>
                              {risk.name}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Top Holders */}
                  {rugcheck.report.topHolders.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.3, mb: 0.75 }}>
                        Top Holders
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {rugcheck.report.topHolders.slice(0, 5).map((holder, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', fontFamily: 'monospace', minWidth: 70, flexShrink: 0 }}>
                              {holder.address.slice(0, 4)}...{holder.address.slice(-4)}
                            </Typography>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(holder.pct, 100)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: holder.insider ? '#f45b5b' : holder.pct > 10 ? '#ffb347' : '#a4cf5e',
                                    borderRadius: 3,
                                  },
                                }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 50, justifyContent: 'flex-end' }}>
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.primary' }}>
                                {holder.pct.toFixed(1)}%
                              </Typography>
                              {holder.insider && (
                                <Chip label="INS" size="small" sx={{ height: 14, fontSize: '0.45rem', fontWeight: 700, bgcolor: '#f45b5b', color: '#fff' }} />
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Dialog>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.primary', fontFamily: mono ? 'monospace' : undefined }}>
        {value}
      </Typography>
    </Box>
  )
}

function SecurityFlag({ label, safe, value }: { label: string; safe: boolean; value?: string }) {
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: 1.25,
      py: 0.75,
      borderRadius: '6px',
      bgcolor: (theme: any) => theme.palette.custom.subtleBg,
      border: 1,
      borderColor: 'divider',
    }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{label}</Typography>
      <Chip
        label={value ?? (safe ? 'None' : 'Enabled')}
        size="small"
        sx={{
          height: 16,
          fontSize: '0.5rem',
          fontWeight: 700,
          bgcolor: safe ? 'rgba(164, 207, 94, 0.15)' : 'rgba(244, 91, 91, 0.15)',
          color: safe ? '#a4cf5e' : '#f45b5b',
          border: 'none',
        }}
      />
    </Box>
  )
}

