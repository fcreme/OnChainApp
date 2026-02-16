import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Chip,
  LinearProgress,
  Collapse,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SendAndArchive as BatchIcon,
} from '@mui/icons-material'
import { SectionHeader, HudCard } from './HudPrimitives'
import { useAppStore } from '../store/useAppStore'
import { useCustomTokensStore } from '../../stores/useCustomTokensStore'
import { useContactsStore } from '../../stores/useContactsStore'
import { useRecentAddressesStore } from '../../stores/useRecentAddressesStore'
import type { Address } from 'viem'

interface BatchRow {
  id: number
  address: string
  amount: string
  status: 'pending' | 'sending' | 'success' | 'error'
  error?: string
}

let nextId = 1

export default function BatchTransfer() {
  const { transfer, isConnected, transactionStatus } = useAppStore()
  const customTokens = useCustomTokensStore((s) => s.tokens)
  const contacts = useContactsStore((s) => s.contacts)
  const addRecentAddress = useRecentAddressesStore((s) => s.addAddress)

  const [expanded, setExpanded] = useState(false)
  const [token, setToken] = useState('DAI')
  const [rows, setRows] = useState<BatchRow[]>([
    { id: nextId++, address: '', amount: '', status: 'pending' },
  ])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const addRow = () => {
    setRows((prev) => [...prev, { id: nextId++, address: '', amount: '', status: 'pending' }])
  }

  const removeRow = (id: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)))
  }

  const updateRow = (id: number, field: 'address' | 'amount', value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const isValidRow = (r: BatchRow) =>
    /^0x[a-fA-F0-9]{40}$/.test(r.address) && Number(r.amount) > 0

  const validCount = rows.filter(isValidRow).length
  const canStart = validCount > 0 && !running && isConnected && transactionStatus !== 'pending' && transactionStatus !== 'confirming'

  const handleStart = async () => {
    setRunning(true)
    setProgress(0)

    const validRows = rows.filter(isValidRow)
    let completed = 0

    // Reset all statuses
    setRows((prev) =>
      prev.map((r) =>
        isValidRow(r) ? { ...r, status: 'pending', error: undefined } : r
      )
    )

    for (const row of validRows) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: 'sending' } : r))
      )

      try {
        await transfer(token, row.address as Address, row.amount)
        addRecentAddress(row.address)
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, status: 'success' } : r))
        )
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Transaction failed'
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, status: 'error', error: msg } : r))
        )
      }

      completed++
      setProgress(Math.round((completed / validRows.length) * 100))

      // Small delay between transactions
      if (completed < validRows.length) {
        await new Promise((res) => setTimeout(res, 1000))
      }
    }

    setRunning(false)
  }

  const resolveContact = (address: string) => {
    if (!address) return null
    return contacts.find((c) => c.address.toLowerCase() === address.toLowerCase())?.name ?? null
  }

  const statusColor = (s: BatchRow['status']) => {
    switch (s) {
      case 'success': return '#a4cf5e'
      case 'error': return '#f45b5b'
      case 'sending': return '#14B8A6'
      default: return undefined
    }
  }

  return (
    <HudCard>
      <Box sx={{ p: 3 }}>
        <SectionHeader>Batch Transfer</SectionHeader>
        <Box
          onClick={() => setExpanded(!expanded)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BatchIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Batch Transfer
            </Typography>
            {rows.length > 1 && (
              <Chip label={`${rows.length} recipients`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
            )}
          </Box>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {/* Token selector */}
            <FormControl size="small" sx={{ minWidth: 120, mb: 2 }}>
              <Select
                value={token}
                displayEmpty
                onChange={(e) => setToken(e.target.value)}
                disabled={running}
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="DAI">DAI</MenuItem>
                <MenuItem value="USDC">USDC</MenuItem>
                {customTokens.map((ct) => (
                  <MenuItem key={ct.address} value={ct.symbol}>{ct.symbol}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Rows */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {rows.map((row, idx) => {
                const contactName = resolveContact(row.address)
                return (
                  <Box key={row.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1.5, minWidth: 20 }}>
                      {idx + 1}.
                    </Typography>
                    <Box sx={{ flex: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="0x... recipient address"
                        value={row.address}
                        onChange={(e) => updateRow(row.id, 'address', e.target.value)}
                        disabled={running}
                        sx={{
                          '& .MuiOutlinedInput-root': { fontSize: '0.8rem' },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: statusColor(row.status) || ((theme: any) => theme.palette.custom.subtleBorder),
                          },
                        }}
                      />
                      {contactName && (
                        <Typography sx={{ fontSize: '0.7rem', color: 'primary.main', mt: 0.25, ml: 0.5 }}>
                          {contactName}
                        </Typography>
                      )}
                    </Box>
                    <TextField
                      size="small"
                      placeholder="Amount"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                      disabled={running}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': { fontSize: '0.8rem' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: statusColor(row.status) || ((theme: any) => theme.palette.custom.subtleBorder),
                        },
                      }}
                    />
                    {row.status !== 'pending' && (
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          mt: 0.5,
                          height: 22,
                          fontSize: '0.65rem',
                          color: statusColor(row.status),
                          borderColor: statusColor(row.status),
                        }}
                        variant="outlined"
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => removeRow(row.id)}
                      disabled={running || rows.length <= 1}
                      sx={{ mt: 0.5, color: 'text.secondary' }}
                    >
                      <DeleteIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Box>
                )
              })}
            </Box>

            {/* Progress bar */}
            {running && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    borderRadius: 4,
                    bgcolor: (theme: any) => theme.palette.custom.subtleBg,
                    '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                  {progress}% complete
                </Typography>
              </Box>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon sx={{ fontSize: '0.875rem !important' }} />}
                onClick={addRow}
                disabled={running}
                sx={{ textTransform: 'none', fontSize: '0.8rem' }}
              >
                Add recipient
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<StartIcon sx={{ fontSize: '0.875rem !important' }} />}
                onClick={handleStart}
                disabled={!canStart}
                sx={{ textTransform: 'none', fontSize: '0.8rem' }}
              >
                Send {validCount} transfer{validCount !== 1 ? 's' : ''}
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </HudCard>
  )
}
