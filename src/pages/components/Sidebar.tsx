import { useState, useEffect, useMemo, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain, useDisconnect } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useThemeStore } from '../../stores/useThemeStore'
import { sepolia } from 'wagmi/chains'
import { useLocation, Link } from 'react-router-dom'
import {
  Box,
  Typography,
  Chip,
  Button,
  Tooltip,
  Drawer,
  IconButton,
  Badge,
} from '@mui/material'
import {
  Bolt as BoltIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Help as HelpIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon,
  AccountBalance as FaucetIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Contacts as ContactsIcon,
  Whatshot as WhatshotIcon,
  ShowChart as MarketsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material'
import WalletHelp from './WalletHelp'
import AddressBookDialog from './AddressBookDialog'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { TESTNET_CONFIG } from '../../lib/web3'
import { Link as RouterLink } from 'react-router-dom'

const SIDEBAR_WIDTH = 210

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon sx={{ fontSize: '1.1rem' }} /> },
  { label: 'History', path: '/transfers', icon: <HistoryIcon sx={{ fontSize: '1.1rem' }} /> },
  { label: 'Memecoins', path: '/memecoins', icon: <WhatshotIcon sx={{ fontSize: '1.1rem' }} /> },
  { label: 'Markets', path: '/markets', icon: <MarketsIcon sx={{ fontSize: '1.1rem' }} /> },
]

type AlertSeverity = 'error' | 'warning' | 'info'
interface Alert {
  id: string
  message: string
  description?: string
  severity: AlertSeverity
  action?: { label: string; href: string; external?: boolean }
}

const LOW_ETH_THRESHOLD = 0.05
const LARGE_TRANSFER_THRESHOLD = 50

function useAlerts(): Alert[] {
  const {
    transactionStatus,
    transactionHash,
    transactionError,
    nativeBalance,
    events,
    isLoadingBalances,
  } = useAppStore()

  const lowEth = !isLoadingBalances && Number(nativeBalance) < LOW_ETH_THRESHOLD

  const latestLargeEvent = useMemo(() => {
    const reversed = [...events].reverse()
    return reversed.find((e) => {
      const amount = Number(e.amount)
      return Number.isFinite(amount) && amount >= LARGE_TRANSFER_THRESHOLD
    })
  }, [events])

  return useMemo(() => {
    const list: Alert[] = []

    if (transactionStatus === 'error' && transactionError) {
      list.push({
        id: 'tx-error',
        message: 'Transaction failed',
        description: transactionError,
        severity: 'error',
      })
    } else if (transactionStatus === 'pending' || transactionStatus === 'confirming') {
      list.push({
        id: 'tx-pending',
        message: 'Transaction pending',
        description: transactionHash ? `Tx ${transactionHash.slice(0, 10)}...` : undefined,
        severity: 'warning',
        action: transactionHash
          ? { label: 'Etherscan', href: `https://sepolia.etherscan.io/tx/${transactionHash}`, external: true }
          : undefined,
      })
    }

    if (lowEth) {
      list.push({
        id: 'low-eth',
        message: 'Sepolia ETH running low',
        description: `${Number(nativeBalance).toFixed(4)} SEP remaining`,
        severity: 'error',
        action: { label: 'Get test ETH', href: TESTNET_CONFIG.faucetUrl, external: true },
      })
    }

    if (latestLargeEvent) {
      list.push({
        id: `large-${latestLargeEvent.tx}`,
        message: `${latestLargeEvent.token} ${latestLargeEvent.type} spotted`,
        description: `Amount: ${latestLargeEvent.amount}`,
        severity: 'info',
        action: { label: 'Review', href: '/transfers', external: false },
      })
    }

    return list
  }, [transactionStatus, transactionHash, transactionError, lowEth, nativeBalance, latestLargeEvent])
}

const _seenIds = new Set<string>()

