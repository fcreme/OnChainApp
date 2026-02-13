import { useState } from 'react'
import { Box, TextField, Button, Typography } from '@mui/material'
import {
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useContactsStore } from '../../stores/useContactsStore'
import { useToastStore } from '../../stores/useToastStore'

interface SaveContactPromptProps {
  address: string
  onSaved: () => void
  onDismiss: () => void
}

export default function SaveContactPrompt({ address, onSaved, onDismiss }: SaveContactPromptProps) {
  const [name, setName] = useState('')
  const contacts = useContactsStore((s) => s.contacts)
  const addContact = useContactsStore((s) => s.addContact)
  const addToast = useToastStore((s) => s.addToast)

  const alreadyExists = contacts.some(
    (c) => c.address.toLowerCase() === address.toLowerCase()
  )

  if (alreadyExists) return null

  const short = `${address.slice(0, 6)}...${address.slice(-4)}`

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addContact(trimmed, address)
    addToast({ message: `"${trimmed}" saved to contacts`, severity: 'success' })
    onSaved()
  }

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: '8px',
        bgcolor: (theme: any) => theme.palette.custom.subtleBg,
        border: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 1.5,
      }}
    >
      <PersonAddIcon sx={{ color: 'primary.main', fontSize: 20, flexShrink: 0 }} />
      <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0 }}>
        Save {short} to contacts?
      </Typography>
      <TextField
        size="small"
        placeholder="Contact name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
        sx={{
          flex: 1,
          minWidth: 120,
          '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: (theme: any) => theme.palette.custom.subtleBorder,
          },
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <Button
          size="small"
          variant="contained"
          disabled={!name.trim()}
          onClick={handleSave}
          sx={{
            minWidth: 60,
            textTransform: 'none',
            fontSize: '0.75rem',
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Save
        </Button>
        <Button
          size="small"
          onClick={onDismiss}
          startIcon={<CloseIcon sx={{ fontSize: '0.875rem !important' }} />}
          sx={{
            minWidth: 60,
            textTransform: 'none',
            fontSize: '0.75rem',
            color: 'text.secondary',
          }}
        >
          Dismiss
        </Button>
      </Box>
    </Box>
  )
}
