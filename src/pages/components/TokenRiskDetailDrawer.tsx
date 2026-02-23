import { Box, Typography, Drawer, IconButton, LinearProgress } from '@mui/material'
import {
  Close as CloseIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material'
import type { TokenRiskResult } from '../../lib/logisticRegression'
import { featureContributions, BIAS } from '../../lib/logisticRegression'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useTheme } from '@mui/material/styles'

interface Props {
  open: boolean
  onClose: () => void
  result: TokenRiskResult | null
}

const RISK_COLORS = {
  safe: '#a4cf5e',
  medium: '#ffb347',
  high: '#f45b5b',
}

const RISK_LABELS = {
  safe: 'Safe',
  medium: 'Medium',
  high: 'High Risk',
}

interface WaterfallTooltipPayload {
  name: string
  value: number
  payload: { label: string; contribution: number }
}

function WaterfallTooltip({ active, payload }: { active?: boolean; payload?: WaterfallTooltipPayload[] }) {
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
      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
        {item.payload.label}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: item.payload.contribution > 0 ? '#f45b5b' : '#a4cf5e',
        }}
      >
        {item.payload.contribution > 0 ? '+' : ''}{item.payload.contribution.toFixed(3)}
      </Typography>
    </Box>
  )
}

function ScoreRing({ score, color, size = 72 }: { score: number; color: string; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}
        </Typography>
        <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', fontWeight: 600, mt: 0.25 }}>
          RISK %
        </Typography>
      </Box>
    </Box>
  )
}

function SectionHeader({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        fontSize: '0.65rem',
        fontWeight: 700,
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        mb: 1.25,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '&::after': {
          content: '""',
          flex: 1,
          height: '1px',
          bgcolor: 'divider',
        },
      }}
    >
      {children}
    </Typography>
  )
}

