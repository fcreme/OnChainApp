import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { TokenRiskResult } from '../../lib/logisticRegression'

interface Props {
  results: TokenRiskResult[]
}

const COLORS = {
  safe: '#a4cf5e',
  medium: '#ffb347',
  high: '#f45b5b',
}

interface TooltipPayload {
  name: string
  value: number
  payload: { name: string; value: number; fill: string; pct: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '8px',
        p: 1.5,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: item.payload.fill }}>
        {item.name}
      </Typography>
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.25 }}>
        {item.value} tokens ({item.payload.pct})
      </Typography>
    </Box>
  )
}

export default function RiskDistributionChart({ results }: Props) {
  const theme = useTheme()
  const safe = results.filter((r) => r.riskLevel === 'safe').length
  const medium = results.filter((r) => r.riskLevel === 'medium').length
  const high = results.filter((r) => r.riskLevel === 'high').length
  const total = results.length

  const data = [
    { name: 'Safe', value: safe, fill: COLORS.safe, pct: `${((safe / total) * 100).toFixed(0)}%` },
    { name: 'Medium', value: medium, fill: COLORS.medium, pct: `${((medium / total) * 100).toFixed(0)}%` },
    { name: 'High Risk', value: high, fill: COLORS.high, pct: `${((high / total) * 100).toFixed(0)}%` },
  ].filter((d) => d.value > 0)

  if (data.length === 0) return null

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '10px',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          mb: 2,
        }}
      >
        Risk Distribution
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minHeight: 0 }}>
        {/* Chart with centered label */}
        <Box sx={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={82}
                paddingAngle={3}
                dataKey="value"
                stroke={theme.palette.background.paper}
                strokeWidth={2}
                cornerRadius={3}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label — uses absolute centering relative to the chart container */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'text.primary',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {total}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.55rem',
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
                mt: 0.25,
              }}
            >
              tokens
            </Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
          {[
            { label: 'Safe', value: safe, color: COLORS.safe },
            { label: 'Medium', value: medium, color: COLORS.medium },
            { label: 'High Risk', value: high, color: COLORS.high },
          ].map((item) => (
            <Box key={item.label}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '2px',
                      bgcolor: item.color,
                      boxShadow: `0 0 6px ${item.color}40`,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: item.color,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
              {/* Progress bar */}
              <Box
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
                    borderRadius: 2,
                    bgcolor: item.color,
                    opacity: 0.6,
                    transition: 'width 0.5s ease',
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
