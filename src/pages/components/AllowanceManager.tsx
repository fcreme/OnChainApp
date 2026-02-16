import { useEffect, useState, useCallback } from 'react'
import {
  Typography,
  Box,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Skeleton,
  Collapse,
} from '@mui/material'
import {
  Security as SecurityIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'
import { SectionHeader, HudCard } from './HudPrimitives'
import { useAppStore } from '../store/useAppStore'
import { useCustomTokensStore } from '../../stores/useCustomTokensStore'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { ERC20_ABI, DAI, USDC } from '../../lib/erc20'
import { config } from '../../lib/web3'
import { getPublicClient } from 'wagmi/actions'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import type { Address } from 'viem'

const MAX_UINT256 = 2n ** 256n - 1n
const UNLIMITED_THRESHOLD = MAX_UINT256 / 2n
const MAX_PAIRS = 20

interface AllowanceEntry {
  token: string
  tokenAddress: `0x${string}`
  spender: string
  allowance: string
  decimals: number
}

function getTokenAddress(symbol: string): `0x${string}` | undefined {
  if (symbol === 'DAI') return DAI
  if (symbol === 'USDC') return USDC
  const custom = useCustomTokensStore.getState().tokens.find((t) => t.symbol === symbol)
  if (custom) return custom.address as `0x${string}`
  return undefined
}

function getTokenDecimals(symbol: string): number {
  if (symbol === 'DAI') return 18
  if (symbol === 'USDC') return 6
  const custom = useCustomTokensStore.getState().tokens.find((t) => t.symbol === symbol)
  return custom?.decimals ?? 18
}

function CopyableSpender({ address }: { address: string }) {
  const { copy, copiedText } = useCopyToClipboard()
  const isCopied = copiedText === address
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'text.primary' }}>
        {short}
      </Typography>
      <Tooltip title={isCopied ? 'Copied!' : 'Copy address'}>
        <IconButton
          size="small"
          onClick={() => copy(address)}
          sx={{ p: 0.25, color: isCopied ? '#a4cf5e' : 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          {isCopied ? <CheckIcon sx={{ fontSize: '0.75rem' }} /> : <CopyIcon sx={{ fontSize: '0.75rem' }} />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

export default function AllowanceManager() {
  const { address: userAddress } = useAccount()
  const events = useAppStore((s) => s.events)
  const transactionStatus = useAppStore((s) => s.transactionStatus)
  const [entries, setEntries] = useState<AllowanceEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [revokingKey, setRevokingKey] = useState<string | null>(null)

  const fetchAllowances = useCallback(async () => {
    if (!userAddress) return

    // Derive unique (token, spender) pairs from Approval events
    const approvalEvents = events.filter((e) => e.type === 'Approval' && e.to)
    const pairMap = new Map<string, { token: string; spender: string }>()
    for (const ev of approvalEvents) {
      const key = `${ev.token}:${ev.to!.toLowerCase()}`
      if (!pairMap.has(key)) {
        pairMap.set(key, { token: ev.token, spender: ev.to! })
      }
    }

    const pairs = Array.from(pairMap.values()).slice(0, MAX_PAIRS)
    if (pairs.length === 0) {
      setEntries([])
      return
    }

    setLoading(true)
    try {
      const pc = getPublicClient(config)
      const results: AllowanceEntry[] = []

      for (const { token, spender } of pairs) {
        const tokenAddr = getTokenAddress(token)
        if (!tokenAddr) continue
        const decimals = getTokenDecimals(token)

        try {
          const raw = await pc.readContract({
            address: tokenAddr,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [userAddress, spender as `0x${string}`],
          }) as bigint

          if (raw === 0n) continue

          const display = raw >= UNLIMITED_THRESHOLD ? 'Unlimited' : formatUnits(raw, decimals)
          results.push({ token, tokenAddress: tokenAddr, spender, allowance: display, decimals })
        } catch {
          // Skip failed reads
        }
      }

      setEntries(results)
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [userAddress, events])

  useEffect(() => {
    fetchAllowances()
  }, [fetchAllowances])

  // Re-fetch when a transaction completes (success state)
  useEffect(() => {
    if (transactionStatus === 'success') {
      const timer = setTimeout(fetchAllowances, 2000)
      return () => clearTimeout(timer)
    }
  }, [transactionStatus, fetchAllowances])

  const handleRevoke = async (token: string, spender: string) => {
    const key = `${token}:${spender}`
    setRevokingKey(key)
    try {
      await useAppStore.getState().approve(token, spender as Address, '0')
      // Re-fetch after revoke
      setTimeout(fetchAllowances, 2000)
    } catch {
      // Error already dispatched as toast from approve()
    } finally {
      setRevokingKey(null)
    }
  }

  // Don't render if no wallet connected
  if (!userAddress) return null

  // Don't render if no approval events exist and not loading
  const hasApprovals = events.some((e) => e.type === 'Approval')
  if (!hasApprovals && !loading) return null

  return (
    <HudCard>
      <Box sx={{ p: 3 }}>
        <SectionHeader>Allowance Manager</SectionHeader>
        <Box
          onClick={() => setExpanded(!expanded)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon sx={{ color: 'warning.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Allowances
            </Typography>
            {entries.length > 0 && (
              <Chip label={entries.length} size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', borderRadius: '6px' }} />
            )}
          </Box>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} variant="rounded" height={48} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
                ))}
              </Box>
            ) : entries.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                No active allowances found
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {entries.map((entry) => {
                  const key = `${entry.token}:${entry.spender}`
                  const isRevoking = revokingKey === key

                  return (
                    <Box
                      key={key}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        borderRadius: '8px',
                        bgcolor: (theme) => theme.palette.custom.subtleBg,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Chip label={entry.token} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px', height: 30, fontSize: '0.72rem' }} />
                      <CopyableSpender address={entry.spender} />
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          textAlign: 'right',
                          fontWeight: 600,
                          color: entry.allowance === 'Unlimited' ? 'warning.main' : 'text.primary',
                          minWidth: 80,
                        }}
                      >
                        {entry.allowance} {entry.allowance !== 'Unlimited' ? entry.token : ''}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={isRevoking}
                        onClick={() => handleRevoke(entry.token, entry.spender)}
                        sx={{ minWidth: 70, textTransform: 'none', fontWeight: 500 }}
                      >
                        {isRevoking ? 'Revoking...' : 'Revoke'}
                      </Button>
                    </Box>
                  )
                })}
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </HudCard>
  )
}
