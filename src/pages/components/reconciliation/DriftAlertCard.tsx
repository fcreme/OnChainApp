import { Box, Typography } from '@mui/material'
import { HudCard } from '../HudPrimitives'
import type { DriftResponse } from '../../../api/drift'

export default function DriftAlertCard({ drift }: { drift: DriftResponse }) {
  const color = drift.alert_level === 'critical' ? '#f45b5b' : drift.alert_level === 'warning' ? '#ffb347' : '#a4cf5e'

  return (
    <HudCard accentColor={color}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '8px',
          bgcolor: `${color}15`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color }}>
            {drift.alert_level === 'critical' ? '!!' : drift.alert_level === 'warning' ? '!' : '~'}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>
              {drift.token_symbol}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'text.secondary' }}>
              {drift.wallet_address.slice(0, 8)}...{drift.wallet_address.slice(-4)}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.25 }}>
            Internal: {Number(drift.internal_balance).toFixed(2)} | On-chain: {Number(drift.onchain_balance).toFixed(2)}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
            {Number(drift.drift) >= 0 ? '+' : ''}{Number(drift.drift).toFixed(4)}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
            {drift.drift_percentage >= 0 ? '+' : ''}{drift.drift_percentage.toFixed(2)}%
          </Typography>
        </Box>
      </Box>
    </HudCard>
  )
}
