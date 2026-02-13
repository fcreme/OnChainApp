import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider
} from '@mui/material'
import {
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Link as LinkIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { RECOMMENDED_WALLETS } from '../../lib/web3'

interface WalletHelpProps {
  open: boolean
  onClose: () => void
}

export default function WalletHelp({ open, onClose }: WalletHelpProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
        }
      }}
    >
      <DialogTitle sx={{
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WalletIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Compatible Wallets
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
            This application is designed for the <strong>Ethereum Sepolia Testnet</strong>.
            You need an Ethereum-compatible wallet to connect.
          </Typography>

          <Card sx={{
            mb: 3,
            background: 'rgba(255, 179, 71, 0.1)',
            border: '1px solid rgba(255, 179, 71, 0.3)'
          }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WarningIcon sx={{ color: 'warning.main' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  Important note
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                <strong>Phantom Wallet</strong> is primarily for Solana. If you experience issues,
                consider using an Ethereum-specific wallet like MetaMask.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Recommended Wallets
        </Typography>

        <List sx={{ p: 0 }}>
          {RECOMMENDED_WALLETS.map((wallet, index) => (
            <Box key={wallet.name}>
              <ListItem sx={{
                px: 0,
                py: 2,
                borderRadius: '8px',
                mb: 1,
                background: (theme) => theme.palette.custom.subtleBg,
                border: 1,
                borderColor: 'divider',
                transition: 'all 0.15s ease',
                '&:hover': {
                  background: (theme) => theme.palette.custom.hoverBg,
                  borderColor: (theme) => theme.palette.custom.subtleBorder,
                }
              }}>
                <ListItemIcon sx={{ minWidth: 48 }}>
                  <Box sx={{
                    fontSize: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    background: 'rgba(20, 184, 166, 0.1)'
                  }}>
                    {wallet.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {wallet.name}
                      </Typography>
                      <Chip
                        label="Recommended"
                        size="small"
                        color="success"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {wallet.description}
                    </Typography>
                  }
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<LinkIcon sx={{ fontSize: '0.875rem !important' }} />}
                  onClick={() => window.open(wallet.url, '_blank')}
                >
                  Install
                </Button>
              </ListItem>
              {index < RECOMMENDED_WALLETS.length - 1 && (
                <Divider sx={{ my: 1, opacity: 0.1 }} />
              )}
            </Box>
          ))}
        </List>

        <Box sx={{ mt: 4, p: 3, borderRadius: '8px', background: 'rgba(164, 207, 94, 0.1)', border: '1px solid rgba(164, 207, 94, 0.2)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckIcon sx={{ color: '#a4cf5e' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#a4cf5e' }}>
              How to connect
            </Typography>
          </Box>
          <List sx={{ p: 0 }}>
            {[
              'Install an Ethereum-compatible wallet (MetaMask recommended)',
              'Set up the Sepolia Testnet network in your wallet',
              'Get test ETH from a faucet',
              'Connect your wallet to the application'
            ].map((step, i) => (
              <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#a4cf5e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: 'background.default',
                    fontWeight: 'bold'
                  }}>
                    {i + 1}
                  </Box>
                </ListItemIcon>
                <ListItemText primary={step} />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="contained"
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  )
}
