import { Box, Typography } from '@mui/material'
import type { ScoreBreakdown } from '../../../api/reconciliation'

const FACTOR_COLORS: Record<string, string> = {
  amount: '#14B8A6',
  address: '#a4cf5e',
  time: '#ffb347',
  token: '#8b5cf6',
}

const FACTOR_LABELS: Record<string, string> = {
  amount: 'Amount',
  address: 'Address',
  time: 'Time',
  token: 'Token',
}

const MAX_WEIGHTS: Record<string, number> = {
  amount: 40,
  address: 30,
  time: 20,
  token: 10,
}

export default function ScoreBreakdownChart({ breakdown, total }: { breakdown: ScoreBreakdown; total: number }) {
  const factors = Object.entries(breakdown) as [keyof ScoreBreakdown, number][]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Total score */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(total), fontVariantNumeric: 'tabular-nums' }}>
          {total}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>/100 confidence</Typography>
      </Box>

      {/* Stacked bar */}
      <Box sx={{ display: 'flex', height: 8, borderRadius: '4px', overflow: 'hidden', bgcolor: 'divider' }}>
        {factors.map(([key, value]) => (
          <Box
            key={key}
            sx={{
              width: `${value}%`,
              bgcolor: FACTOR_COLORS[key],
              transition: 'width 0.3s ease',
            }}
          />
        ))}
      </Box>

      {/* Breakdown rows */}
      {factors.map(([key, value]) => {
        const max = MAX_WEIGHTS[key] ?? 10
        const pct = max > 0 ? (value / max) * 100 : 0
        return (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: FACTOR_COLORS[key], flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', width: 55 }}>
              {FACTOR_LABELS[key]}
            </Typography>
            <Box sx={{ flex: 1, height: 4, borderRadius: '2px', bgcolor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: FACTOR_COLORS[key], borderRadius: '2px', transition: 'width 0.3s ease' }} />
            </Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: FACTOR_COLORS[key], fontVariantNumeric: 'tabular-nums', width: 40, textAlign: 'right' }}>
              +{value.toFixed(1)}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return '#a4cf5e'
  if (score >= 60) return '#ffb347'
  return '#f45b5b'
}
