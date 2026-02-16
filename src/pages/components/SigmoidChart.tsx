import { useMemo, useState } from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { generateSigmoidCurveData } from '../../lib/logisticRegression'
import type { TokenRiskResult } from '../../lib/logisticRegression'

interface Props {
  results: TokenRiskResult[]
}

const RISK_COLORS = {
  safe: '#a4cf5e',
  medium: '#ffb347',
  high: '#f45b5b',
}

const curveData = generateSigmoidCurveData()

type ZoneFilter = 'all' | 'safe' | 'medium' | 'high'

interface TooltipPayload {
  name: string
  value: number
  payload: {
    tokenName?: string
    tokenSymbol?: string
    score?: number
    z?: number
    probability?: number
    riskLevel?: string
    topFactor?: string
    topFactorValue?: number
  }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item.payload.tokenName) return null

  const riskColor =
    item.payload.riskLevel === 'safe'
      ? '#a4cf5e'
      : item.payload.riskLevel === 'medium'
        ? '#ffb347'
        : '#f45b5b'
  const riskLabel =
    item.payload.riskLevel === 'safe'
      ? 'Safe'
      : item.payload.riskLevel === 'medium'
        ? 'Medium'
        : 'High Risk'

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '10px',
        p: 1.75,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        minWidth: 180,
        maxWidth: 220,
      }}
    >
      {/* Token name + symbol */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
          {item.payload.tokenName}
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
          ${item.payload.tokenSymbol}
        </Typography>
      </Box>

      {/* Risk badge */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 0.75,
          py: 0.3,
          borderRadius: '4px',
          bgcolor: `${riskColor}15`,
          border: '1px solid',
          borderColor: `${riskColor}30`,
          mb: 1,
        }}
      >
        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: riskColor }} />
        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: riskColor, letterSpacing: '0.04em' }}>
          {riskLabel}
        </Typography>
      </Box>

      {/* Metrics */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.15 }}>
            Risk Score
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: riskColor, lineHeight: 1 }}>
            {item.payload.score}%
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.15 }}>
            z-score
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary', fontFamily: 'monospace', lineHeight: 1 }}>
            {item.payload.z?.toFixed(2)}
          </Typography>
        </Box>
      </Box>

      {/* Top risk factor */}
      {item.payload.topFactor && (
        <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.15 }}>
            Top factor
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.primary' }}>
            {item.payload.topFactor}{' '}
            <Box
              component="span"
              sx={{
                color: (item.payload.topFactorValue ?? 0) > 0 ? '#f45b5b' : '#a4cf5e',
                fontFamily: 'monospace',
              }}
            >
              ({(item.payload.topFactorValue ?? 0) > 0 ? '+' : ''}
              {item.payload.topFactorValue?.toFixed(2)})
            </Box>
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default function SigmoidChart({ results }: Props) {
  const theme = useTheme()
  const [highlightZone, setHighlightZone] = useState<ZoneFilter>('all')

  const scatterData = useMemo(() => {
    return results.map((r) => {
      // Find the top contributing factor by absolute value
      const contributions = Object.entries(r.contributions) as [string, number][]
      contributions.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      const topKey = contributions[0]?.[0] ?? ''
      const topValue = contributions[0]?.[1] ?? 0

      const featureLabelMap: Record<string, string> = {
        liquidityMcapRatio: 'Liquidity/MCap',
        tokenAgeHours: 'Token Age',
        volumeMcapRatio: 'Volume/MCap',
        hasWebsite: 'Website',
        hasSocials: 'Socials',
        priceVolatility: 'Volatility',
        sellPressure: 'Sell Pressure',
      }

      return {
        z: r.zScore,
        probability: r.score,
        tokenName: r.tokenName,
        tokenSymbol: r.tokenSymbol,
        score: r.score,
        riskLevel: r.riskLevel,
        fill: RISK_COLORS[r.riskLevel],
        topFactor: featureLabelMap[topKey] ?? topKey,
        topFactorValue: topValue,
      }
    })
  }, [results])

  const filteredScatter = useMemo(() => {
    if (highlightZone === 'all') return scatterData
    return scatterData.filter((d) => d.riskLevel === highlightZone)
  }, [scatterData, highlightZone])

  const dimmedScatter = useMemo(() => {
    if (highlightZone === 'all') return []
    return scatterData.filter((d) => d.riskLevel !== highlightZone)
  }, [scatterData, highlightZone])

  // Zone counts
  const safeCt = results.filter((r) => r.riskLevel === 'safe').length
  const medCt = results.filter((r) => r.riskLevel === 'medium').length
  const highCt = results.filter((r) => r.riskLevel === 'high').length

  const zones = [
    { key: 'all' as ZoneFilter, label: 'All', count: results.length, color: '#14B8A6' },
    { key: 'safe' as ZoneFilter, label: 'Safe', count: safeCt, color: '#a4cf5e', range: '0-33%' },
    { key: 'medium' as ZoneFilter, label: 'Medium', count: medCt, color: '#ffb347', range: '34-66%' },
    { key: 'high' as ZoneFilter, label: 'High', count: highCt, color: '#f45b5b', range: '67-100%' },
  ]

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Risk Mapping Curve
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mt: 0.25, opacity: 0.7, maxWidth: 420, lineHeight: 1.5 }}>
              Each token's features are combined into a z-score, then the sigmoid function converts it to a 0-100% risk probability. Tokens on the left are safer, tokens on the right are riskier.
            </Typography>
          </Box>
        </Box>

        {/* Zone filter chips */}
        <Box sx={{ display: 'flex', gap: 0.75, mb: 2, mt: 1.5 }}>
          {zones.map((zone) => {
            const isActive = highlightZone === zone.key
            return (
              <Chip
                key={zone.key}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{zone.label}</span>
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        bgcolor: isActive ? `${zone.color}25` : 'rgba(255,255,255,0.04)',
                        color: isActive ? zone.color : 'text.secondary',
                        px: 0.5,
                        py: 0.1,
                        borderRadius: '3px',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1,
                      }}
                    >
                      {zone.count}
                    </Box>
                  </Box>
                }
                size="small"
                onClick={() => setHighlightZone(zone.key)}
                sx={{
                  height: 28,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '6px',
                  bgcolor: isActive ? `${zone.color}12` : 'transparent',
                  color: isActive ? zone.color : 'text.secondary',
                  border: 1,
                  borderColor: isActive ? `${zone.color}35` : 'divider',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: `${zone.color}10`,
                    borderColor: `${zone.color}30`,
                    color: zone.color,
                  },
                }}
              />
            )
          })}
        </Box>
      </Box>

      {/* Chart */}
      <Box sx={{ px: 1 }}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart margin={{ top: 10, right: 25, left: 10, bottom: 30 }}>
            {/* Colored zone backgrounds */}
            <ReferenceArea
              y1={0}
              y2={33}
              fill="#a4cf5e"
              fillOpacity={highlightZone === 'safe' ? 0.06 : 0.02}
            />
            <ReferenceArea
              y1={33}
              y2={66}
              fill="#ffb347"
              fillOpacity={highlightZone === 'medium' ? 0.06 : 0.02}
            />
            <ReferenceArea
              y1={66}
              y2={100}
              fill="#f45b5b"
              fillOpacity={highlightZone === 'high' ? 0.06 : 0.02}
            />

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
              vertical={false}
            />
            <XAxis
              dataKey="z"
              type="number"
              domain={[-6, 6]}
              stroke={theme.palette.text.secondary}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: theme.palette.divider }}
              label={{
                value: 'z-score (weighted sum of features)',
                position: 'insideBottom',
                offset: -18,
                style: {
                  fontSize: 10,
                  fill: theme.palette.text.secondary,
                  fontWeight: 500,
                },
              }}
            />
            <YAxis
              dataKey="probability"
              type="number"
              domain={[0, 100]}
              stroke={theme.palette.text.secondary}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: theme.palette.divider }}
              tickFormatter={(v: number) => `${v}%`}
              label={{
                value: 'Rug-Pull Risk',
                angle: -90,
                position: 'insideLeft',
                offset: 8,
                style: {
                  fontSize: 10,
                  fill: theme.palette.text.secondary,
                  fontWeight: 500,
                },
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />

            {/* Zone threshold lines with labels */}
            <ReferenceLine
              y={33}
              stroke="#a4cf5e"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              label={{
                value: 'Safe / Medium (33%)',
                position: 'insideTopRight',
                style: { fontSize: 9, fill: '#a4cf5e', fontWeight: 600 },
              }}
            />
            <ReferenceLine
              y={66}
              stroke="#f45b5b"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              label={{
                value: 'Medium / High (66%)',
                position: 'insideTopRight',
                style: { fontSize: 9, fill: '#f45b5b', fontWeight: 600 },
              }}
            />

            {/* Sigmoid curve */}
            <Line
              data={curveData}
              type="monotone"
              dataKey="probability"
              stroke="#14B8A6"
              strokeWidth={2.5}
              dot={false}
              activeDot={false}
              style={{ filter: 'drop-shadow(0 0 4px rgba(20,184,166,0.3))' }}
            />

            {/* Dimmed scatter (tokens not in the highlighted zone) */}
            {dimmedScatter.length > 0 && (
              <Scatter
                data={dimmedScatter}
                dataKey="probability"
                fill="#888"
                shape={(props: any) => {
                  const { cx, cy } = props
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="rgba(120,120,140,0.25)"
                      stroke="rgba(120,120,140,0.15)"
                      strokeWidth={1}
                    />
                  )
                }}
              />
            )}

            {/* Active scatter (highlighted or all) */}
            <Scatter
              data={filteredScatter}
              dataKey="probability"
              fill="#14B8A6"
              shape={(props: any) => {
                const { cx, cy, payload } = props
                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={9}
                      fill={payload.fill}
                      fillOpacity={0.12}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4.5}
                      fill={payload.fill}
                      stroke={theme.palette.background.paper}
                      strokeWidth={1.5}
                      style={{ filter: `drop-shadow(0 0 3px ${payload.fill}80)` }}
                    />
                  </g>
                )
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      {/* Bottom explainer strip */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {[
          {
            label: 'Safe Zone',
            range: '0 - 33%',
            desc: 'Lower risk tokens with healthy liquidity ratios, older age, and existing web presence.',
            color: '#a4cf5e',
            count: safeCt,
          },
          {
            label: 'Medium Zone',
            range: '34 - 66%',
            desc: 'Mixed signals — some risk factors present. Review individual features before investing.',
            color: '#ffb347',
            count: medCt,
          },
          {
            label: 'High Risk Zone',
            range: '67 - 100%',
            desc: 'Strong rug-pull indicators: high sell pressure, extreme volatility, low liquidity, no socials.',
            color: '#f45b5b',
            count: highCt,
          },
        ].map((zone) => (
          <Box
            key={zone.label}
            sx={{
              p: 2,
              borderRight: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderRight: 'none' },
              transition: 'background 0.15s ease',
              '&:hover': {
                bgcolor: `${zone.color}04`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '2px',
                  bgcolor: zone.color,
                  boxShadow: `0 0 6px ${zone.color}40`,
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: zone.color }}>
                {zone.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                  ml: 'auto',
                }}
              >
                {zone.range}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '0.6rem',
                color: 'text.secondary',
                lineHeight: 1.5,
                opacity: 0.8,
              }}
            >
              {zone.desc}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: zone.color,
                mt: 0.75,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {zone.count} token{zone.count !== 1 ? 's' : ''}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