function NotificationBell() {
  const alerts = useAlerts()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [, setTick] = useState(0)

  const unseenCount = alerts.filter((a) => !_seenIds.has(a.id)).length

  const handleOpen = () => {
    setDrawerOpen(true)
    for (const a of alerts) _seenIds.add(a.id)
    setTick((t) => t + 1)
  }

  const severityColor = (s: AlertSeverity) => {
    if (s === 'error') return '#f45b5b'
    if (s === 'warning') return '#ffb347'
    return '#14B8A6'
  }

  return (
    <>
      <Tooltip title={unseenCount ? `${unseenCount} new notification${unseenCount > 1 ? 's' : ''}` : 'No notifications'}>
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{ color: 'text.secondary' }}
        >
          <Badge
            badgeContent={unseenCount}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.6rem',
                height: 14,
                minWidth: 14,
              },
            }}
          >
            <NotificationsIcon sx={{ fontSize: '1.1rem' }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 340 },
            bgcolor: 'background.paper',
            borderLeft: 1,
            borderColor: 'divider',
          },
        }}
      >
        <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary' }}>
              Notifications
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          {alerts.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                All clear — no alerts
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {alerts.map((alert) => (
                <Box
                  key={alert.id}
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: (theme) => theme.palette.custom.subtleBg,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: severityColor(alert.severity) }}>
                    {alert.message}
                  </Typography>
                  {alert.description && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
                      {alert.description}
                    </Typography>
                  )}
                  {alert.action && (
                    <Button
                      component={alert.action.external ? 'a' : RouterLink}
                      href={alert.action.external ? alert.action.href : undefined}
                      to={alert.action.external ? undefined : alert.action.href}
                      target={alert.action.external ? '_blank' : undefined}
                      rel={alert.action.external ? 'noreferrer' : undefined}
                      size="small"
                      variant="outlined"
                      onClick={() => setDrawerOpen(false)}
                      sx={{
                        mt: 1,
                        fontSize: '0.75rem',
                        height: 28,
                        textTransform: 'none',
                        borderRadius: '6px',
                      }}
                    >
                      {alert.action.label}
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  )
}


function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { disconnect } = useDisconnect()
  const { setConnection } = useAppStore()
  const { mode, toggleMode } = useThemeStore()
  const [helpOpen, setHelpOpen] = useState(false)
  const [contactsOpen, setContactsOpen] = useState(false)
  const [walletMenuOpen, setWalletMenuOpen] = useState(false)
  const walletMenuRef = useRef<HTMLDivElement>(null)
  const { copy, copiedText } = useCopyToClipboard()
  const location = useLocation()

  // Close wallet menu on outside click
  useEffect(() => {
    if (!walletMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(e.target as Node)) {
        setWalletMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [walletMenuOpen])

  useEffect(() => {
    setConnection(isConnected, address, chainId)
  }, [address, chainId, isConnected, setConnection])

  const isWrongNetwork = isConnected && chainId !== sepolia.id
  const isCopied = copiedText === address

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: sepolia.id })
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      p: 2,
      gap: 1,
    }}>
      {/* Branding */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        px: 1,
        py: 1.5,
        mb: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BoltIcon sx={{ fontSize: '1.3rem', color: 'primary.main' }} />
          <Typography sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            color: 'text.primary',
          }}>
            Onchain
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationBell />
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={toggleMode} size="small" sx={{ color: 'text.secondary' }}>
              {mode === 'dark' ? <LightModeIcon sx={{ fontSize: '1.1rem' }} /> : <DarkModeIcon sx={{ fontSize: '1.1rem' }} />}
            </IconButton>
          </Tooltip>
          {onClose && (
            <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Box
              key={item.path}
              component={Link}
              to={item.path}
              onClick={onClose}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1,
                borderRadius: '6px',
                textDecoration: 'none',
                color: isActive ? 'primary.main' : 'text.secondary',
                borderLeft: isActive ? '3px solid' : '3px solid transparent',
                borderLeftColor: isActive ? 'primary.main' : 'transparent',
                background: isActive ? 'rgba(20, 184, 166, 0.08)' : 'transparent',
                transition: 'all 0.15s ease',
                '&:hover': {
                  background: 'rgba(20, 184, 166, 0.06)',
                  color: 'text.primary',
                },
              }}
            >
              {item.icon}
              <Typography sx={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400 }}>
                {item.label}
              </Typography>
            </Box>
          )
        })}
        <Box
          onClick={() => setContactsOpen(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            py: 1,
            borderRadius: '6px',
            cursor: 'pointer',
            color: 'text.secondary',
            borderLeft: '3px solid transparent',
            transition: 'all 0.15s ease',
            '&:hover': {
              background: 'rgba(20, 184, 166, 0.06)',
              color: 'text.primary',
            },
          }}
        >
          <ContactsIcon sx={{ fontSize: '1.1rem' }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 400 }}>
            Contacts
          </Typography>
        </Box>
      </Box>

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />

      {/* Network Status + Health */}
      {isConnected && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: 0.5 }}>
          <Chip
            data-testid="network-status"
            label={chainId === sepolia.id ? 'Sepolia' : 'Wrong Network'}
            size="small"
            icon={chainId === sepolia.id
              ? <CheckIcon sx={{ fontSize: '0.8rem' }} />
              : <WarningIcon sx={{ fontSize: '0.8rem' }} />
            }
            sx={{
              background: chainId === sepolia.id
                ? 'rgba(164, 207, 94, 0.15)'
                : 'rgba(255, 179, 71, 0.15)',
              border: chainId === sepolia.id
                ? '1px solid rgba(164, 207, 94, 0.3)'
                : '1px solid rgba(255, 179, 71, 0.3)',
              color: chainId === sepolia.id ? '#a4cf5e' : '#ffb347',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: '26px',
            }}
          />

          {chainId === sepolia.id && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<FaucetIcon sx={{ fontSize: '0.8rem !important' }} />}
              onClick={() => window.open(TESTNET_CONFIG.faucetUrl, '_blank')}
              sx={{ height: '28px', fontSize: '0.7rem' }}
            >
              Faucet
            </Button>
          )}
          {isWrongNetwork && (
            <Button
              data-testid="switch-network-button"
              onClick={handleSwitchNetwork}
              disabled={isSwitching}
              variant="contained"
              size="small"
              sx={{
                bgcolor: 'error.main',
                fontSize: '0.7rem',
                '&:hover': { bgcolor: 'error.dark' },
              }}
            >
              {isSwitching ? 'Switching...' : 'Switch to Sepolia'}
            </Button>
          )}
        </Box>
      )}

      {/* Wallet Section */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        pt: 1.5,
        borderTop: 1,
        borderColor: 'divider',
      }}>
        {!isConnected && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<HelpIcon sx={{ fontSize: '0.85rem !important' }} />}
            onClick={() => setHelpOpen(true)}
            sx={{ fontSize: '0.7rem' }}
          >
            Help
          </Button>
        )}

        <Box ref={walletMenuRef} sx={{ position: 'relative' }}>
          {isConnected && address ? (
            <Box
              data-testid="connect-button"
              onClick={() => setWalletMenuOpen((v) => !v)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 0.75,
                borderRadius: '8px',
                bgcolor: (theme) => theme.palette.custom.subtleBg,
                border: 1,
                borderColor: walletMenuOpen ? 'primary.main' : 'divider',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: (theme: any) => theme.palette.custom.subtleBorder,
                  bgcolor: (theme: any) => theme.palette.custom.hoverBg,
                },
              }}
            >
              <ConnectButton.Custom>
                {({ account }) => (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #14B8A6, #a4cf5e)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                      {account?.displayName?.slice(0, 2) || '??'}
                    </Typography>
                  </Box>
                )}
              </ConnectButton.Custom>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  data-testid="wallet-address"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {address.slice(0, 6)}...{address.slice(-4)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box data-testid="connect-button" sx={{ '& button': { width: '100%', fontSize: '0.8rem !important' } }}>
              <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />
            </Box>
          )}

          {/* Animated wallet dropdown */}
          <AnimatePresence>
            {walletMenuOpen && isConnected && address && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  marginBottom: 6,
                  zIndex: 10,
                }}
              >
                <Box
                  sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: '10px',
                    p: 1.5,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                  }}
                >
                  {/* Full address + copy */}
                  <Box
                    onClick={(e) => { e.stopPropagation(); copy(address) }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: (theme) => theme.palette.custom.hoverBg },
                    }}
                  >
                    {isCopied ? (
                      <CheckIcon sx={{ fontSize: '0.85rem', color: '#a4cf5e' }} />
                    ) : (
                      <CopyIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                    )}
                    <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'text.primary', fontWeight: 500 }}>
                      {isCopied ? 'Copied!' : `${address.slice(0, 10)}...${address.slice(-8)}`}
                    </Typography>
                  </Box>

                  {/* View on Etherscan */}
                  <Box
                    component="a"
                    href={`https://sepolia.etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'text.secondary',
                      '&:hover': { bgcolor: (theme) => theme.palette.custom.hoverBg, color: 'text.primary' },
                    }}
                  >
                    <ExternalIcon sx={{ fontSize: '0.85rem' }} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      View on Etherscan
                    </Typography>
                  </Box>

                  {/* Disconnect */}
                  <Box
                    onClick={() => { disconnect(); setWalletMenuOpen(false) }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#f45b5b',
                      '&:hover': { bgcolor: 'rgba(244, 91, 91, 0.08)' },
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: '0.85rem' }} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      Disconnect
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>

      <WalletHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <AddressBookDialog open={contactsOpen} onClose={() => setContactsOpen(false)} />
    </Box>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger button */}
      <IconButton
        onClick={() => setMobileOpen(true)}
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 1200,
          color: 'text.primary',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: '8px',
          '&:hover': {
            bgcolor: (theme) => theme.palette.custom.bgTertiary,
          }
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Desktop sidebar */}
      <Box
        component="nav"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'fixed',
          left: 0,
          top: 0,
          width: SIDEBAR_WIDTH,
          height: '100vh',
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          zIndex: 1100,
          overflowY: 'auto',
        }}
      >
        <SidebarContent />
      </Box>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </Drawer>
    </>
  )
}
