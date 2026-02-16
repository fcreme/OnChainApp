import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  CircularProgress,
  Divider,
  Stack,
  Typography
} from '@mui/material'
import { SectionHeader, HudCard } from './HudPrimitives'
import { formatUnits } from 'viem'
import { getPublicClient } from 'wagmi/actions'
import { sepolia } from 'wagmi/chains'
import { config } from '../../lib/web3'
import { useAppStore } from '../store/useAppStore'

type NetworkHealth = {
  blockNumber: number
  gasPriceGwei: number | null
  latencyMs: number
  updatedAt: number
}

const formatLatency = (value: number) => `${value} ms`

const formatUpdatedLabel = (timestamp: number | null) =>
  timestamp
    ? `Updated ${new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : 'Waiting for data'

const getNow = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now())

export default function NetworkHealthPanel() {
  const { isConnected, chainId } = useAppStore()
  const [health, setHealth] = useState<NetworkHealth | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shouldFetch = isConnected && chainId === sepolia.id

  useEffect(() => {
    if (!shouldFetch) {
      setHealth(null)
      setError(null)
      return
    }

    let isMounted = true

    const fetchHealth = async () => {
      setIsLoading(true)
      const start = getNow()
      try {
        const client = getPublicClient(config)
        const blockNumber = await client.getBlockNumber()
        const gasPriceValue = await client.getGasPrice()
        const end = getNow()
        const latency = Math.max(Math.round(end - start), 0)
        const gasPriceGwei = gasPriceValue ? Number(formatUnits(gasPriceValue, 9)) : null

        if (!isMounted) return
        setHealth({
          blockNumber: Number(blockNumber),
          gasPriceGwei,
          latencyMs: latency,
          updatedAt: Date.now()
        })
        setError(null)
      } catch (fetchError) {
        if (!isMounted) return
        const message = fetchError instanceof Error ? fetchError.message : 'Unable to fetch network health'
        setError(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, 45_000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [shouldFetch])

  const updatedLabel = shouldFetch ? formatUpdatedLabel(health?.updatedAt ?? null) : 'Connect to Sepolia to see stats'

  const dataRows = useMemo(
    () => [
      {
        label: 'Latest Block',
        value: health?.blockNumber ? health.blockNumber.toLocaleString('en-US') : '—'
      },
      {
        label: 'Gas Price',
        value: health?.gasPriceGwei ? `${health.gasPriceGwei.toFixed(2)} gwei` : '—'
      },
      {
        label: 'RPC Latency',
        value: health?.latencyMs ? formatLatency(health.latencyMs) : '—'
      }
    ],
    [health]
  )

  if (!shouldFetch) {
    return null
  }

  return (
    <HudCard>
      <Box sx={{ p: 2 }}>
        <SectionHeader>Network Health</SectionHeader>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {isLoading && <CircularProgress size={18} thickness={5} />}
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {updatedLabel}
            </Typography>
          </Stack>
        </Stack>

        {error && (
          <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Divider sx={{ borderColor: 'divider', mb: 2 }} />

        <Stack spacing={1}>
          {dataRows.map((row) => (
            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {row.label}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
                {row.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </HudCard>
  )
}
