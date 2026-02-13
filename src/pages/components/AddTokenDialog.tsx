import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material'
import { Close as CloseIcon, Token as TokenIcon } from '@mui/icons-material'
import { getPublicClient } from 'wagmi/actions'
import { config } from '../../lib/web3'
import { useCustomTokensStore } from '../../stores/useCustomTokensStore'

const TOKEN_META_ABI = [
  {
    type: 'function' as const,
    name: 'name',
    stateMutability: 'view' as const,
    inputs: [],
    outputs: [{ type: 'string' as const }],
  },
  {
    type: 'function' as const,
    name: 'symbol',
    stateMutability: 'view' as const,
    inputs: [],
    outputs: [{ type: 'string' as const }],
  },
  {
    type: 'function' as const,
    name: 'decimals',
    stateMutability: 'view' as const,
    inputs: [],
    outputs: [{ type: 'uint8' as const }],
  },
] as const

interface TokenPreview {
  name: string
  symbol: string
  decimals: number
}

interface AddTokenDialogProps {
  open: boolean
  onClose: () => void
}

export default function AddTokenDialog({ open, onClose }: AddTokenDialogProps) {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<TokenPreview | null>(null)
  const addToken = useCustomTokensStore((s) => s.addToken)

  const reset = () => {
    setAddress('')
    setLoading(false)
    setError('')
    setPreview(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleDetect = async () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError('Invalid contract address')
      return
    }

    setLoading(true)
    setError('')
    setPreview(null)

    try {
      const pc = getPublicClient(config)
      const addr = address as `0x${string}`

      const [name, symbol, decimals] = await Promise.all([
        pc.readContract({ address: addr, abi: TOKEN_META_ABI, functionName: 'name' }),
        pc.readContract({ address: addr, abi: TOKEN_META_ABI, functionName: 'symbol' }),
        pc.readContract({ address: addr, abi: TOKEN_META_ABI, functionName: 'decimals' }),
      ])

      setPreview({
        name: name as string,
        symbol: symbol as string,
        decimals: Number(decimals),
      })
    } catch {
      setError('Could not read token metadata. Make sure this is a valid ERC20 contract on Sepolia.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    if (!preview) return
    addToken({
      address,
      name: preview.name,
      symbol: preview.symbol,
      decimals: preview.decimals,
    })
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TokenIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Add custom token
          </Typography>
        </Box>
        <Button onClick={handleClose} sx={{ minWidth: 'auto', p: 1 }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          label="Contract address"
          placeholder="0x..."
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setError('')
            setPreview(null)
          }}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
        />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {preview && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: '8px',
              background: (theme) => theme.palette.custom.subtleBg,
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Name
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {preview.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Symbol
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {preview.symbol}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Decimals
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {preview.decimals}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        {preview ? (
          <Button onClick={handleAdd} variant="contained">
            Add token
          </Button>
        ) : (
          <Button
            onClick={handleDetect}
            variant="contained"
            disabled={loading || !address}
          >
            Detect token
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
