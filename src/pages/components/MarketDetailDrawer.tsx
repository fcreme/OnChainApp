import { useState, useEffect } from 'react'
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Skeleton,
  Tooltip,
  LinearProgress,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material'
import type { MarketCoin } from '../../lib/coingecko'
import { formatPrice, formatMarketCap, formatSupply } from '../../lib/coingecko'
import { useThemeStore } from '../../stores/useThemeStore'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'

interface CoinLinks {
  homepage: string | null
  twitter: string | null
  telegram: string | null
  reddit: string | null
  github: string | null
  description: string | null
  image: string | null
}

function useCoinLinks(coinId: string | null, open: boolean) {
  const [links, setLinks] = useState<CoinLinks | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!coinId || !open) { setLinks(null); return }
    let cancelled = false
    setIsLoading(true)

    fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setLinks({
          homepage: data.links?.homepage?.[0] || null,
          twitter: data.links?.twitter_screen_name || null,
          telegram: data.links?.telegram_channel_identifier || null,
          reddit: data.links?.subreddit_url || null,
          github: data.links?.repos_url?.github?.[0] || null,
          description: data.description?.en || null,
          image: data.image?.large || null,
        })
      })
      .catch(() => { if (!cancelled) setLinks(null) })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [coinId, open])

  return { links, isLoading }
}

