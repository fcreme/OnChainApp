import { AnimatePresence, motion } from 'framer-motion'
import { Box, Typography, Button, Chip, TextField } from '@mui/material'
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Gavel as ForceIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { DrawerHeader, SectionHeader } from '../HudPrimitives'
import ScoreBreakdownChart from './ScoreBreakdownChart'
import type { SuggestionResponse } from '../../../api/reconciliation'

function TxCard({ label, tx, color }: { label: string; tx: SuggestionResponse['anchor']; color: string }) {
  return (
    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: (t) => t.palette.custom.subtleBg, border: 1, borderColor: 'divider' }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color, mb: 1.5 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Row label="Hash" value={tx.tx_hash} mono link={`https://sepolia.etherscan.io/tx/${tx.tx_hash}`} />
        <Row label="Amount" value={tx.amount_gross} />
        <Row label="Token" value={tx.token_symbol} />
        {tx.sender_address && <Row label="From" value={tx.sender_address} mono />}
        {tx.receiver_address && <Row label="To" value={tx.receiver_address} mono />}
        <Row label="Time" value={new Date(tx.timestamp).toLocaleString()} />
        <Row label="Source" value={tx.source} />
      </Box>
    </Box>
  )
}

function Row({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) {
  const display = mono && value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: 'text.primary', fontFamily: mono ? 'monospace' : 'inherit' }}>
          {display}
        </Typography>
        {link && (
          <Box component="a" href={link} target="_blank" rel="noopener" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
            <ExternalIcon sx={{ fontSize: '0.7rem' }} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default function MatchDetailDrawer({
  suggestion,
  open,
  onClose,
  onApprove,
  onReject,
  onForce,
}: {
  suggestion: SuggestionResponse | null
  open: boolean
  onClose: () => void
  onApprove: (s: SuggestionResponse) => void
  onReject: (s: SuggestionResponse, reason: string) => void
  onForce: (s: SuggestionResponse) => void
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleReject = () => {
    if (suggestion) {
      onReject(suggestion, rejectReason)
      setRejectReason('')
      setShowRejectForm(false)
    }
  }

  return (
    <AnimatePresence>
      {open && suggestion && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1300 }}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 440, maxWidth: '100vw',
              zIndex: 1301, overflowY: 'auto',
            }}
          >
            <Box sx={{ bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <DrawerHeader color="#14B8A6" onClose={onClose}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>
                    Match Detail
                  </Typography>
                  <Chip
                    label={suggestion.status}
                    size="small"
                    sx={{
                      mt: 0.5,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      height: 22,
                      bgcolor: suggestion.status === 'pending' ? 'rgba(255,179,71,0.15)' : suggestion.status === 'approved' ? 'rgba(164,207,94,0.15)' : 'rgba(244,91,91,0.15)',
                      color: suggestion.status === 'pending' ? '#ffb347' : suggestion.status === 'approved' ? '#a4cf5e' : '#f45b5b',
                    }}
                  />
                </Box>
              </DrawerHeader>

              <Box sx={{ flex: 1, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto' }}>
                {/* Score Breakdown */}
                <SectionHeader>Confidence Score</SectionHeader>
                <ScoreBreakdownChart breakdown={suggestion.score_breakdown} total={suggestion.score} />

                {/* Anchor */}
                <SectionHeader>On-Chain Anchor</SectionHeader>
                <TxCard label="Anchor" tx={suggestion.anchor} color="#14B8A6" />

                {/* Claim */}
                <SectionHeader>Off-Chain Claim</SectionHeader>
                <TxCard label="Claim" tx={suggestion.claim} color="#a4cf5e" />

                {/* Reject form */}
                {showRejectForm && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Reason for rejection (optional)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      multiline
                      rows={2}
                      sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" color="error" onClick={handleReject} sx={{ fontSize: '0.75rem', flex: 1 }}>
                        Confirm Reject
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => setShowRejectForm(false)} sx={{ fontSize: '0.75rem' }}>
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Actions */}
              {suggestion.status === 'pending' && (
                <Box sx={{ p: 2.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<CheckIcon sx={{ fontSize: '0.9rem !important' }} />}
                    onClick={() => onApprove(suggestion)}
                    sx={{ flex: 1, fontSize: '0.8rem', bgcolor: '#a4cf5e', color: '#111', '&:hover': { bgcolor: '#93bf4d' } }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon sx={{ fontSize: '0.9rem !important' }} />}
                    onClick={() => setShowRejectForm(true)}
                    sx={{ flex: 1, fontSize: '0.8rem' }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ForceIcon sx={{ fontSize: '0.9rem !important' }} />}
                    onClick={() => onForce(suggestion)}
                    sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1.5 }}
                  >
                    Force
                  </Button>
                </Box>
              )}
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
