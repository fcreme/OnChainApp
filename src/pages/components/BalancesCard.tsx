import { useAppStore } from '../store/useAppStore'
import { useEffect, useState, useRef } from 'react'
import { sepolia } from 'wagmi/chains'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material'
import { SectionHeader, HudCard } from './HudPrimitives'
import {
  Refresh as RefreshIcon,
  AccountBalance as BalanceIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material'
import { useCustomTokensStore } from '../../stores/useCustomTokensStore'
import AddTokenDialog from './AddTokenDialog'

function formatBalance(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return '0.00'
  if (num === 0) return '0.00'
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })
}

export default function BalancesCard(){
  const {
    balances,
    fetchBalances,
    isConnected,
    chainId,
    isLoadingBalances
  } = useAppStore()
  const customTokens = useCustomTokensStore((s) => s.tokens)
  const removeToken = useCustomTokensStore((s) => s.removeToken)
  const [addTokenOpen, setAddTokenOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const isWrongNetwork = isConnected && chainId !== sepolia.id

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' })
  }

  useEffect(() => {
    if (isConnected && chainId === sepolia.id) {
      fetchBalances()
    }
  }, [isConnected, chainId, fetchBalances])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => ro.disconnect()
  }, [customTokens.length, isLoadingBalances])

  if (!isConnected) {
    return (
      <Box sx={{
        textAlign: 'center',
        py: 4,
        bgcolor: 'background.paper',
        borderRadius: '8px',
        border: 1,
        borderColor: 'divider',
      }}>
        <BalanceIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
        <Typography color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
          Connect your wallet to see balances
        </Typography>
      </Box>
    )
  }

  if (isWrongNetwork) {
    return (
      <Box sx={{
        textAlign: 'center',
        py: 4,
        background: 'rgba(244, 91, 91, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(244, 91, 91, 0.1)'
      }}>
        <BalanceIcon sx={{ fontSize: 40, color: 'error.main', mb: 1, opacity: 0.7 }} />
        <Typography color="error" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
          Please switch to Sepolia network
        </Typography>
      </Box>
    )
  }

  const tokenCardSx = {
    bgcolor: 'background.paper',
    border: 1,
    borderColor: 'divider',
    boxShadow: 'none',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    flex: '0 0 auto',
    width: { xs: 170, sm: 200 },
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, rgba(20,184,166,0), rgba(20,184,166,0.6), rgba(20,184,166,0))',
    },
  }

  if (isLoadingBalances) {
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <SectionHeader>Token Balances</SectionHeader>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[0, 1].map(i => (
            <Card key={i} sx={{ ...tokenCardSx }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Skeleton variant="rounded" width={48} height={24} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
                </Box>
                <Skeleton variant="text" width="60%" height={40} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg, mb: 0.25 }} />
                <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </>
    )
  }

  return (
    <>
      {/* Section header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BalanceIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Balances
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {(canScrollLeft || canScrollRight) && (
            <>
              <IconButton
                size="small"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
              >
                <ChevronLeftIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
              >
                <ChevronRightIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </>
          )}
          <Tooltip title="Refresh balances">
            <Button
              data-testid="refresh-balances"
              onClick={fetchBalances}
              disabled={isLoadingBalances}
              size="small"
              sx={{
                minWidth: 'auto',
                p: 0.5,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <RefreshIcon sx={{
                fontSize: '1rem',
                animation: isLoadingBalances ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Box
          ref={scrollRef}
          onScroll={checkScroll}
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            pb: 0.5,
          }}
        >
          {/* DAI Card */}
          <Card sx={{
            ...tokenCardSx,
            scrollSnapAlign: 'start',
            '&:hover': { borderColor: 'rgba(20, 184, 166, 0.3)', boxShadow: '0 0 20px rgba(20, 184, 166, 0.08)' },
          }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Chip
                  label="DAI"
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(20, 184, 166, 0.5)',
                    color: 'primary.main',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: '24px'
                  }}
                />
              </Box>
              <Typography
                variant="h4"
                data-testid="dai-balance"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  fontFamily: 'monospace',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  mb: 0.25
                }}
              >
                {formatBalance(balances.DAI)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                DAI Balance
              </Typography>
            </CardContent>
          </Card>

          {/* USDC Card */}
          <Card sx={{
            ...tokenCardSx,
            scrollSnapAlign: 'start',
            '&:hover': { borderColor: 'rgba(164, 207, 94, 0.3)', boxShadow: '0 0 20px rgba(164, 207, 94, 0.08)' },
          }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Chip
                  label="USDC"
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(164, 207, 94, 0.5)',
                    color: '#a4cf5e',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: '24px'
                  }}
                />
              </Box>
              <Typography
                variant="h4"
                data-testid="usdc-balance"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  fontFamily: 'monospace',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  mb: 0.25
                }}
              >
                {formatBalance(balances.USDC)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                USDC Balance
              </Typography>
            </CardContent>
          </Card>

          {/* Custom Token Cards */}
          {customTokens.map((ct) => (
            <Card key={ct.address} sx={{
              ...tokenCardSx,
              scrollSnapAlign: 'start',
              '&:hover': { borderColor: 'rgba(255, 179, 71, 0.3)', boxShadow: '0 0 20px rgba(255, 179, 71, 0.08)' },
            }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Chip
                    label={ct.symbol}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(255, 179, 71, 0.5)',
                      color: '#ffb347',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: '24px'
                    }}
                  />
                  <Tooltip title="Remove token">
                    <IconButton
                      size="small"
                      onClick={() => removeToken(ct.address)}
                      sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: '#f45b5b' } }}
                    >
                      <DeleteIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: 'text.primary',
                    fontFamily: 'monospace',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    mb: 0.25
                  }}
                >
                  {formatBalance(balances[ct.symbol] ?? '0')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  {ct.name}
                </Typography>
              </CardContent>
            </Card>
          ))}

          {/* Add Token Card */}
          <Card
            onClick={() => setAddTokenOpen(true)}
            sx={{
              ...tokenCardSx,
              scrollSnapAlign: 'start',
              bgcolor: 'transparent',
              border: '1px dashed',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 120,
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <AddIcon sx={{ fontSize: 28, color: 'text.secondary', mb: 0.5 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                Add token
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <AddTokenDialog open={addTokenOpen} onClose={() => setAddTokenOpen(false)} />
    </>
  )
}
