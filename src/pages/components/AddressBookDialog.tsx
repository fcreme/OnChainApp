import { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Slide,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import {
  Close as CloseIcon,
  Contacts as ContactsIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
} from '@mui/icons-material'
import { useContactsStore } from '../../stores/useContactsStore'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { useToastStore } from '../../stores/useToastStore'

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

interface AddressBookDialogProps {
  open: boolean
  onClose: () => void
  onSelectContact?: (address: string) => void
}

export default function AddressBookDialog({
  open,
  onClose,
  onSelectContact,
}: AddressBookDialogProps) {
  const { contacts, addContact, removeContact } = useContactsStore()
  const { copy, copiedText } = useCopyToClipboard()

  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [error, setError] = useState('')

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
    )
  })

  const handleAdd = () => {
    if (!newName.trim()) {
      setError('Name is required')
      return
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
      setError('Invalid Ethereum address')
      return
    }
    addContact(newName.trim(), newAddress)
    setNewName('')
    setNewAddress('')
    setError('')
  }

  const handleSelect = (address: string) => {
    if (onSelectContact) {
      onSelectContact(address)
      onClose()
    }
  }

  const handleExportCSV = () => {
    if (contacts.length === 0) return
    const header = 'Name,Address'
    const rows = contacts.map(
      (c) => `"${c.name.replace(/"/g, '""')}","${c.address}"`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `onchain-contacts-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportCSV = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      let imported = 0
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Skip header row
        if (i === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('address')) continue
        // Parse CSV row (handle quoted fields)
        const match = line.match(/^"?([^"]*)"?\s*,\s*"?(0x[a-fA-F0-9]{40})"?$/)
        if (match) {
          const name = match[1].replace(/""/g, '"').trim()
          const addr = match[2]
          if (name && addr) {
            addContact(name, addr)
            imported++
          }
        }
      }
      if (imported > 0) {
        useToastStore.getState().addToast({
          message: `Imported ${imported} contact${imported > 1 ? 's' : ''}`,
          severity: 'success',
        })
      } else {
        useToastStore.getState().addToast({
          message: 'No valid contacts found in CSV',
          severity: 'warning',
        })
      }
    }
    input.click()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={SlideUp}
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
          <ContactsIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Address book
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Import CSV">
            <IconButton size="small" onClick={handleImportCSV} sx={{ color: 'text.secondary' }}>
              <ImportIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export CSV">
            <span>
              <IconButton size="small" onClick={handleExportCSV} disabled={contacts.length === 0} sx={{ color: 'text.secondary' }}>
                <ExportIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Button onClick={onClose} sx={{ minWidth: 'auto', p: 1 }}>
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Search */}
        <TextField
          size="small"
          fullWidth
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
              ),
            },
          }}
        />

        {/* Contact list */}
        {filtered.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}
          >
            {contacts.length === 0
              ? 'No contacts yet. Add one below.'
              : 'No matching contacts.'}
          </Typography>
        ) : (
          <List dense sx={{ maxHeight: 240, overflow: 'auto' }}>
            <AnimatePresence mode="popLayout">
            {filtered.map((c, i) => {
              const isCopied = copiedText === c.address
              return (
                <motion.div
                  key={c.address}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                <ListItem
                  sx={{
                    borderRadius: '6px',
                    cursor: onSelectContact ? 'pointer' : 'default',
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.custom.hoverBg,
                    },
                  }}
                  onClick={() => handleSelect(c.address)}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={isCopied ? 'Copied!' : 'Copy address'}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            copy(c.address)
                          }}
                        >
                          {isCopied ? (
                            <CheckIcon sx={{ fontSize: '1rem', color: '#a4cf5e' }} />
                          ) : (
                            <CopyIcon sx={{ fontSize: '1rem' }} />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeContact(c.address)
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: '1rem', color: '#f45b5b' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={c.name}
                    secondary={`${c.address.slice(0, 6)}...${c.address.slice(-4)}`}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }}
                    secondaryTypographyProps={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                    }}
                  />
                </ListItem>
                </motion.div>
              )
            })}
            </AnimatePresence>
          </List>
        )}

        {/* Add contact form */}
        <Box
          sx={{
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            Add contact
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                setError('')
              }}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              placeholder="0x..."
              value={newAddress}
              onChange={(e) => {
                setNewAddress(e.target.value)
                setError('')
              }}
              sx={{ flex: 2 }}
            />
          </Box>
          {error && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              {error}
            </Typography>
          )}
          <Button variant="contained" size="small" onClick={handleAdd}>
            Add contact
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
