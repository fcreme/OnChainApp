import { useEffect, useState } from 'react'
import { Container, Box, Typography, Slider, Button, Alert } from '@mui/material'
import { Settings as SettingsIcon, Save as SaveIcon, RestartAlt as ResetIcon } from '@mui/icons-material'
import { PageHeader, SectionHeader, StatCard } from './components/HudPrimitives'
import PageTransition from './components/PageTransition'
import { useMatchConfigStore } from '../stores/useMatchConfigStore'
import { useToastStore } from '../stores/useToastStore'

const DEFAULT_WEIGHTS = { amount: 40, address: 30, time: 20, token: 10 }
const DEFAULT_TOLERANCES = { amount_percent: 0.01, time_window_ms: 3600000, block_window: 100 }
const DEFAULT_DRIFT = { alert_percent: 1.0, critical_percent: 5.0 }

export default function Settings() {
  const { config, isLoading, fetchConfig, saveConfig } = useMatchConfigStore()
  const { addToast } = useToastStore()

  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [tolerances, setTolerances] = useState(DEFAULT_TOLERANCES)
  const [driftThresholds, setDriftThresholds] = useState(DEFAULT_DRIFT)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  useEffect(() => {
    if (config) {
      setWeights(config.weights)
      setTolerances(config.tolerances)
      setDriftThresholds(config.drift_thresholds)
    }
  }, [config])

  const weightsSum = weights.amount + weights.address + weights.time + weights.token
  const isValid = weightsSum === 100

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const handleSave = async () => {
    if (!isValid) {
      addToast({ message: 'Weights must sum to 100', severity: 'error' })
      return
    }
    try {
      await saveConfig({ weights, tolerances, drift_thresholds: driftThresholds })
      addToast({ message: 'Configuration saved', severity: 'success' })
      setDirty(false)
    } catch {
      addToast({ message: 'Failed to save configuration', severity: 'error' })
    }
  }

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS)
    setTolerances(DEFAULT_TOLERANCES)
    setDriftThresholds(DEFAULT_DRIFT)
    setDirty(true)
  }

  return (
    <PageTransition>
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        <PageHeader
          icon={<SettingsIcon sx={{ fontSize: '1rem', color: '#14B8A6' }} />}
          title="Settings"
          subtitle="Configure matching engine weights and tolerances"
        />

        {/* Current weights preview */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          <StatCard label="Amount" value={weights.amount} color="#14B8A6" index={0} />
          <StatCard label="Address" value={weights.address} color="#a4cf5e" index={1} />
          <StatCard label="Time" value={weights.time} color="#ffb347" index={2} />
          <StatCard label="Token" value={weights.token} color="#8b5cf6" index={3} />
        </Box>

        {!isValid && (
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
            Weights must sum to 100. Current sum: {weightsSum}
          </Alert>
        )}

        {/* Scoring Weights */}
        <SectionHeader>Scoring Weights</SectionHeader>
        <Box sx={{ mb: 4, px: 1 }}>
          {([
            { key: 'amount' as const, label: 'Amount Match', color: '#14B8A6', description: 'How closely transaction amounts must match' },
            { key: 'address' as const, label: 'Address Match', color: '#a4cf5e', description: 'Sender and receiver address similarity' },
            { key: 'time' as const, label: 'Time Proximity', color: '#ffb347', description: 'How close in time the transactions occurred' },
            { key: 'token' as const, label: 'Token Match', color: '#8b5cf6', description: 'Whether the same token was used' },
          ]).map(({ key, label, color, description }) => (
            <Box key={key} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>{label}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{weights[key]}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 1 }}>{description}</Typography>
              <Slider
                value={weights[key]}
                onChange={(_, v) => handleWeightChange(key, v as number)}
                min={0} max={100} step={5}
                sx={{
                  color,
                  '& .MuiSlider-thumb': { width: 16, height: 16 },
                  '& .MuiSlider-track': { height: 4 },
                  '& .MuiSlider-rail': { height: 4, opacity: 0.2 },
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Tolerances */}
        <SectionHeader>Tolerances</SectionHeader>
        <Box sx={{ mb: 4, px: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>Amount Tolerance</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#14B8A6' }}>{(tolerances.amount_percent * 100).toFixed(1)}%</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 1 }}>Max percentage difference for amount matching</Typography>
            <Slider
              value={tolerances.amount_percent * 100}
              onChange={(_, v) => { setTolerances((p) => ({ ...p, amount_percent: (v as number) / 100 })); setDirty(true) }}
              min={0} max={10} step={0.1}
              sx={{ color: '#14B8A6', '& .MuiSlider-thumb': { width: 16, height: 16 }, '& .MuiSlider-track': { height: 4 }, '& .MuiSlider-rail': { height: 4, opacity: 0.2 } }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>Time Window</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffb347' }}>{(tolerances.time_window_ms / 60000).toFixed(0)} min</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 1 }}>Max time difference between anchor and claim</Typography>
            <Slider
              value={tolerances.time_window_ms / 60000}
              onChange={(_, v) => { setTolerances((p) => ({ ...p, time_window_ms: (v as number) * 60000 })); setDirty(true) }}
              min={1} max={120} step={1}
              sx={{ color: '#ffb347', '& .MuiSlider-thumb': { width: 16, height: 16 }, '& .MuiSlider-track': { height: 4 }, '& .MuiSlider-rail': { height: 4, opacity: 0.2 } }}
            />
          </Box>
        </Box>

        {/* Drift Thresholds */}
        <SectionHeader>Drift Alert Thresholds</SectionHeader>
        <Box sx={{ mb: 4, px: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>Warning Level</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffb347' }}>{driftThresholds.alert_percent.toFixed(1)}%</Typography>
            </Box>
            <Slider
              value={driftThresholds.alert_percent}
              onChange={(_, v) => { setDriftThresholds((p) => ({ ...p, alert_percent: v as number })); setDirty(true) }}
              min={0.1} max={10} step={0.1}
              sx={{ color: '#ffb347', '& .MuiSlider-thumb': { width: 16, height: 16 }, '& .MuiSlider-track': { height: 4 }, '& .MuiSlider-rail': { height: 4, opacity: 0.2 } }}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>Critical Level</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#f45b5b' }}>{driftThresholds.critical_percent.toFixed(1)}%</Typography>
            </Box>
            <Slider
              value={driftThresholds.critical_percent}
              onChange={(_, v) => { setDriftThresholds((p) => ({ ...p, critical_percent: v as number })); setDirty(true) }}
              min={1} max={20} step={0.5}
              sx={{ color: '#f45b5b', '& .MuiSlider-thumb': { width: 16, height: 16 }, '& .MuiSlider-track': { height: 4 }, '& .MuiSlider-rail': { height: 4, opacity: 0.2 } }}
            />
          </Box>
        </Box>

        {/* Save / Reset */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<ResetIcon sx={{ fontSize: '0.9rem !important' }} />}
            onClick={handleReset}
            sx={{ fontSize: '0.8rem' }}
          >
            Reset Defaults
          </Button>
          <Button
            variant="contained"
            disabled={!dirty || !isValid || isLoading}
            startIcon={<SaveIcon sx={{ fontSize: '0.9rem !important' }} />}
            onClick={handleSave}
            sx={{ fontSize: '0.8rem', bgcolor: '#14B8A6', '&:hover': { bgcolor: '#0f9a87' } }}
          >
            Save Configuration
          </Button>
        </Box>
      </Container>
    </PageTransition>
  )
}
