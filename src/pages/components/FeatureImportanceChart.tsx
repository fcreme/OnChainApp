import { Box, Typography } from '@mui/material'
import { WEIGHTS, FEATURE_LABELS } from '../../lib/logisticRegression'
import type { FeatureVector } from '../../lib/logisticRegression'

export default function FeatureImportanceChart() {
  const data = (Object.keys(WEIGHTS) as (keyof FeatureVector)[])
    .map((key) => ({
      feature: key,
      label: FEATURE_LABELS[key],
      weight: WEIGHTS[key],
      absWeight: Math.abs(WEIGHTS[key]),
    }))
    .sort((a, b) => b.absWeight - a.absWeight)

  const maxAbs = Math.max(...data.map((d) => d.absWeight))

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
        Feature Weights
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1, justifyContent: 'center' }}>
        {data.map((entry) => {
          const isRisk = entry.weight > 0
          const barColor = isRisk ? '#f45b5b' : '#a4cf5e'
          const barWidth = (entry.absWeight / maxAbs) * 100

          return (
            <Box key={entry.feature}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  {entry.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: barColor,
                    fontFamily: 'monospace',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {isRisk ? '+' : ''}{entry.weight.toFixed(1)}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    [isRisk ? 'left' : 'right']: 0,
                    top: 0,
                    height: '100%',
                    width: `${barWidth}%`,
                    borderRadius: 3,
                    bgcolor: barColor,
                    opacity: 0.7,
                    transition: 'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    boxShadow: `0 0 8px ${barColor}25`,
                  }}
                />
              </Box>
            </Box>
          )
        })}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        {[
          { label: 'Increases Risk', color: '#f45b5b' },
          { label: 'Decreases Risk', color: '#a4cf5e' },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 3, borderRadius: 2, bgcolor: item.color, opacity: 0.7 }} />
            <Typography sx={{ fontSize: '0.58rem', color: 'text.secondary', fontWeight: 500 }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
