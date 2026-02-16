import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Skeleton,
} from '@mui/material'
import {
  CheckCircle as ApproveIcon,
  SwapHoriz as TransferIcon,
  Add as MintIcon,
  Close as CloseIcon,
  LocalGasStation as GasIcon,
} from '@mui/icons-material'
import { formatUnits, parseUnits, encodeFunctionData } from 'viem'
import { getPublicClient } from 'wagmi/actions'
import { config } from '../../lib/web3'
import { ERC20_ABI, DAI, USDC } from '../../lib/erc20'
import { useAppStore } from '../store/useAppStore'
import { useCustomTokensStore } from '../../stores/useCustomTokensStore'

export interface PendingAction {
  action: 'approve' | 'transfer' | 'mint'
  token: string
  amount: string
  address: string
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  pendingAction: PendingAction | null
}

function getTokenInfo(symbol: string): { address: `0x${string}`; decimals: number } | null {
  if (symbol === 'DAI') return { address: DAI, decimals: 18 }
  if (symbol === 'USDC') return { address: USDC, decimals: 6 }
  const custom = useCustomTokensStore.getState().tokens.find((t) => t.symbol === symbol)
  if (custom) return { address: custom.address as `0x${string}`, decimals: custom.decimals }
  return null
}

function useGasEstimate(open: boolean, pendingAction: PendingAction | null) {
  const [gasEstimate, setGasEstimate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !pendingAction) {
      setGasEstimate(null)
      return
    }

    let cancelled = false
    const estimate = async () => {
      setLoading(true)
      setGasEstimate(null)
      try {
        const account = useAppStore.getState().account
        if (!account) return
        const tokenInfo = getTokenInfo(pendingAction.token)
        if (!tokenInfo) return

        const pc = getPublicClient(config)
        const parsedAmount = parseUnits(pendingAction.amount, tokenInfo.decimals)

        let functionName: string
        let args: readonly unknown[]

        if (pendingAction.action === 'approve') {
          functionName = 'approve'
          args = [pendingAction.address as `0x${string}`, parsedAmount]
        } else if (pendingAction.action === 'transfer') {
          functionName = 'transfer'
          args = [pendingAction.address as `0x${string}`, parsedAmount]
        } else {
          functionName = 'mint'
          args = [account, parsedAmount]
        }

        const data = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: functionName as 'approve',
          args: args as readonly [`0x${string}`, bigint],
        })

        const [gas, gasPrice] = await Promise.all([
          pc.estimateGas({
            account,
            to: tokenInfo.address,
            data,
          }),
          pc.getGasPrice(),
        ])

        if (cancelled) return
        const costWei = gas * gasPrice
        const costEth = formatUnits(costWei, 18)
        // Show up to 6 decimal places
        const formatted = parseFloat(costEth).toFixed(6)
        setGasEstimate(`~${formatted} ETH`)
      } catch {
        if (!cancelled) setGasEstimate('Unable to estimate')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    estimate()
    return () => { cancelled = true }
  }, [open, pendingAction])

  return { gasEstimate, loading }
}

export default function ConfirmDialog({ open, onClose, onConfirm, pendingAction }: ConfirmDialogProps) {
  const { gasEstimate, loading: gasLoading } = useGasEstimate(open, pendingAction)

  if (!pendingAction) return null

  const actionLabel = pendingAction.action === 'approve' ? 'Approve'
    : pendingAction.action === 'transfer' ? 'Transfer'
    : 'Mint'

  const ActionIcon = pendingAction.action === 'approve' ? ApproveIcon
    : pendingAction.action === 'transfer' ? TransferIcon
    : MintIcon

  const actionColor = pendingAction.action === 'approve' ? '#14B8A6'
    : pendingAction.action === 'transfer' ? '#a4cf5e'
    : '#0D9488'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }
      }}
    >
      <Box sx={{ height: '2px', background: 'linear-gradient(90deg, #14B8A600, #14B8A680, #14B8A600)' }} />
      <DialogTitle sx={{
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ActionIcon sx={{ color: actionColor, fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Confirm {actionLabel}
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{
          p: 3,
          borderRadius: '8px',
          background: (theme) => theme.palette.custom.subtleBg,
          border: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Action</Typography>
            <Typography variant="body2" sx={{ color: actionColor, fontWeight: 600 }}>{actionLabel}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Token</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{pendingAction.token}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Amount</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{pendingAction.amount}</Typography>
          </Box>

          {pendingAction.action !== 'mint' && pendingAction.address && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {pendingAction.action === 'approve' ? 'Spender' : 'Recipient'}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>
                {pendingAction.address.slice(0, 6)}...{pendingAction.address.slice(-4)}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <GasIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Est. gas</Typography>
            </Box>
            {gasLoading ? (
              <Skeleton variant="text" width={100} sx={{ bgcolor: (theme: any) => theme.palette.custom.hoverBg }} />
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: gasEstimate?.startsWith('~') ? 'text.primary' : 'text.secondary' }}>
                {gasEstimate ?? '...'}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
