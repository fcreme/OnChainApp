import { AnimatePresence, motion } from 'framer-motion'
import { Box, Button, Typography } from '@mui/material'
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material'

export default function BatchActionBar({
  count,
  onApproveAll,
  onClear,
}: {
  count: number
  onApproveAll: () => void
  onClear: () => void
}) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1200,
          }}
        >
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 2,
            px: 3, py: 1.5,
            bgcolor: 'background.paper',
            border: 1, borderColor: 'primary.main',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>
              {count} selected
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckIcon sx={{ fontSize: '0.85rem !important' }} />}
              onClick={onApproveAll}
              sx={{ fontSize: '0.75rem', bgcolor: '#a4cf5e', color: '#111', '&:hover': { bgcolor: '#93bf4d' } }}
            >
              Approve All
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloseIcon sx={{ fontSize: '0.85rem !important' }} />}
              onClick={onClear}
              sx={{ fontSize: '0.75rem' }}
            >
              Clear
            </Button>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
