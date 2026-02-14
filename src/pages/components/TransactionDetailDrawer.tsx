import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  Skeleton,
  TextField,
  Button,
} from '@mui/material'
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  OpenInNew as ExternalIcon,
  StickyNote2 as NoteIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import type { AppEvent } from '../store/useAppStore'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { useTransactionNotesStore } from '../../stores/useTransactionNotesStore'
import { ERC20_ABI, DAI, USDC } from '../../lib/erc20'
import { TESTNET_SETTINGS } from '../../lib/testnet-config'
import { useCustomTokensStore } from '../../stores/useCustomTokensStore'
import { config } from '../../lib/web3'
import { getPublicClient } from 'wagmi/actions'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'

const MAX_UINT256 = 2n ** 256n - 1n
const UNLIMITED_THRESHOLD = MAX_UINT256 / 2n

function getTokenAddress(symbol: string): `0x${string}` | undefined {
  if (symbol === 'DAI') return DAI
  if (symbol === 'USDC') return USDC
  const custom = useCustomTokensStore.getState().tokens.find((t) => t.symbol === symbol)
  if (custom) return custom.address as `0x${string}`
  return undefined
}

function getTokenDecimals(symbol: string): number {
  if (symbol === 'DAI') return 18
  if (symbol === 'USDC') return 6
  const custom = useCustomTokensStore.getState().tokens.find((t) => t.symbol === symbol)
  return custom?.decimals ?? 18
}

function CopyButton({ text }: { text: string }) {
  const { copy, copiedText } = useCopyToClipboard()
  const isCopied = copiedText === text

  return (
    <Tooltip title={isCopied ? 'Copied!' : 'Copy'}>
      <IconButton
        size="small"
        onClick={() => copy(text)}
        sx={{ p: 0.25, color: isCopied ? '#a4cf5e' : 'text.secondary', '&:hover': { color: 'primary.main' } }}
      >
        {isCopied ? <CheckIcon sx={{ fontSize: '0.875rem' }} /> : <CopyIcon sx={{ fontSize: '0.875rem' }} />}
      </IconButton>
    </Tooltip>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  event: AppEvent | null
}

export default function TransactionDetailDrawer({ open, onClose, event }: Props) {
  const { address: userAddress } = useAccount()
  const [allowance, setAllowance] = useState<string | null>(null)
  const [loadingAllowance, setLoadingAllowance] = useState(false)
  const explorerUrl = TESTNET_SETTINGS.network.explorer

  // Transaction notes
  const savedNote = useTransactionNotesStore((s) => event ? s.notes[event.tx] : undefined)
  const setNote = useTransactionNotesStore((s) => s.setNote)
  const [editingNote, setEditingNote] = useState(false)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    if (open && event) {
      setNoteText(savedNote || '')
      setEditingNote(false)
    }
  }, [open, event, savedNote])

  useEffect(() => {
    if (!open || !event || event.type !== 'Approval' || !userAddress || !event.to) {
      setAllowance(null)
      return
    }

    const tokenAddr = getTokenAddress(event.token)
    if (!tokenAddr) return

    setLoadingAllowance(true)
    const pc = getPublicClient(config)
    pc.readContract({
      address: tokenAddr,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, event.to as `0x${string}`],
    })
      .then((raw) => {
        const val = raw as bigint
        if (val >= UNLIMITED_THRESHOLD) {
          setAllowance('Unlimited')
        } else {
          setAllowance(formatUnits(val, getTokenDecimals(event.token)))
        }
      })
      .catch(() => setAllowance(null))
      .finally(() => setLoadingAllowance(false))
  }, [open, event, userAddress])

  const eventColor = event
    ? event.type.toLowerCase() === 'transfer' ? 'success'
    : event.type.toLowerCase() === 'approval' ? 'warning' : 'info'
    : 'default'

  const toLabel = event?.type === 'Approval' ? 'Spender' : 'To'

  return (
    <AnimatePresence>
      {open && event && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 1300,
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 400,
              maxWidth: '100vw',
              zIndex: 1301,
            }}
          >
            <Box
              sx={{
                height: '100%',
                bgcolor: 'background.paper',
                borderLeft: 1,
                borderColor: 'divider',
                overflowY: 'auto',
              }}
            >
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Transaction Details
                  </Typography>
                  <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* Type, Token, Source chips */}
                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  <Chip label={event.type} color={eventColor as 'success' | 'warning' | 'info' | 'default'} size="small" variant="outlined" />
                  <Chip label={event.token} size="small" variant="outlined" />
                  {event.source && (
                    <Chip
                      label={event.source === 'local' ? 'Local' : 'On-chain'}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: 'text.secondary', color: 'text.secondary' }}
                    />
                  )}
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Detail card */}
                <Box
                  sx={{
                    bgcolor: (theme) => theme.palette.custom.subtleBg,
                    borderRadius: '8px',
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5,
                  }}
                >
                  {/* Amount */}
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Amount
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
                      {event.amount} {event.token}
                    </Typography>
                  </Box>

                  {/* From */}
                  {event.from && (
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        From
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', wordBreak: 'break-all', color: 'text.primary' }}
                        >
                          {event.from}
                        </Typography>
                        <CopyButton text={event.from} />
                      </Box>
                    </Box>
                  )}

                  {/* To / Spender */}
                  {event.to && (
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {toLabel}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', wordBreak: 'break-all', color: 'text.primary' }}
                        >
                          {event.to}
                        </Typography>
                        <CopyButton text={event.to} />
                      </Box>
                    </Box>
                  )}

                  {/* Tx Hash */}
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Transaction Hash
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', wordBreak: 'break-all', color: 'text.primary' }}
                      >
                        {event.tx}
                      </Typography>
                      <CopyButton text={event.tx} />
                      <Tooltip title="View on Etherscan">
                        <IconButton
                          size="small"
                          component="a"
                          href={`${explorerUrl}/tx/${event.tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                        >
                          <ExternalIcon sx={{ fontSize: '0.875rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Timestamp */}
                  {event.timestamp && (
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Timestamp
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.5 }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  )}

                  {/* Remaining Allowance (Approval events only) */}
                  {event.type === 'Approval' && (
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Current Remaining Allowance
                      </Typography>
                      {loadingAllowance ? (
                        <Skeleton variant="text" width={120} sx={{ mt: 0.5 }} />
                      ) : allowance !== null ? (
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                          {allowance} {allowance !== 'Unlimited' ? event.token : ''}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          Unable to fetch
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Transaction Note */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <NoteIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Note
                      </Typography>
                    </Box>
                    {editingNote ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                          size="small"
                          multiline
                          minRows={2}
                          maxRows={4}
                          placeholder="Add a note about this transaction..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          autoFocus
                          sx={{
                            '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: (theme: any) => theme.palette.custom.subtleBorder,
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setNote(event.tx, noteText)
                              setEditingNote(false)
                            }}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setNoteText(savedNote || '')
                              setEditingNote(false)
                            }}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', color: 'text.secondary' }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : savedNote ? (
                      <Typography
                        variant="body2"
                        onClick={() => setEditingNote(true)}
                        sx={{
                          color: 'text.primary',
                          cursor: 'pointer',
                          p: 1,
                          borderRadius: '4px',
                          '&:hover': { bgcolor: (theme: any) => theme.palette.custom.hoverBg },
                        }}
                      >
                        {savedNote}
                      </Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        onClick={() => setEditingNote(true)}
                        sx={{
                          color: 'text.secondary',
                          cursor: 'pointer',
                          fontStyle: 'italic',
                          fontSize: '0.8125rem',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        Click to add a note...
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
