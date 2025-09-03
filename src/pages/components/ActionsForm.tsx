import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useAppStore } from '../store/useAppStore'
import { sepolia } from 'wagmi/chains'
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button as MuiButton,
  Box,
  Alert
} from '@mui/material'
import { 
  CheckCircle as ApproveIcon,
  SwapHoriz as TransferIcon,
  Add as MintIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material'

const schema = z.object({
  token: z.enum(['DAI','USDC']),
  amount: z.string().refine(v=>Number(v)>0,'Invalid amount'),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address').optional()
})

export default function ActionsForm(){
  const { 
    approve, 
    transfer, 
    mint, 
    transactionStatus, 
    isConnected, 
    chainId
  } = useAppStore()

  const isWrongNetwork = isConnected && chainId !== sepolia.id
  const [loading, setLoading] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Clear local error when transaction status changes
  useEffect(() => {
    if (transactionStatus === 'pending') {
      setError('')
    }
  }, [transactionStatus])

  async function doApprove(f:{token:'DAI'|'USDC', amount:string, address:string}){
    try {
      setError('')
      setLoading('approve')
      const validated = schema.parse(f)
      await approve(validated.token, validated.address as `0x${string}`, validated.amount)
    } catch(e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
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
         setError('Error approving transaction. Please try again.')
       }
    } finally {
      setLoading('')
    }
  }
  
  async function doTransfer(f:{token:'DAI'|'USDC', amount:string, address:string}){
    try {
      setError('')
      setLoading('transfer')
      const validated = schema.parse(f)
      await transfer(validated.token, validated.address as `0x${string}`, validated.amount)
    } catch(e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
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
         setError('Error transferring tokens. Please try again.')
       }
    } finally {
      setLoading('')
    }
  }
  
  async function doMint(f:{token:'DAI'|'USDC', amount:string}){
    try {
      setError('')
      setLoading('mint')
      const validated = schema.parse(f)
      await mint(validated.token, validated.amount)
    } catch(e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else if (typeof e === 'object' && e !== null && 'errors' in e) {
        // Handle Zod validation errors
        const zodError = e as { errors: Array<{ message: string, path: string[] }> }
        const errorMessages = zodError.errors.map(err => {
          if (err.path.includes('amount')) return 'Please enter a valid amount greater than 0'
          return err.message
        })
        setError(errorMessages.join(', '))
             } else {
         setError('Error minting tokens. Please try again.')
       }
    } finally {
      setLoading('')
    }
  }

  const [formData, setFormData] = useState({
    token: 'DAI' as 'DAI' | 'USDC',
    amount: '',
    address: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (action: 'approve' | 'transfer' | 'mint') => {
    if (action === 'mint') {
      const { address: _address, ...data } = formData
      doMint(data as { token: 'DAI' | 'USDC', amount: string })
    } else if (action === 'approve') {
      doApprove(formData as { token: 'DAI' | 'USDC', amount: string, address: string })
    } else if (action === 'transfer') {
      doTransfer(formData as { token: 'DAI' | 'USDC', amount: string, address: string })
    }
  }

  const renderErrorMessage = (message: string) => {
    // Simple, user-friendly error messages in English
    if (message.includes('Address must start with 0x') || message.includes('Address must be 42 characters') || message.includes('Invalid Ethereum address')) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
          <Box sx={{ color: '#ffcdd2', fontWeight: 500 }}>
            Invalid address. Must start with 0x and have 42 characters
          </Box>
        </Box>
      )
    }
    
    if (message.includes('Please enter an amount') || message.includes('Amount must be greater than 0') || message.includes('Invalid amount')) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
          <Box sx={{ color: '#ffe0b2', fontWeight: 500 }}>
            Please enter a valid amount greater than 0
          </Box>
        </Box>
      )
    }
    
    if (message.includes('Please enter an Ethereum address')) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
          <Box sx={{ color: '#ffe0b2', fontWeight: 500 }}>
            Please enter a valid Ethereum address
          </Box>
        </Box>
      )
    }
    
    // Default error message - keep it simple
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
        <Box sx={{ color: '#ffcdd2', fontWeight: 500 }}>
          {message}
        </Box>
      </Box>
    )
  }

  return (
    <Box component="form" sx={{ mt: 2 }}>
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
          sx={{ 
            mb: 2,
            borderRadius: '12px',
            background: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            '& .MuiAlert-icon': {
              color: '#f44336'
            },
            '& .MuiAlert-message': {
              color: '#ffcdd2',
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
            borderRadius: '12px',
            background: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            '& .MuiAlert-icon': {
              color: '#ff9800'
            },
            '& .MuiAlert-message': {
              color: '#ffe0b2',
              fontWeight: 500
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#ff9800',
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
            borderRadius: '12px',
            background: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            '& .MuiAlert-icon': {
              color: '#f44336'
            },
            '& .MuiAlert-message': {
              color: '#ffcdd2',
              fontWeight: 500
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#f44336',
              animation: 'pulse 2s infinite'
            }} />
            Please switch to Sepolia network to interact with the contracts
          </Box>
        </Alert>
      )}
      
             <Box sx={{ 
         display: 'grid', 
         gridTemplateColumns: { 
           xs: '1fr', 
           sm: '1fr 1fr', 
           md: '1fr 1fr 1fr' 
         }, 
         gap: { xs: 3, sm: 3 }, 
         mb: 4 
       }}>
         <FormControl fullWidth>
                       <InputLabel sx={{ 
              fontSize: '0.875rem',
              top: '-8px',
              '&.Mui-focused': {
                color: 'primary.main'
              }
            }}>
              Token
            </InputLabel>
                       <Select
              value={formData.token}
              label="Token"
              onChange={(e) => handleInputChange('token', e.target.value)}
              sx={{ 
                minHeight: '64px',
                '& .MuiOutlinedInput-root': {
                  paddingTop: '8px',
                  paddingBottom: '8px'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }}
            >
                                                       <MenuItem 
                 value="DAI"
                 sx={{
                   backgroundColor: formData.token === 'DAI' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                   color: formData.token === 'DAI' ? '#4caf50' : 'inherit',
                   fontWeight: formData.token === 'DAI' ? 600 : 400,
                   '&:hover': {
                     backgroundColor: 'rgba(76, 175, 80, 0.15)',
                   },
                   '&.Mui-selected': {
                     backgroundColor: 'rgba(76, 175, 80, 0.2)',
                     color: '#4caf50',
                     fontWeight: 600,
                     '&:hover': {
                       backgroundColor: 'rgba(76, 175, 80, 0.25)',
                     }
                   }
                 }}
               >
                 DAI
               </MenuItem>
                           <MenuItem 
                value="USDC"
                sx={{
                  backgroundColor: formData.token === 'USDC' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                  color: formData.token === 'USDC' ? '#4caf50' : 'inherit',
                  fontWeight: formData.token === 'USDC' ? 600 : 400,
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.15)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    color: '#4caf50',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 0.25)',
                    }
                  }
                }}
              >
                USDC
              </MenuItem>
           </Select>
         </FormControl>

                   <TextField
            fullWidth
            label="Amount"
            placeholder="0.0"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            sx={{ 
              minHeight: '64px',
              '& .MuiOutlinedInput-root': {
                paddingTop: '8px',
                paddingBottom: '8px'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
                top: '-8px',
                '&.Mui-focused': {
                  color: 'primary.main'
                }
              }
            }}
          />

                   <TextField
            fullWidth
            label="Address (spender or recipient)"
            placeholder="0x..."
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            sx={{ 
              minHeight: '64px',
              gridColumn: { xs: '1', sm: '1 / -1', md: '3' },
              '& .MuiOutlinedInput-root': {
                paddingTop: '8px',
                paddingBottom: '8px'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
                top: '-8px',
                '&.Mui-focused': {
                  color: 'primary.main'
                }
              }
            }}
          />
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
          color="primary"
          disabled={transactionStatus === 'pending' || !isConnected || isWrongNetwork}
          onClick={() => handleSubmit('approve')}
          startIcon={<ApproveIcon />}
          data-testid="approve-button"
          sx={{ 
            minHeight: '52px',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 600
          }}
        >
          {loading === 'approve' ? 'Approving...' : 'APPROVE'}
        </MuiButton>

        <MuiButton
          variant="contained"
          color="success"
          disabled={transactionStatus === 'pending' || !isConnected || isWrongNetwork}
          onClick={() => handleSubmit('transfer')}
          startIcon={<TransferIcon />}
          data-testid="transfer-button"
          sx={{ 
            minHeight: '52px',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 600
          }}
        >
          {loading === 'transfer' ? 'Transferring...' : 'TRANSFER'}
        </MuiButton>

        <MuiButton
          variant="outlined"
          color="primary"
          disabled={transactionStatus === 'pending' || !isConnected || isWrongNetwork}
          onClick={() => handleSubmit('mint')}
          startIcon={<MintIcon />}
          data-testid="mint-button"
          sx={{ 
            minHeight: '52px',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 600,
            gridColumn: { xs: '1', sm: '1 / -1', md: '3' }
          }}
        >
          {loading === 'mint' ? 'Minting...' : 'MINT'}
        </MuiButton>
      </Box>
    </Box>
  )
}
