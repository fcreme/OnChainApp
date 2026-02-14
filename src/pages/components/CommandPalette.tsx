import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Dialog,
  Box,
  TextField,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Contacts as ContactsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Whatshot as WhatshotIcon,
  ShowChart as MarketsIcon,
  SwapHoriz as TransferIcon,
  CheckCircle as ApproveIcon,
  Add as MintIcon,
  Search as SearchIcon,
  Keyboard as KeyboardIcon,
} from '@mui/icons-material'
import { useThemeStore } from '../../stores/useThemeStore'

interface Command {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  category: 'navigation' | 'action' | 'settings'
  keywords: string[]
  onExecute: () => void
}

interface CommandPaletteProps {
  onOpenContacts: () => void
}

export default function CommandPalette({ onOpenContacts }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const { mode, toggleMode } = useThemeStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Register global Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const commands: Command[] = useMemo(() => [
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'Navigate to the main dashboard',
      icon: <DashboardIcon sx={{ fontSize: '1.2rem' }} />,
      category: 'navigation',
      keywords: ['dashboard', 'home', 'main', 'balances'],
      onExecute: () => navigate('/'),
    },
    {
      id: 'nav-history',
      label: 'Go to History',
      description: 'Navigate to transaction history',
      icon: <HistoryIcon sx={{ fontSize: '1.2rem' }} />,
      category: 'navigation',
      keywords: ['history', 'transfers', 'transactions', 'events'],
      onExecute: () => navigate('/transfers'),
    },
    {
      id: 'nav-memecoins',
      label: 'Go to Memecoins',
      description: 'Browse trending Solana memecoins',
      icon: <WhatshotIcon sx={{ fontSize: '1.2rem' }} />,
      category: 'navigation',
      keywords: ['memecoins', 'solana', 'trending', 'pump', 'dex'],
      onExecute: () => navigate('/memecoins'),
    },
    {
      id: 'nav-markets',
      label: 'Go to Markets',
      description: 'Browse top cryptocurrencies',
      icon: <MarketsIcon sx={{ fontSize: '1.2rem' }} />,
      category: 'navigation',
      keywords: ['markets', 'crypto', 'bitcoin', 'ethereum', 'top', 'coins'],
      onExecute: () => navigate('/markets'),
    },
    {
      id: 'open-contacts',
      label: 'Open contacts',
      description: 'Open the address book',
      icon: <ContactsIcon sx={{ fontSize: '1.2rem' }} />,
      category: 'action',
      keywords: ['contacts', 'address', 'book', 'people'],
      onExecute: () => onOpenContacts(),
    },
    {
      id: 'toggle-theme',
      label: mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      description: `Currently in ${mode} mode`,
      icon: mode === 'dark' ? <LightModeIcon sx={{ fontSize: '1.2rem' }} /> : <DarkModeIcon sx={{ fontSize: '1.2rem' }} />,
      category: 'settings',
      keywords: ['theme', 'dark', 'light', 'mode', 'toggle', 'appearance'],
      onExecute: () => toggleMode(),
    },
    {
      id: 'focus-transfer',
      label: 'Quick transfer',
      description: 'Go to dashboard and focus the form',
      icon: <TransferIcon sx={{ fontSize: '1.2rem' }} />,
      category: 'action',
      keywords: ['transfer', 'send', 'tokens'],
      onExecute: () => {
        if (location.pathname !== '/') navigate('/')
      },
    },
    {
      id: 'focus-approve',
      label: 'Quick approve',
      description: 'Go to dashboard to approve tokens',
      icon: <ApproveIcon sx={{ fontSize: '1.2rem' }} />,
      category: 'action',
      keywords: ['approve', 'allowance', 'spender'],
      onExecute: () => {
        if (location.pathname !== '/') navigate('/')
      },
    },
    {
      id: 'focus-mint',
      label: 'Quick mint',
      description: 'Go to dashboard to mint test tokens',
      icon: <MintIcon sx={{ fontSize: '1.2rem' }} />,
      category: 'action',
      keywords: ['mint', 'faucet', 'test', 'tokens'],
      onExecute: () => {
        if (location.pathname !== '/') navigate('/')
      },
    },
  ], [navigate, location.pathname, mode, toggleMode, onOpenContacts])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.includes(q))
    )
  }, [commands, query])

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filtered.length])

  const execute = (cmd: Command) => {
    setOpen(false)
    cmd.onExecute()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      execute(filtered[selectedIndex])
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'navigation': return 'Navigation'
      case 'action': return 'Actions'
      case 'settings': return 'Settings'
      default: return cat
    }
  }

  // Group by category
  const grouped = useMemo(() => {
    const groups: { category: string; items: (Command & { globalIndex: number })[] }[] = []
    let globalIdx = 0
    const cats = ['navigation', 'action', 'settings']
    for (const cat of cats) {
      const items = filtered
        .filter((c) => c.category === cat)
        .map((c) => ({ ...c, globalIndex: globalIdx++ }))
      if (items.length > 0) {
        groups.push({ category: cat, items })
      } else {
        // still advance the counter for items not in this category
      }
    }
    return groups
  }, [filtered])

  // Recalculate flat index mapping
  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped])

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          mt: '15vh',
          alignSelf: 'flex-start',
        },
      }}
    >
      <Box sx={{ p: 0 }}>
        {/* Search input */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1.5, fontSize: '1.3rem' }} />
          <TextField
            inputRef={inputRef}
            fullWidth
            variant="standard"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            slotProps={{
              input: {
                disableUnderline: true,
                sx: { fontSize: '0.95rem' },
              },
            }}
          />
          <Chip
            label="ESC"
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              borderColor: (theme: any) => theme.palette.custom.subtleBorder,
              color: 'text.secondary',
            }}
          />
        </Box>

        {/* Results */}
        {flatItems.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No matching commands
            </Typography>
          </Box>
        ) : (
          <List ref={listRef} sx={{ py: 1, maxHeight: 340, overflow: 'auto' }}>
            {grouped.map((group) => (
              <Box key={group.category}>
                <Typography
                  variant="caption"
                  sx={{
                    px: 2.5,
                    py: 0.75,
                    display: 'block',
                    color: 'text.secondary',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontSize: '0.65rem',
                  }}
                >
                  {categoryLabel(group.category)}
                </Typography>
                {group.items.map((cmd) => (
                  <ListItemButton
                    key={cmd.id}
                    selected={cmd.globalIndex === selectedIndex}
                    onClick={() => execute(cmd)}
                    sx={{
                      px: 2.5,
                      py: 1,
                      mx: 1,
                      borderRadius: '6px',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(20, 184, 166, 0.1)',
                        '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.15)' },
                      },
                      '&:hover': {
                        bgcolor: (theme: any) => theme.palette.custom.hoverBg,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: cmd.globalIndex === selectedIndex ? 'primary.main' : 'text.secondary' }}>
                      {cmd.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={cmd.label}
                      secondary={cmd.description}
                      primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItemButton>
                ))}
              </Box>
            ))}
          </List>
        )}

        {/* Footer hint */}
        <Box sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyboardIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            <strong>↑↓</strong> navigate &nbsp; <strong>↵</strong> select &nbsp; <strong>esc</strong> close
          </Typography>
        </Box>
      </Box>
    </Dialog>
  )
}
