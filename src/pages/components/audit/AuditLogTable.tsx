import { Box, Typography, Skeleton, IconButton, Chip } from '@mui/material'
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  ExpandMore as ExpandIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { HudCard } from '../HudPrimitives'
import type { AuditLogResponse } from '../../../api/audit'

const actionColors: Record<string, string> = {
  create_claim: '#14B8A6',
  suggest_match: '#8b5cf6',
  approve_match: '#a4cf5e',
  reject_match: '#f45b5b',
  force_reconcile: '#ffb347',
  update_config: '#14B8A6',
  sync_anchors: '#14B8A6',
}

function DiffViewer({ previous, next }: { previous: Record<string, unknown> | null; next: Record<string, unknown> | null }) {
  if (!previous && !next) return null
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1.5 }}>
      {previous && (
        <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(244,91,91,0.06)', border: '1px solid rgba(244,91,91,0.15)' }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#f45b5b', textTransform: 'uppercase', mb: 0.75 }}>
            Before
          </Typography>
          <Typography component="pre" sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'pre-wrap', wordBreak: 'break-all', m: 0 }}>
            {JSON.stringify(previous, null, 2)}
          </Typography>
        </Box>
      )}
      {next && (
        <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(164,207,94,0.06)', border: '1px solid rgba(164,207,94,0.15)' }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#a4cf5e', textTransform: 'uppercase', mb: 0.75 }}>
            After
          </Typography>
          <Typography component="pre" sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'pre-wrap', wordBreak: 'break-all', m: 0 }}>
            {JSON.stringify(next, null, 2)}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default function AuditLogTable({
  logs,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: {
  logs: AuditLogResponse[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: '10px' }} />
        ))}
      </Box>
    )
  }

  if (logs.length === 0) return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {logs.map((log) => {
        const isExpanded = expandedId === log.id
        const color = actionColors[log.action] || '#14B8A6'

        return (
          <HudCard key={log.id} accentColor={color}>
            <Box
              sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: (t) => t.palette.custom.hoverBg } }}
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Timestamp */}
                <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'text.secondary', minWidth: 140, flexShrink: 0 }}>
                  {new Date(log.timestamp).toLocaleString()}
                </Typography>

                {/* Action chip */}
                <Chip
                  label={log.action.replace(/_/g, ' ')}
                  size="small"
                  sx={{
                    fontSize: '0.65rem', fontWeight: 600, height: 22,
                    bgcolor: `${color}15`, color, border: `1px solid ${color}30`,
                  }}
                />

                {/* Entity */}
                <Typography sx={{ fontSize: '0.75rem', color: 'text.primary', flex: 1 }}>
                  {log.entity_type} #{log.entity_id}
                </Typography>

                {/* Actor */}
                <Typography sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'text.secondary', flexShrink: 0 }}>
                  {log.actor ? `${log.actor.slice(0, 8)}...` : 'system'}
                </Typography>

                {/* Expand arrow */}
                <ExpandIcon sx={{
                  fontSize: '1rem', color: 'text.secondary',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }} />
              </Box>

              {/* Expanded diff */}
              {isExpanded && (
                <DiffViewer
                  previous={log.previous_state as Record<string, unknown> | null}
                  next={log.new_state as Record<string, unknown> | null}
                />
              )}
            </Box>
          </HudCard>
        )
      })}

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
