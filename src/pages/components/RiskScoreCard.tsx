import { Box, Typography } from '@mui/material'
import type { TokenRiskResult } from '../../lib/logisticRegression'
import { featureContributions } from '../../lib/logisticRegression'

interface Props {
  result: TokenRiskResult
  onClick: () => void
}

const RISK_COLORS = {
  safe: '#a4cf5e',
  medium: '#ffb347',
  high: '#f45b5b',
}

const RISK_LABELS = {
  safe: 'SAFE',
  medium: 'MEDIUM',
  high: 'HIGH RISK',
}

const RISK_BG = {
  safe: 'rgba(164, 207, 94, 0.04)',
  medium: 'rgba(255, 179, 71, 0.04)',
  high: 'rgba(244, 91, 91, 0.04)',
}

function ScoreRing({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
  const radius = (size - 6) / 2
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
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}50)` }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: size > 50 ? '0.85rem' : '0.75rem',
            fontWeight: 800,
            color,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {score}
        </Typography>
      </Box>
    </Box>
  )
}

export default function RiskScoreCard({ result, onClick }: Props) {
  const color = RISK_COLORS[result.riskLevel]
  const top3 = featureContributions(result).slice(0, 3)
  const fallbackInitials = result.tokenSymbol.slice(0, 2).toUpperCase()

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: RISK_BG[result.riskLevel],
        border: 1,
        borderColor: 'divider',
        borderRadius: '10px',
        p: 0,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          borderColor: `${color}50`,
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 20px ${color}12, 0 0 0 1px ${color}15`,
          '& .card-glow': {
            opacity: 1,
          },
        },
      }}
    >
      {/* Top accent line */}
      <Box
        sx={{
          height: '2px',
          background: `linear-gradient(90deg, ${color}00, ${color}80, ${color}00)`,
        }}
      />

      {/* Hover glow */}
      <Box
        className="card-glow"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: `linear-gradient(180deg, ${color}06, transparent)`,
          opacity: 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ p: 2, position: 'relative' }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
          {/* Token avatar */}
          {result.imageUrl ? (
            <Box
              component="img"
              src={result.imageUrl}
              alt={result.tokenSymbol}
              sx={{
                width: 34,
                height: 34,
                borderRadius: '8px',
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
              width: 34,
              height: 34,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${color}30, ${color}10)`,
              border: '1px solid',
              borderColor: `${color}25`,
              display: result.imageUrl ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ color, fontSize: '0.7rem', fontWeight: 700 }}>
              {fallbackInitials}
            </Typography>
          </Box>

          {/* Name + symbol */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.82rem',
                color: 'text.primary',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              {result.tokenName}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.65rem',
                color: 'text.secondary',
                fontWeight: 500,
                mt: 0.25,
              }}
            >
              ${result.tokenSymbol}
            </Typography>
          </Box>

          {/* Score ring */}
          <ScoreRing score={result.score} color={color} />
        </Box>

        {/* Risk badge */}
        <Box sx={{ mb: 1.5 }}>
          <Box
            component="span"
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
            <Typography
              sx={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color,
                letterSpacing: '0.06em',
              }}
            >
              {RISK_LABELS[result.riskLevel]}
            </Typography>
          </Box>
        </Box>

        {/* Top features */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            pt: 1.25,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {top3.map((f) => (
            <Box
              key={f.feature}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.62rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                {f.label}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 3,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.min(Math.abs(f.contribution) / 3 * 100, 100)}%`,
                      height: '100%',
                      borderRadius: 2,
                      bgcolor: f.contribution > 0 ? '#f45b5b' : '#a4cf5e',
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: f.contribution > 0 ? '#f45b5b' : '#a4cf5e',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 32,
                    textAlign: 'right',
                    fontFamily: 'monospace',
                  }}
                >
                  {f.contribution > 0 ? '+' : ''}{f.contribution.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
