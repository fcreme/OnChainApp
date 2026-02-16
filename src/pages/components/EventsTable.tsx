import { useState } from 'react'
import { useAppStore, type AppEvent } from '../store/useAppStore'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  Chip,
  Box,
  Typography,
  Tooltip,
  IconButton,
  Skeleton,
  Button,
} from '@mui/material'
import { SectionHeader, HudCard } from './HudPrimitives'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SwapHoriz as TransferIcon,
  CheckCircle as ApprovalIcon,
  Add as MintIcon,
  ReceiptLong as ReceiptIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { useResolveContact } from '../../hooks/useResolveContact'
import TransactionDetailDrawer from './TransactionDetailDrawer'

function CopyableAddress({ address }: { address: string | undefined }) {
  const { copy, copiedText } = useCopyToClipboard()
  const contactName = useResolveContact(address)
  if (!address) return <>-</>
  const isCopied = copiedText === address
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {contactName ? (
        <Tooltip title={address}>
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>{contactName}</Box>
        </Tooltip>
      ) : null}
      <Box component="span" sx={contactName ? { color: 'text.secondary', fontSize: '0.75rem' } : undefined}>
        {contactName ? `(${short})` : short}
      </Box>
      <Tooltip title={isCopied ? 'Copied!' : 'Copy'}>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); copy(address) }}
          sx={{ p: 0.25, color: isCopied ? '#a4cf5e' : 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          {isCopied ? <CheckIcon sx={{ fontSize: '0.75rem' }} /> : <CopyIcon sx={{ fontSize: '0.75rem' }} />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

function CopyableTx({ tx }: { tx: string }) {
  const { copy, copiedText } = useCopyToClipboard()
  const isCopied = copiedText === tx

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Link
        href={`https://sepolia.etherscan.io/tx/${tx}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        sx={{
          fontFamily: 'monospace',
          fontSize: { xs: '0.7rem', sm: '0.875rem' },
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' }
        }}
      >
        {tx.slice(0, 10)}...
      </Link>
      <Tooltip title={isCopied ? 'Copied!' : 'Copy tx hash'}>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); copy(tx) }}
          sx={{ p: 0.25, color: isCopied ? '#a4cf5e' : 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          {isCopied ? <CheckIcon sx={{ fontSize: '0.75rem' }} /> : <CopyIcon sx={{ fontSize: '0.75rem' }} />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

const getEventIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'transfer':
      return <TransferIcon fontSize="small" />
    case 'approval':
      return <ApprovalIcon fontSize="small" />
    case 'mint':
      return <MintIcon fontSize="small" />
    default:
      return undefined
  }
}

const getEventColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'transfer':
      return 'success'
    case 'approval':
      return 'warning'
    case 'mint':
      return 'info'
    default:
      return 'default'
  }
}

function EventsDialog({
  open,
  onClose,
  events,
  onSelectEvent,
}: {
  open: boolean
  onClose: () => void
  events: AppEvent[]
  onSelectEvent: (event: AppEvent) => void
}) {
  const reversedEvents = events.slice().reverse()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="events-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Modal panel */}
            <motion.div
              key="events-modal"
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90%',
                maxWidth: 1100,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '80vh',
                  overflow: 'hidden',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5, pb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ReceiptIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Recent Events
                    </Typography>
                    <Chip label={`${events.length}`} size="small" sx={{ fontSize: '0.75rem', height: 22 }} />
                  </Box>
                  <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* Table */}
                <Box sx={{ px: 2.5, pb: 2.5, flex: 1, overflow: 'hidden' }}>
                  <TableContainer sx={{ maxHeight: '65vh' }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          {['Type', 'Token', 'Amount', 'From', 'To', 'Tx', 'Date'].map((h) => (
                            <TableCell
                              key={h}
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                padding: '10px 12px',
                                bgcolor: 'background.paper',
                                color: 'text.secondary',
                                ...(h === 'From' || h === 'To'
                                  ? { display: { xs: 'none', md: 'table-cell' } }
                                  : {}),
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reversedEvents.map((e, i) => (
                          <TableRow
                            key={i}
                            hover
                            onClick={() => onSelectEvent(e)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ padding: '10px 12px' }}>
                              <Chip
                                icon={getEventIcon(e.type)}
                                label={e.type}
                                color={getEventColor(e.type) as 'success' | 'warning' | 'info' | 'default'}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </TableCell>
                            <TableCell sx={{ padding: '10px 12px' }}>
                              <Chip
                                label={e.token}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </TableCell>
                            <TableCell sx={{ padding: '10px 12px', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'monospace' }}>
                              {e.amount}
                            </TableCell>
                            <TableCell
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                padding: '10px 12px',
                                display: { xs: 'none', md: 'table-cell' },
                              }}
                            >
                              <CopyableAddress address={e.from} />
                            </TableCell>
                            <TableCell
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                padding: '10px 12px',
                                display: { xs: 'none', md: 'table-cell' },
                              }}
                            >
                              <CopyableAddress address={e.to} />
                            </TableCell>
                            <TableCell sx={{ padding: '10px 12px' }}>
                              <CopyableTx tx={e.tx} />
                            </TableCell>
                            <TableCell
                              sx={{
                                padding: '10px 12px',
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {e.timestamp
                                ? new Date(e.timestamp).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function EventsTable() {
  const events = useAppStore((s) => s.events) || []
  const isLoadingEvents = useAppStore((s) => s.isLoadingEvents)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null)

  if (isLoadingEvents && events.length === 0) {
    return (
      <HudCard sx={{ height: '100%' }}>
        <Box sx={{ p: 2.5 }}>
          <SectionHeader>Recent Events</SectionHeader>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={36}
                sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg, borderRadius: '6px' }}
              />
            ))}
          </Box>
        </Box>
      </HudCard>
    )
  }

  if (events.length === 0) {
    return (
      <HudCard sx={{ height: '100%' }}>
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <SectionHeader>Recent Events</SectionHeader>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 600 }}>
              No events yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Perform a transfer, approval, or mint to see events here
            </Typography>
          </Box>
        </Box>
      </HudCard>
    )
  }

  const recent = events.slice().reverse().slice(0, 3)
  const transferCount = events.filter((e) => e.type.toLowerCase() === 'transfer').length
  const approvalCount = events.filter((e) => e.type.toLowerCase() === 'approval').length
  const mintCount = events.filter((e) => e.type.toLowerCase() === 'mint').length

  return (
    <>
      <HudCard sx={{ height: '100%' }}>
        <Box sx={{ p: 2.5 }}>
          {/* Header */}
          <SectionHeader>Recent Events</SectionHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Chip label={`${events.length}`} size="small" sx={{ fontSize: '0.75rem', height: 22 }} />
            <Button
              size="small"
              variant="contained"
              endIcon={<ViewIcon sx={{ fontSize: '0.875rem !important' }} />}
              onClick={(e) => { e.stopPropagation(); setDialogOpen(true) }}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: '8px',
                px: 1.5,
                py: 0.5,
              }}
            >
              View all
            </Button>
          </Box>

          {/* Summary chips */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {transferCount > 0 && (
              <Chip
                icon={<TransferIcon sx={{ fontSize: '0.875rem !important' }} />}
                label={`${transferCount} transfers`}
                color="success"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {approvalCount > 0 && (
              <Chip
                icon={<ApprovalIcon sx={{ fontSize: '0.875rem !important' }} />}
                label={`${approvalCount} approvals`}
                color="warning"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {mintCount > 0 && (
              <Chip
                icon={<MintIcon sx={{ fontSize: '0.875rem !important' }} />}
                label={`${mintCount} mints`}
                color="info"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>

          {/* Last 3 events preview */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {recent.map((e, i) => (
              <Box
                key={i}
                onClick={() => setSelectedEvent(e)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1,
                  borderRadius: '6px',
                  bgcolor: (theme) => theme.palette.custom.subtleBg,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: (theme) => theme.palette.custom.hoverBg },
                }}
              >
                <Chip
                  icon={getEventIcon(e.type)}
                  label={e.type}
                  color={getEventColor(e.type) as 'success' | 'warning' | 'info' | 'default'}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', minWidth: 90 }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, fontSize: '0.8rem', flex: 1, minWidth: 0, fontFamily: 'monospace' }}
                  noWrap
                >
                  {e.amount} {e.token}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontSize: '0.7rem' }}
                >
                  {e.timestamp
                    ? new Date(e.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </HudCard>

      <EventsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        events={events}
        onSelectEvent={setSelectedEvent}
      />

      <TransactionDetailDrawer
        open={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </>
  )
}