interface Props {
  open: boolean
  onClose: () => void
  coin: MarketCoin | null
}

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > 150

  return (
    <Box>
      <Typography sx={{
        fontSize: '0.72rem',
        color: 'text.secondary',
        lineHeight: 1.5,
        display: '-webkit-box',
        WebkitLineClamp: expanded ? 'unset' : 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {text}
      </Typography>
      {isLong && (
        <Typography
          component="span"
          onClick={() => setExpanded(!expanded)}
          sx={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'primary.main',
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </Typography>
      )}
    </Box>
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

function StatsRow({ items }: { items: { label: string; value: string | number; color?: string }[] }) {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      gap: 0.5,
      p: 1.25,
      borderRadius: '8px',
      bgcolor: (theme: any) => theme.palette.custom.subtleBg,
      border: 1,
      borderColor: 'divider',
    }}>
      {items.map((item) => (
        <StatCell key={item.label} {...item} />
      ))}
    </Box>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.primary' }}>
        {value}
      </Typography>
    </Box>
  )
}

function PctChip({ label, value }: { label: string; value: number }) {
  const isPos = value >= 0
  return (
    <Box sx={{
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
      <Typography sx={{
        fontSize: '0.8rem',
        fontWeight: 700,
        color: value === 0 ? 'text.secondary' : isPos ? '#a4cf5e' : '#f45b5b',
      }}>
        {isPos ? '+' : ''}{value.toFixed(2)}%
      </Typography>
    </Box>
  )
}

export default function MarketDetailDrawer({ open, onClose, coin }: Props) {
  const { mode } = useThemeStore()
  const { copy, copied } = useCopyToClipboard()
  const { links, isLoading: linksLoading } = useCoinLinks(coin?.id ?? null, open)

  if (!coin) return null

  const isPositive = coin.priceChangePct24h >= 0

  // TradingView widget embed
  const tvSymbol = `${coin.symbol.toUpperCase()}USD`
  const tvTheme = mode === 'dark' ? 'dark' : 'light'
  const tvUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview&symbol=${tvSymbol}&interval=60&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=&theme=${tvTheme}&style=1&timezone=exchange&withdateranges=1&showpopupbutton=0&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart`

  // Supply percentage
  const supplyPct = coin.maxSupply && coin.maxSupply > 0
    ? (coin.circulatingSupply / coin.maxSupply) * 100
    : null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: 'background.default' } }}
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
            <Box
              component="img"
              src={coin.image}
              alt={coin.symbol}
              sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}
            />
            <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
              {coin.name}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy symbol'} arrow>
              <Chip
                label={coin.symbol.toUpperCase()}
                size="small"
                icon={<CopyIcon sx={{ fontSize: '0.65rem !important' }} />}
                onClick={(e) => { e.stopPropagation(); copy(coin.symbol.toUpperCase()) }}
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
            {coin.rank > 0 && (
              <Chip
                label={`#${coin.rank}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(20, 184, 166, 0.1)',
                  color: 'primary.main',
                }}
              />
            )}
            <Divider orientation="vertical" flexItem sx={{ mx: 0.25, borderColor: 'divider' }} />
            {[
              { label: 'MCap', value: formatMarketCap(coin.marketCap) },
              { label: 'Vol', value: formatMarketCap(coin.volume24h) },
              { label: 'High', value: formatPrice(coin.high24h) },
              { label: 'Low', value: formatPrice(coin.low24h) },
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
              { label: '1h', value: coin.priceChangePct1h },
              { label: '24h', value: coin.priceChangePct24h },
              { label: '7d', value: coin.priceChangePct7d },
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
              {formatPrice(coin.price)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mr: 1 }}>
              {isPositive ? (
                <TrendingUpIcon sx={{ fontSize: '0.9rem', color: '#a4cf5e' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: '0.9rem', color: '#f45b5b' }} />
              )}
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', color: isPositive ? '#a4cf5e' : '#f45b5b' }}>
                {isPositive ? '+' : ''}{coin.priceChangePct24h.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main content */}
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
              src={tvUrl}
              title={`${coin.symbol} chart`}
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
            {/* Social links */}
            {linksLoading ? (
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={80} height={26} />)}
              </Box>
            ) : links && (links.homepage || links.twitter || links.telegram || links.reddit || links.github) ? (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {links.homepage && (
                  <Chip label="Website" size="small" component="a" href={links.homepage} target="_blank" rel="noopener noreferrer" clickable
                    icon={<ExternalIcon sx={{ fontSize: '0.75rem !important' }} />}
                    sx={{ height: 26, fontSize: '0.7rem', fontWeight: 600, bgcolor: (t: any) => t.palette.custom.subtleBg, color: 'text.primary', '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.1)', color: 'primary.main' } }}
                  />
                )}
                {links.twitter && (
                  <Chip label="Twitter" size="small" component="a" href={`https://twitter.com/${links.twitter}`} target="_blank" rel="noopener noreferrer" clickable
                    icon={<Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 700, ml: 0.5 }}>𝕏</Box>}
                    sx={{ height: 26, fontSize: '0.7rem', fontWeight: 600, bgcolor: (t: any) => t.palette.custom.subtleBg, color: 'text.primary', '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.1)', color: 'primary.main' } }}
                  />
                )}
                {links.telegram && (
                  <Chip label="Telegram" size="small" component="a" href={`https://t.me/${links.telegram}`} target="_blank" rel="noopener noreferrer" clickable
                    icon={<Box component="span" sx={{ fontSize: '0.75rem', ml: 0.5 }}>✈</Box>}
                    sx={{ height: 26, fontSize: '0.7rem', fontWeight: 600, bgcolor: (t: any) => t.palette.custom.subtleBg, color: 'text.primary', '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.1)', color: 'primary.main' } }}
                  />
                )}
                {links.reddit && (
                  <Chip label="Reddit" size="small" component="a" href={links.reddit} target="_blank" rel="noopener noreferrer" clickable
                    icon={<ExternalIcon sx={{ fontSize: '0.75rem !important' }} />}
                    sx={{ height: 26, fontSize: '0.7rem', fontWeight: 600, bgcolor: (t: any) => t.palette.custom.subtleBg, color: 'text.primary', '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.1)', color: 'primary.main' } }}
                  />
                )}
                {links.github && (
                  <Chip label="GitHub" size="small" component="a" href={links.github} target="_blank" rel="noopener noreferrer" clickable
                    icon={<ExternalIcon sx={{ fontSize: '0.75rem !important' }} />}
                    sx={{ height: 26, fontSize: '0.7rem', fontWeight: 600, bgcolor: (t: any) => t.palette.custom.subtleBg, color: 'text.primary', '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.1)', color: 'primary.main' } }}
                  />
                )}
              </Box>
            ) : null}

            {/* Description */}
            {links?.description && <ExpandableDescription text={links.description.replace(/<[^>]*>/g, '')} />}

            {/* Key metrics */}
            <Box>
              <SectionLabel>Key Metrics</SectionLabel>
              <StatsRow items={[
                { label: 'MCap', value: formatMarketCap(coin.marketCap) },
                { label: 'FDV', value: formatMarketCap(coin.fdv) },
                { label: 'Vol 24h', value: formatMarketCap(coin.volume24h) },
              ]} />
            </Box>

            {/* Price change across timeframes */}
            <Box>
              <SectionLabel>Price Change</SectionLabel>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
                <PctChip label="1H" value={coin.priceChangePct1h} />
                <PctChip label="24H" value={coin.priceChangePct24h} />
                <PctChip label="7D" value={coin.priceChangePct7d} />
              </Box>
            </Box>

            <Divider />

            {/* 24h Range */}
            <Box>
              <SectionLabel>24h Range</SectionLabel>
              <Box sx={{
                p: 1.5,
                borderRadius: '8px',
                bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                border: 1,
                borderColor: 'divider',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#f45b5b', fontWeight: 600 }}>
                    {formatPrice(coin.low24h)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#a4cf5e', fontWeight: 600 }}>
                    {formatPrice(coin.high24h)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={coin.high24h > coin.low24h
                    ? ((coin.price - coin.low24h) / (coin.high24h - coin.low24h)) * 100
                    : 50
                  }
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(244, 91, 91, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#a4cf5e',
                      borderRadius: 3,
                    },
                  }}
                />
                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.5, textAlign: 'center' }}>
                  Current: {formatPrice(coin.price)}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Supply info */}
            <Box>
              <SectionLabel>Supply</SectionLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <InfoRow label="Circulating" value={formatSupply(coin.circulatingSupply, coin.symbol)} />
                {coin.totalSupply && (
                  <InfoRow label="Total" value={formatSupply(coin.totalSupply, coin.symbol)} />
                )}
                {coin.maxSupply && (
                  <InfoRow label="Max" value={formatSupply(coin.maxSupply, coin.symbol)} />
                )}
                {supplyPct !== null && (
                  <Box sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>Circulating / Max</Typography>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.primary' }}>
                        {supplyPct.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(supplyPct, 100)}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                        '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 3 },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            <Divider />

            {/* ATH */}
            <Box>
              <SectionLabel>All-Time High</SectionLabel>
              <Box sx={{
                p: 1.5,
                borderRadius: '8px',
                bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                border: 1,
                borderColor: 'divider',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary' }}>
                    {formatPrice(coin.ath)}
                  </Typography>
                  <Typography sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: coin.athChangePct >= 0 ? '#a4cf5e' : '#f45b5b',
                  }}>
                    {coin.athChangePct.toFixed(1)}%
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                  {new Date(coin.athDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Dialog>
  )
}
