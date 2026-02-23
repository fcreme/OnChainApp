import { Box, Typography } from '@mui/material'
import { SectionHeader, HudCard } from './HudPrimitives'
import { useTheme } from '@mui/material/styles'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useBalanceHistoryStore } from '../../stores/useBalanceHistoryStore'

function formatTimestamp(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: number
}) {
  if (!active || !payload?.length) return null

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '8px',
        p: 1.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}
      >
        {label ? formatTimestamp(label) : ''}
      </Typography>
      {payload.map((entry) => (
        <Typography
          key={entry.name}
          variant="body2"
          sx={{ color: entry.color, fontWeight: 600, fontSize: '0.8rem' }}
        >
          {entry.name}: {entry.value.toFixed(2)}
        </Typography>
      ))}
    </Box>
  )
}

export default function PortfolioChart() {
  const { snapshots } = useBalanceHistoryStore()
  const theme = useTheme()

  if (snapshots.length === 0) {
    return null
  }

  return (
    <HudCard sx={{ mb: 3 }}>
      <Box sx={{ p: 2.5 }}>
        <SectionHeader>Portfolio History</SectionHeader>
        <ResponsiveContainer width="100%" height={250} minWidth={0}>
          <AreaChart data={snapshots}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              stroke={theme.palette.text.secondary}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="DAI"
              stroke="#14B8A6"
              fill="#14B8A6"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, index, payload } = props
                const prev = index > 0 ? snapshots[index - 1] : null
                if (prev && prev.DAI === payload.DAI) return <circle key={index} cx={cx} cy={cy} r={0} />
                return <circle key={index} cx={cx} cy={cy} r={4} fill="#14B8A6" stroke={theme.palette.background.paper} strokeWidth={2} />
              }}
              activeDot={{ r: 6, fill: '#14B8A6', strokeWidth: 2, stroke: theme.palette.background.paper }}
            />
            <Area
              type="monotone"
              dataKey="USDC"
              stroke="#a4cf5e"
              fill="#a4cf5e"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, index, payload } = props
                const prev = index > 0 ? snapshots[index - 1] : null
                if (prev && prev.USDC === payload.USDC) return <circle key={index} cx={cx} cy={cy} r={0} />
                return <circle key={index} cx={cx} cy={cy} r={4} fill="#a4cf5e" stroke={theme.palette.background.paper} strokeWidth={2} />
              }}
              activeDot={{ r: 6, fill: '#a4cf5e', strokeWidth: 2, stroke: theme.palette.background.paper }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </HudCard>
  )
}
