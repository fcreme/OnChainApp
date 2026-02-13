import { useState } from 'react'
import { Box } from '@mui/material'
import Sidebar from './Sidebar'
import TransactionStatus from './TransactionStatus'
import ToastContainer from './ToastContainer'
import CommandPalette from './CommandPalette'
import AddressBookDialog from './AddressBookDialog'
import { useIncomingTransferAlerts } from '../../hooks/useIncomingTransferAlerts'

const SIDEBAR_WIDTH = 210

export default function Layout({ children }: { children: React.ReactNode }) {
  const [contactsOpen, setContactsOpen] = useState(false)
  useIncomingTransferAlerts()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <CommandPalette onOpenContacts={() => setContactsOpen(true)} />
      <AddressBookDialog open={contactsOpen} onClose={() => setContactsOpen(false)} />
      <Box
        component="main"
        sx={{
          flex: 1,
          ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          minHeight: '100vh',
          pt: { xs: 7, md: 0 },
        }}
      >
        <TransactionStatus />
        <ToastContainer />
        {children}
      </Box>
    </Box>
  )
}
