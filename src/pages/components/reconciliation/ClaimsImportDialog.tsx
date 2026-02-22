import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Tabs, Tab, Alert,
} from '@mui/material'
import { Upload as UploadIcon, Add as AddIcon } from '@mui/icons-material'
import type { CreateClaim } from '../../../api/transactions'

export default function ClaimsImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean
  onClose: () => void
  onImport: (claims: CreateClaim[]) => Promise<{ imported: number; failed: number }>
}) {
  const [tab, setTab] = useState(0)
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Manual form
  const [txHash, setTxHash] = useState('')
  const [type, setType] = useState<'Transfer' | 'Approval' | 'Mint'>('Transfer')
  const [tokenSymbol, setTokenSymbol] = useState('DAI')
  const [amount, setAmount] = useState('')
  const [sender, setSender] = useState('')
  const [receiver, setReceiver] = useState('')
  const [notes, setNotes] = useState('')

  // CSV
  const [csvText, setCsvText] = useState('')

  const resetForm = () => {
    setTxHash(''); setAmount(''); setSender(''); setReceiver(''); setNotes('')
    setCsvText(''); setResult(null); setError('')
  }

  const handleManualSubmit = async () => {
    if (!txHash || !amount) { setError('Hash and amount are required'); return }
    setIsLoading(true); setError('')
    try {
      const claim: CreateClaim = {
        tx_hash: txHash || `manual-${Date.now()}`,
        source: 'manual',
        type,
        token_symbol: tokenSymbol,
        amount_gross: amount,
        sender_address: sender || undefined,
        receiver_address: receiver || undefined,
        timestamp: Date.now(),
        notes: notes || undefined,
      }
      const r = await onImport([claim])
      setResult(r)
      if (r.imported > 0) resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCsvSubmit = async () => {
    if (!csvText.trim()) { setError('Paste CSV data'); return }
    setIsLoading(true); setError('')
    try {
      const lines = csvText.trim().split('\n')
      const header = lines[0].toLowerCase().split(',').map((h) => h.trim())

      const claims: CreateClaim[] = lines.slice(1).filter((l) => l.trim()).map((line) => {
        const cols = line.split(',').map((c) => c.trim())
        const row: Record<string, string> = {}
        header.forEach((h, i) => { row[h] = cols[i] ?? '' })

        return {
          tx_hash: row['tx_hash'] || row['hash'] || `csv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          source: 'csv' as const,
          type: (row['type'] || 'Transfer') as 'Transfer' | 'Approval' | 'Mint',
          token_symbol: row['token'] || row['token_symbol'] || 'DAI',
          amount_gross: row['amount'] || row['amount_gross'] || '0',
          sender_address: row['from'] || row['sender'] || undefined,
          receiver_address: row['to'] || row['receiver'] || undefined,
          timestamp: row['timestamp'] ? Number(row['timestamp']) : Date.now(),
          notes: row['notes'] || undefined,
        }
      })

      if (claims.length === 0) { setError('No valid rows found'); return }
      const r = await onImport(claims)
      setResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV parsing failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Import Claims</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setResult(null); setError('') }} sx={{ mb: 2 }}>
          <Tab label="Manual Entry" icon={<AddIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" sx={{ fontSize: '0.8rem', textTransform: 'none' }} />
          <Tab label="CSV Import" icon={<UploadIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" sx={{ fontSize: '0.8rem', textTransform: 'none' }} />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>{error}</Alert>}
        {result && <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }}>Imported {result.imported} claim(s). {result.failed > 0 ? `${result.failed} failed.` : ''}</Alert>}

        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField size="small" label="Transaction Hash" value={txHash} onChange={(e) => setTxHash(e.target.value)} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField size="small" label="Type" select value={type} onChange={(e) => setType(e.target.value as typeof type)} sx={{ width: 130 }}
                SelectProps={{ native: true }}>
                <option value="Transfer">Transfer</option>
                <option value="Approval">Approval</option>
                <option value="Mint">Mint</option>
              </TextField>
              <TextField size="small" label="Token" select value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} sx={{ width: 100 }}
                SelectProps={{ native: true }}>
                <option value="DAI">DAI</option>
                <option value="USDC">USDC</option>
              </TextField>
              <TextField size="small" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} sx={{ flex: 1 }} />
            </Box>
            <TextField size="small" label="Sender Address" value={sender} onChange={(e) => setSender(e.target.value)} fullWidth />
            <TextField size="small" label="Receiver Address" value={receiver} onChange={(e) => setReceiver(e.target.value)} fullWidth />
            <TextField size="small" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={2} fullWidth />
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Paste CSV with headers: tx_hash, type, token, amount, from, to, timestamp, notes
            </Typography>
            <TextField
              multiline rows={8} fullWidth
              placeholder={'tx_hash,type,token,amount,from,to\ninternal-001,Transfer,DAI,100.0,0xA...,0xB...'}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'monospace', fontSize: '0.75rem' } }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ fontSize: '0.8rem' }}>Cancel</Button>
        <Button
          variant="contained"
          disabled={isLoading}
          onClick={tab === 0 ? handleManualSubmit : handleCsvSubmit}
          sx={{ fontSize: '0.8rem' }}
        >
          {isLoading ? 'Importing...' : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
