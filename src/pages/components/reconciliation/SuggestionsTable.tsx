import { Box, Typography, IconButton, Tooltip, Checkbox, Skeleton } from '@mui/material'
import {
  Check as CheckIcon,
  Close as CloseIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from '@mui/icons-material'
import { HudCard } from '../HudPrimitives'
import type { SuggestionResponse } from '../../../api/reconciliation'

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#a4cf5e' : score >= 60 ? '#ffb347' : '#f45b5b'
  return (
    <Box sx={{
      px: 1, py: 0.25, borderRadius: '4px',
      bgcolor: `${color}18`, border: `1px solid ${color}30`,
      display: 'inline-flex', alignItems: 'center',
    }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {score.toFixed(1)}
      </Typography>
    </Box>
  )
}

function TxSummary({ hash, amount, token, label }: { hash: string; amount: string; token: string; label: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary' }}>
        {Number(amount).toLocaleString(undefined, { maximumFractionDigits: 4 })} {token}
      </Typography>
      <Typography sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'text.secondary' }}>
        {hash.slice(0, 10)}...{hash.slice(-6)}
      </Typography>
    </Box>
  )
}

export default function SuggestionsTable({
  suggestions,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onRowClick,
  onApprove,
  onReject,
  selectedIds,
  onToggleSelect,
}: {
  suggestions: SuggestionResponse[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onRowClick: (s: SuggestionResponse) => void
  onApprove: (s: SuggestionResponse) => void
  onReject: (s: SuggestionResponse) => void
  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
}) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: '10px' }} />
        ))}
      </Box>
    )
  }

  if (suggestions.length === 0) {
    return null // Empty state handled by parent
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {suggestions.map((s) => (
        <HudCard key={s.id} accentColor={s.score >= 80 ? '#a4cf5e' : s.score >= 60 ? '#ffb347' : '#f45b5b'}>
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 2, p: 2,
              cursor: 'pointer', '&:hover': { bgcolor: (t) => t.palette.custom.hoverBg },
            }}
          >
            {/* Checkbox */}
            <Checkbox
              size="small"
              checked={selectedIds.has(s.id)}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(s.id)}
              sx={{ p: 0 }}
            />

            {/* Anchor */}
            <Box sx={{ flex: 1, minWidth: 0 }} onClick={() => onRowClick(s)}>
              <TxSummary hash={s.anchor.tx_hash} amount={s.anchor.amount_gross} token={s.anchor.token_symbol} label="Anchor" />
            </Box>

            {/* Arrow */}
            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }} onClick={() => onRowClick(s)}>
              ↔
            </Typography>

            {/* Claim */}
            <Box sx={{ flex: 1, minWidth: 0 }} onClick={() => onRowClick(s)}>
              <TxSummary hash={s.claim.tx_hash} amount={s.claim.amount_gross} token={s.claim.token_symbol} label="Claim" />
            </Box>

            {/* Score */}
            <Box onClick={() => onRowClick(s)} sx={{ flexShrink: 0 }}>
              <ScoreBadge score={s.score} />
            </Box>

            {/* Quick actions */}
            {s.status === 'pending' && (
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <Tooltip title="Approve">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onApprove(s) }}
                    sx={{ color: '#a4cf5e', bgcolor: 'rgba(164,207,94,0.1)', '&:hover': { bgcolor: 'rgba(164,207,94,0.2)' } }}
                  >
                    <CheckIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reject">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onReject(s) }}
                    sx={{ color: '#f45b5b', bgcolor: 'rgba(244,91,91,0.1)', '&:hover': { bgcolor: 'rgba(244,91,91,0.2)' } }}
                  >
                    <CloseIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </HudCard>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 1 }}>
          <IconButton size="small" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            <PrevIcon />
          </IconButton>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
            {page} / {totalPages}
          </Typography>
          <IconButton size="small" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
            <NextIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}
