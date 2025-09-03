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
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)'
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
            Wallets Compatibles
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
            Esta aplicación está diseñada para <strong>Ethereum Sepolia Testnet</strong>. 
            Necesitas una wallet compatible con Ethereum para conectarte.
          </Typography>
          
          <Card sx={{ 
            mb: 3,
            background: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)'
          }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WarningIcon sx={{ color: '#ff9800' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ff9800' }}>
                  Nota importante
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                <strong>Phantom Wallet</strong> es principalmente para Solana. Si tienes problemas, 
                considera usar una wallet específica para Ethereum como MetaMask.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Wallets Recomendadas
        </Typography>
        
        <List sx={{ p: 0 }}>
          {RECOMMENDED_WALLETS.map((wallet, index) => (
            <Box key={wallet.name}>
              <ListItem sx={{ 
                px: 0, 
                py: 2,
                borderRadius: '12px',
                mb: 1,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
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
                    background: 'rgba(102, 126, 234, 0.1)'
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
                        label="Recomendado" 
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
                  startIcon={<LinkIcon />}
                  onClick={() => window.open(wallet.url, '_blank')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      background: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  Instalar
                </Button>
              </ListItem>
              {index < RECOMMENDED_WALLETS.length - 1 && (
                <Divider sx={{ my: 1, opacity: 0.1 }} />
              )}
            </Box>
          ))}
        </List>

        <Box sx={{ mt: 4, p: 3, borderRadius: '12px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckIcon sx={{ color: '#4caf50' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4caf50' }}>
              Pasos para conectar
            </Typography>
          </Box>
          <List sx={{ p: 0 }}>
            <ListItem sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  background: '#4caf50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  1
                </Box>
              </ListItemIcon>
              <ListItemText primary="Instala una wallet compatible con Ethereum (MetaMask recomendado)" />
            </ListItem>
            <ListItem sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  background: '#4caf50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  2
                </Box>
              </ListItemIcon>
              <ListItemText primary="Configura la red Sepolia Testnet en tu wallet" />
            </ListItem>
            <ListItem sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  background: '#4caf50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  3
                </Box>
              </ListItemIcon>
              <ListItemText primary="Obtén ETH de prueba de un faucet" />
            </ListItem>
            <ListItem sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  background: '#4caf50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  4
                </Box>
              </ListItemIcon>
              <ListItemText primary="Conecta tu wallet a la aplicación" />
            </ListItem>
          </List>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
            }
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  )
}
