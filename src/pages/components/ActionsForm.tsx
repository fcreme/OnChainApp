import { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { useAppStore } from '../store/useAppStore'
import type { BuiltInToken } from '../store/useAppStore'
import { sepolia } from 'wagmi/chains'
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  Button as MuiButton,
  Box,
  Alert,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Card,
  CardContent,
} from '@mui/material'
import {
  CheckCircle as ApproveIcon,
  SwapHoriz as TransferIcon,
  Add as MintIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Contacts as ContactsIcon,
  History as HistoryIcon,
  Tune as OperationsIcon,
} from '@mui/icons-material'
import ConfirmDialog, { type PendingAction } from './ConfirmDialog'
import AddressBookDialog from './AddressBookDialog'
import SaveContactPrompt from './SaveContactPrompt'
import { useCustomTokensStore } from '../../stores/useCustomTokensStore'
import { useContactsStore } from '../../stores/useContactsStore'
import { useRecentAddressesStore } from '../../stores/useRecentAddressesStore'

const schema = z.object({
  token: z.string().min(1, 'Select a token'),
  amount: z.string().refine(v=>Number(v)>0,'Invalid amount'),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address').optional()
})

const BUILT_IN_TOKENS: BuiltInToken[] = ['DAI', 'USDC']

export default function ActionsForm(){
  const {
    approve,
    transfer,
    mint,
    transactionStatus,
    isConnected,
    chainId
  } = useAppStore()
  const customTokens = useCustomTokensStore((s) => s.tokens)
  const contacts = useContactsStore((s) => s.contacts)
  const recentAddresses = useRecentAddressesStore((s) => s.addresses)
  const addRecentAddress = useRecentAddressesStore((s) => s.addAddress)
  const [addressBookOpen, setAddressBookOpen] = useState(false)
  const [lastSuccessAddress, setLastSuccessAddress] = useState<string | null>(null)

  const isWrongNetwork = isConnected && chainId !== sepolia.id
  const [loading, setLoading] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Clear local error when transaction status changes
  useEffect(() => {
    if (transactionStatus === 'pending' || transactionStatus === 'confirming') {
      setError('')
    }
  }, [transactionStatus])

  function friendlyError(e: unknown, fallback: string): string {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('User rejected') || msg.includes('user rejected') || msg.includes('User denied'))
      return 'Transaction cancelled — you rejected the request in your wallet.'
    if (msg.includes('insufficient funds'))
      return 'Insufficient funds — not enough ETH to cover gas fees.'
    if (msg.includes('exceeds balance'))
      return 'Insufficient token balance for this transaction.'
    if (msg.includes('nonce'))
      return 'Transaction conflict — please try again.'
    if (msg.includes('network') || msg.includes('disconnected'))
      return 'Network error — please check your connection and try again.'
    if (msg.includes('execution reverted'))
      return 'Transaction reverted by the contract. Check your inputs and try again.'
    if (msg.length > 120)
      return fallback
    return msg
  }

  async function doApprove(f:{token:string, amount:string, address:string}){
    try {
      setError('')
      setLoading('approve')
      const validated = schema.parse(f)
      await approve(validated.token, validated.address as `0x${string}`, validated.amount)
    } catch(e: unknown) {
      if (e instanceof Error && !(typeof e === 'object' && 'errors' in e)) {
        setError(friendlyError(e, 'Error approving transaction. Please try again.'))
      } else if (typeof e === 'object' && e !== null && 'errors' in e) {
        // Handle Zod validation errors
        const zodError = e as { errors: Array<{ message: string, path: string[] }> }
        const errorMessages = zodError.errors.map(err => {
          if (err.path.includes('amount')) {
            if (f.amount === '') {
              return 'Please enter an amount'
            }
            if (Number(f.amount) <= 0) {
              return 'Amount must be greater than 0'
            }
            return 'Please enter a valid amount'
          }
          if (err.path.includes('address')) {
            if (f.address === '') {
              return 'Please enter an Ethereum address'
            }
            if (!f.address.startsWith('0x')) {
              return 'Address must start with 0x'
            }
            if (f.address.length !== 42) {
              return 'Address must be 42 characters long (0x + 40 hex characters)'
            }
            return 'Please enter a valid Ethereum address'
          }
          return err.message
        })
        setError(errorMessages.join(', '))
             } else {
         setError(friendlyError(e, 'Error approving transaction. Please try again.'))
       }
    } finally {
      setLoading('')
    }
  }

  async function doTransfer(f:{token:string, amount:string, address:string}){
    try {
      setError('')
      setLoading('transfer')
      const validated = schema.parse(f)
      await transfer(validated.token, validated.address as `0x${string}`, validated.amount)
    } catch(e: unknown) {
      if (e instanceof Error && !(typeof e === 'object' && 'errors' in e)) {
        setError(friendlyError(e, 'Error transferring tokens. Please try again.'))
      } else if (typeof e === 'object' && e !== null && 'errors' in e) {
        // Handle Zod validation errors
        const zodError = e as { errors: Array<{ message: string, path: string[] }> }
        const errorMessages = zodError.errors.map(err => {
          if (err.path.includes('amount')) {
            if (f.amount === '') {
              return 'Please enter an amount'
            }
            if (Number(f.amount) <= 0) {
              return 'Amount must be greater than 0'
            }
            return 'Please enter a valid amount'
          }
          if (err.path.includes('address')) {
            if (f.address === '') {
              return 'Please enter an Ethereum address'
            }
            if (!f.address.startsWith('0x')) {
              return 'Address must start with 0x'
            }
            if (f.address.length !== 42) {
              return 'Address must be 42 characters long (0x + 40 hex characters)'
            }
            return 'Please enter a valid Ethereum address'
          }
          return err.message
        })
        setError(errorMessages.join(', '))
             } else {
         setError(friendlyError(e, 'Error transferring tokens. Please try again.'))
       }
    } finally {
      setLoading('')
    }
  }

  async function doMint(f:{token:string, amount:string}){
    try {
      setError('')
      setLoading('mint')
      const validated = schema.parse(f)
      await mint(validated.token as BuiltInToken, validated.amount)
    } catch(e: unknown) {
      if (e instanceof Error && !(typeof e === 'object' && 'errors' in e)) {
        setError(friendlyError(e, 'Error minting tokens. Please try again.'))
      } else if (typeof e === 'object' && e !== null && 'errors' in e) {
        // Handle Zod validation errors
        const zodError = e as { errors: Array<{ message: string, path: string[] }> }
        const errorMessages = zodError.errors.map(err => {
          if (err.path.includes('amount')) return 'Please enter a valid amount greater than 0'
          return err.message
        })
        setError(errorMessages.join(', '))
             } else {
         setError(friendlyError(e, 'Error minting tokens. Please try again.'))
       }
    } finally {
      setLoading('')
    }
  }

  const [formData, setFormData] = useState({
    token: 'DAI' as string,
    amount: '',
    address: ''
  })

  // Resolve contact name for the current address input
  const resolvedContact = formData.address
    ? contacts.find((c) => c.address.toLowerCase() === formData.address.toLowerCase())?.name ?? null
    : null

  // Track the address used in the pending action so we can offer save-to-contacts on success
  const pendingAddressRef = useRef<string | null>(null)

  // Watch transactionStatus to trigger the save-contact prompt
  const prevStatusRef = useRef(transactionStatus)
  useEffect(() => {
    if (prevStatusRef.current !== 'success' && transactionStatus === 'success' && pendingAddressRef.current) {
      const addr = pendingAddressRef.current
      addRecentAddress(addr)
      const alreadySaved = contacts.some((c) => c.address.toLowerCase() === addr.toLowerCase())
      if (!alreadySaved) {
        setLastSuccessAddress(addr)
      }
      pendingAddressRef.current = null
    }
    prevStatusRef.current = transactionStatus
  }, [transactionStatus, contacts, addRecentAddress])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData(prev => ({ ...prev, amount: '', address: '' }))
  }

  const executeAction = async (action: 'approve' | 'transfer' | 'mint') => {
    // Track address for save-to-contacts prompt on success
    pendingAddressRef.current = (action !== 'mint' && formData.address) ? formData.address : null
    try {
      if (action === 'mint') {
        const { address: _address, ...data } = formData
        await doMint(data)
      } else if (action === 'approve') {
        await doApprove(formData)
      } else if (action === 'transfer') {
        await doTransfer(formData)
      }
      resetForm()
    } catch {
      // Error already handled in do* functions
    }
  }

  const handleSubmit = (action: 'approve' | 'transfer' | 'mint') => {
    setPendingAction({
      action,
      token: formData.token,
      amount: formData.amount,
      address: formData.address
    })
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingAction) return
    setConfirmOpen(false)
    await executeAction(pendingAction.action)
    setPendingAction(null)
  }

  const handleCancelConfirm = () => {
    setConfirmOpen(false)
    setPendingAction(null)
  }

  const renderErrorMessage = (message: string) => {
    if (message.includes('Address must start with 0x') || message.includes('Address must be 42 characters') || message.includes('Invalid Ethereum address')) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
          <Box sx={{ color: 'error.light', fontWeight: 500 }}>
            Invalid address. Must start with 0x and have 42 characters
          </Box>
        </Box>
      )
    }

    if (message.includes('Please enter an amount') || message.includes('Amount must be greater than 0') || message.includes('Invalid amount')) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
          <Box sx={{ color: 'warning.light', fontWeight: 500 }}>
            Please enter a valid amount greater than 0
          </Box>
        </Box>
      )
    }

    if (message.includes('Please enter an Ethereum address')) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
          <Box sx={{ color: 'warning.light', fontWeight: 500 }}>
            Please enter a valid Ethereum address
          </Box>
        </Box>
      )
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
        <Box sx={{ color: 'error.light', fontWeight: 500 }}>
          {message}
        </Box>
      </Box>
    )
  }

  return (
    <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', boxShadow: 'none', borderRadius: '8px' }}>
      <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <OperationsIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Token Operations
        </Typography>
      </Box>
      <Box component="form">
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      {error && (
        <Alert
          severity="error"
          icon={false}
          sx={{
            mb: 2,
            borderRadius: '8px',
            background: 'rgba(244, 91, 91, 0.1)',
            border: '1px solid rgba(244, 91, 91, 0.3)',
            '& .MuiAlert-message': {
              color: 'error.light',
              fontWeight: 500
            }
          }}
          data-testid="error-message"
        >
          {renderErrorMessage(error)}
        </Alert>
      )}

      {!isConnected && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            borderRadius: '8px',
            background: 'rgba(255, 179, 71, 0.1)',
            border: '1px solid rgba(255, 179, 71, 0.3)',
            '& .MuiAlert-icon': {
              color: 'warning.main'
            },
            '& .MuiAlert-message': {
              color: 'warning.light',
              fontWeight: 500
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'warning.main',
              animation: 'pulse 2s infinite'
            }} />
            Please connect your wallet to interact with the contracts
          </Box>
        </Alert>
      )}

      {isWrongNetwork && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: '8px',
            background: 'rgba(244, 91, 91, 0.1)',
            border: '1px solid rgba(244, 91, 91, 0.3)',
            '& .MuiAlert-icon': {
              color: 'error.main'
            },
            '& .MuiAlert-message': {
              color: 'error.light',
              fontWeight: 500
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'error.main',
              animation: 'pulse 2s infinite'
            }} />
            Please switch to Sepolia network to interact with the contracts
          </Box>
        </Alert>
      )}

             <Box sx={{
         display: 'grid',
         gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
         gap: { xs: 3, sm: 3 },
         mb: 3
       }}>
         <FormControl fullWidth size="small">
                       <Select
              value={formData.token}
              displayEmpty
              onChange={(e) => handleInputChange('token', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme: any) => theme.palette.custom.subtleBorder,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme: any) => theme.palette.custom.subtleBorder,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }}
            >
                                                       <MenuItem
                 value="DAI"
                 sx={{
                   backgroundColor: formData.token === 'DAI' ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                   color: formData.token === 'DAI' ? 'primary.main' : 'inherit',
                   fontWeight: formData.token === 'DAI' ? 600 : 400,
                   '&:hover': {
                     backgroundColor: 'rgba(20, 184, 166, 0.15)',
                   },
                   '&.Mui-selected': {
                     backgroundColor: 'rgba(20, 184, 166, 0.2)',
                     color: 'primary.main',
                     fontWeight: 600,
                     '&:hover': {
                       backgroundColor: 'rgba(20, 184, 166, 0.25)',
                     }
                   }
                 }}
               >
                 DAI
               </MenuItem>
                           <MenuItem
                value="USDC"
                sx={{
                  backgroundColor: formData.token === 'USDC' ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                  color: formData.token === 'USDC' ? 'primary.main' : 'inherit',
                  fontWeight: formData.token === 'USDC' ? 600 : 400,
                  '&:hover': {
                    backgroundColor: 'rgba(20, 184, 166, 0.15)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(20, 184, 166, 0.2)',
                    color: 'primary.main',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(20, 184, 166, 0.25)',
                    }
                  }
                }}
              >
                USDC
              </MenuItem>
              {customTokens.map((ct) => (
                <MenuItem
                  key={ct.address}
                  value={ct.symbol}
                  sx={{
                    backgroundColor: formData.token === ct.symbol ? 'rgba(255, 179, 71, 0.1)' : 'transparent',
                    color: formData.token === ct.symbol ? '#ffb347' : 'inherit',
                    fontWeight: formData.token === ct.symbol ? 600 : 400,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 179, 71, 0.15)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 179, 71, 0.2)',
                      color: '#ffb347',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 179, 71, 0.25)',
                      }
                    }
                  }}
                >
                  {ct.symbol}
                </MenuItem>
              ))}
           </Select>
         </FormControl>

                   <TextField
            fullWidth
            size="small"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: (theme: any) => theme.palette.custom.subtleBorder,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: (theme: any) => theme.palette.custom.subtleBorder,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              },
            }}
          />

       </Box>

       <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Address (spender or recipient)"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme: any) => theme.palette.custom.subtleBorder,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme: any) => theme.palette.custom.subtleBorder,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                },
                '& .MuiInputLabel-root': {
                  '&.Mui-focused': {
                    color: 'primary.main'
                  }
                }
              }}
            />
            <Tooltip title="Address book">
              <IconButton
                onClick={() => setAddressBookOpen(true)}
                sx={{
                  mt: '4px',
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                <ContactsIcon />
              </IconButton>
            </Tooltip>
          </Box>
          {resolvedContact && (
            <Typography
              sx={{
                mt: 0.5,
                ml: 0.5,
                fontSize: '0.75rem',
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <ContactsIcon sx={{ fontSize: '0.875rem', color: 'primary.main' }} />
              {resolvedContact}
            </Typography>
          )}
          {recentAddresses.length > 0 && !formData.address && (
            <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              <HistoryIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
              {recentAddresses.map((addr) => {
                const contactName = contacts.find((c) => c.address.toLowerCase() === addr.toLowerCase())?.name
                return (
                  <Chip
                    key={addr}
                    label={contactName || `${addr.slice(0, 6)}...${addr.slice(-4)}`}
                    size="small"
                    variant="outlined"
                    onClick={() => handleInputChange('address', addr)}
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontFamily: contactName ? 'inherit' : 'monospace',
                      cursor: 'pointer',
                      borderColor: (theme: any) => theme.palette.custom.subtleBorder,
                      '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                    }}
                  />
                )
              })}
            </Box>
          )}
       </Box>

             <Box sx={{
         display: 'grid',
         gridTemplateColumns: {
           xs: '1fr',
           sm: 'repeat(2, 1fr)',
           md: 'repeat(3, 1fr)'
         },
         gap: { xs: 3, sm: 3, md: 3 },
         mt: 3
       }}>
        <MuiButton
          variant="contained"
          disabled={transactionStatus === 'pending' || transactionStatus === 'confirming' || !isConnected || isWrongNetwork}
          onClick={() => handleSubmit('approve')}
          startIcon={<ApproveIcon sx={{ fontSize: '1rem !important' }} />}
          data-testid="approve-button"
          sx={{
            minHeight: '40px',
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          {loading === 'approve' ? 'Approving...' : 'Approve'}
        </MuiButton>

        <MuiButton
          variant="contained"
          disabled={transactionStatus === 'pending' || transactionStatus === 'confirming' || !isConnected || isWrongNetwork}
          onClick={() => handleSubmit('transfer')}
          startIcon={<TransferIcon sx={{ fontSize: '1rem !important' }} />}
          data-testid="transfer-button"
          sx={{
            minHeight: '40px',
            bgcolor: 'success.main',
            color: '#1a1a2e',
            '&:hover': { bgcolor: 'success.dark' },
          }}
        >
          {loading === 'transfer' ? 'Transferring...' : 'Transfer'}
        </MuiButton>

        <MuiButton
          variant="outlined"
          disabled={transactionStatus === 'pending' || transactionStatus === 'confirming' || !isConnected || isWrongNetwork || !(BUILT_IN_TOKENS as readonly string[]).includes(formData.token)}
          onClick={() => handleSubmit('mint')}
          startIcon={<MintIcon sx={{ fontSize: '1rem !important' }} />}
          data-testid="mint-button"
          sx={{
            minHeight: '40px',
            gridColumn: { xs: '1', sm: '1 / -1', md: '3' },
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.08)', borderColor: 'primary.dark' },
          }}
        >
          {loading === 'mint' ? 'Minting...' : 'Mint'}
        </MuiButton>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirm}
        pendingAction={pendingAction}
      />

      <AddressBookDialog
        open={addressBookOpen}
        onClose={() => setAddressBookOpen(false)}
        onSelectContact={(addr) => handleInputChange('address', addr)}
      />

      {lastSuccessAddress && (
        <SaveContactPrompt
          address={lastSuccessAddress}
          onSaved={() => setLastSuccessAddress(null)}
          onDismiss={() => setLastSuccessAddress(null)}
        />
      )}
    </Box>
    </CardContent>
    </Card>
  )
}