export default function TokenRiskDetailDrawer({ open, onClose, result }: Props) {
  const theme = useTheme()

  if (!result) return null

  const color = RISK_COLORS[result.riskLevel]
  const contributions = featureContributions(result)
  const fallbackInitials = result.tokenSymbol.slice(0, 2).toUpperCase()

  const waterfallData = contributions.map((c) => ({
    label: c.label,
    contribution: c.contribution,
    absContribution: Math.abs(c.contribution),
  }))

  // Build formula string
  const formulaParts = contributions.map(
    (c) => `  ${c.weight > 0 ? '+' : ''}${c.weight.toFixed(1)} * ${c.value.toFixed(3)} (${c.label})`
  )
  const formula = `z = ${BIAS.toFixed(1)} (bias)\n${formulaParts.join('\n')}\n  = ${result.zScore.toFixed(4)}\n\nsigmoid(${result.zScore.toFixed(4)}) = ${(result.score / 100).toFixed(4)} → ${result.score}%`

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 440 },
          bgcolor: 'background.paper',
          borderLeft: 1,
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header with colored accent */}
        <Box
          sx={{
            position: 'relative',
            p: 2.5,
            pb: 2,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)`,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '80px',
              background: `linear-gradient(180deg, ${color}06, transparent)`,
              pointerEvents: 'none',
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {result.imageUrl ? (
                <Box
                  component="img"
                  src={result.imageUrl}
                  alt={result.tokenSymbol}
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '10px',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = 'none'
                    const next = e.currentTarget.nextElementSibling as HTMLElement
                    if (next) next.style.display = 'flex'
                  }}
                />
              ) : null}
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                  border: '1px solid',
                  borderColor: `${color}25`,
                  display: result.imageUrl ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ color, fontSize: '0.85rem', fontWeight: 700 }}>
                  {fallbackInitials}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'text.primary', lineHeight: 1.2 }}>
                  {result.tokenName}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.25 }}>
                  ${result.tokenSymbol}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: 'text.secondary',
                bgcolor: (theme) => theme.palette.custom.subtleBg,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                width: 32,
                height: 32,
                '&:hover': {
                  bgcolor: (theme) => theme.palette.custom.hoverBg,
                },
              }}
            >
              <CloseIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Box>
        </Box>

        {/* Score section */}
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              p: 2,
              borderRadius: '10px',
              bgcolor: (theme) => theme.palette.custom.subtleBg,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <ScoreRing score={result.score} color={color} />
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.35,
                  borderRadius: '4px',
                  bgcolor: `${color}12`,
                  border: '1px solid',
                  borderColor: `${color}25`,
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    bgcolor: color,
                    boxShadow: `0 0 6px ${color}80`,
                  }}
                />
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color, letterSpacing: '0.06em' }}>
                  {RISK_LABELS[result.riskLevel].toUpperCase()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    z-score
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', fontFamily: 'monospace' }}>
                    {result.zScore.toFixed(4)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Probability
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', fontFamily: 'monospace' }}>
                    {(result.score / 100).toFixed(4)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Content sections */}
        <Box sx={{ px: 2.5, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
          {/* Feature Breakdown */}
          <Box>
            <SectionHeader>Feature Breakdown</SectionHeader>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {contributions.map((c) => (
                <Box key={c.feature}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }}>
                        {c.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.58rem',
                          color: 'text.secondary',
                          opacity: 0.6,
                          fontFamily: 'monospace',
                        }}
                      >
                        {c.value.toFixed(3)} / w:{c.weight > 0 ? '+' : ''}{c.weight.toFixed(1)}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: c.contribution > 0 ? '#f45b5b' : '#a4cf5e',
                        fontFamily: 'monospace',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {c.contribution > 0 ? '+' : ''}{c.contribution.toFixed(3)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(c.contribution) / 3 * 100, 100)}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: c.contribution > 0 ? '#f45b5b' : '#a4cf5e',
                        borderRadius: 2,
                        opacity: 0.7,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Waterfall Chart */}
          <Box>
            <SectionHeader>Contribution Waterfall</SectionHeader>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '8px',
                bgcolor: (theme) => theme.palette.custom.subtleBg,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ResponsiveContainer width="100%" height={180} minWidth={0}>
                <BarChart data={waterfallData} margin={{ left: 5, right: 5, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={theme.palette.text.secondary}
                    tick={{ fontSize: 8 }}
                    angle={-35}
                    textAnchor="end"
                    height={45}
                    tickLine={false}
                    axisLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis
                    stroke={theme.palette.text.secondary}
                    tick={{ fontSize: 9 }}
                    tickLine={false}
                    axisLine={{ stroke: theme.palette.divider }}
                  />
                  <Tooltip content={<WaterfallTooltip />} />
                  <Bar dataKey="contribution" radius={[3, 3, 0, 0]}>
                    {waterfallData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.contribution > 0 ? '#f45b5b' : '#a4cf5e'}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* Raw Calculation */}
          <Box>
            <SectionHeader>Raw Calculation</SectionHeader>
            <Box
              sx={{
                p: 2,
                borderRadius: '8px',
                bgcolor: '#0d0d11',
                border: '1px solid',
                borderColor: 'divider',
                fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                fontSize: '0.62rem',
                color: '#a0a0b0',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '"// logistic regression"',
                  position: 'absolute',
                  top: 8,
                  right: 12,
                  fontSize: '0.55rem',
                  color: 'rgba(20,184,166,0.3)',
                },
              }}
            >
              {formula}
            </Box>
          </Box>

          {/* DexScreener link */}
          <Box
            component="a"
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              p: 1.25,
              borderRadius: '8px',
              bgcolor: 'rgba(20, 184, 166, 0.06)',
              border: '1px solid',
              borderColor: 'rgba(20, 184, 166, 0.15)',
              color: 'primary.main',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'rgba(20, 184, 166, 0.12)',
                borderColor: 'rgba(20, 184, 166, 0.3)',
              },
            }}
          >
            View on DexScreener
            <ExternalIcon sx={{ fontSize: '0.85rem' }} />
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}
