import type { ReactNode, ElementType } from 'react'
import { motion } from 'framer-motion'
import { Box, Typography, TextField, Chip, IconButton, InputAdornment } from '@mui/material'
import {
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material'

// ---------------------------------------------------------------------------
// SectionHeader — uppercase label with extending divider line
// ---------------------------------------------------------------------------
export function SectionHeader({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        fontSize: '0.65rem',
        fontWeight: 700,
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        mb: 1.25,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '&::after': {
          content: '""',
          flex: 1,
          height: '1px',
          bgcolor: 'divider',
        },
      }}
    >
      {children}
    </Typography>
  )
}

// ---------------------------------------------------------------------------
// HudCard — standard card with ::before top gradient accent, hover glow
// ---------------------------------------------------------------------------
export function HudCard({
  children,
  accentColor = '#14B8A6',
  onClick,
  sx,
}: {
  children: ReactNode
  accentColor?: string
  onClick?: () => void
  sx?: Record<string, any>
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '10px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : undefined,
        '&:hover': {
          borderColor: `${accentColor}40`,
          boxShadow: `0 0 20px ${accentColor}08`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}60, ${accentColor}00)`,
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// StatCard — extends HudCard with stagger animation, tabular-nums
// ---------------------------------------------------------------------------
const statCardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

export function StatCard({
  label,
  count,
  color,
  icon,
  index = 0,
  subtext,
  onClick,
}: {
  label: string
  count: number | string
  color: string
  icon?: string
  index?: number
  subtext?: string
  onClick?: () => void
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={statCardVariants}
    >
      <HudCard accentColor={color} onClick={onClick}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              sx={{
                fontSize: '0.65rem',
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              {label}
            </Typography>
            {icon && (
              <Typography sx={{ fontSize: '0.75rem', opacity: 0.3 }}>
                {icon}
              </Typography>
            )}
          </Box>
          <Typography
            sx={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {count}
          </Typography>
          {subtext && (
            <Typography
              sx={{
                fontSize: '0.6rem',
                color: 'text.secondary',
                mt: 0.5,
                fontFamily: 'monospace',
              }}
            >
              {subtext}
            </Typography>
          )}
        </Box>
      </HudCard>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// FilterBar — card panel wrapping search + chips with visual separator
// ---------------------------------------------------------------------------
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.5,
        mb: 2.5,
        p: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '10px',
      }}
    >
      {children}
    </Box>
  )
}

export function FilterBarSeparator() {
  return <Box sx={{ height: 20, width: '1px', bgcolor: 'divider', display: { xs: 'none', sm: 'block' } }} />
}

export function FilterBarSearch({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            </InputAdornment>
          ),
        },
      }}
      sx={{
        minWidth: 200,
        flex: { xs: 1, sm: 'none' },
        '& .MuiOutlinedInput-root': {
          fontSize: '0.8rem',
          borderRadius: '8px',
          height: 36,
        },
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// HudChip — 30px height, 6px radius, border transitions, color-coded
// ---------------------------------------------------------------------------
export function HudChip({
  label,
  active,
  color = '#14B8A6',
  onClick,
}: {
  label: string
  active: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <Chip
      label={label}
      size="small"
      onClick={onClick}
      sx={{
        fontWeight: 600,
        fontSize: '0.72rem',
        cursor: 'pointer',
        height: 30,
        borderRadius: '6px',
        bgcolor: active ? `${color}18` : 'transparent',
        color: active ? color : 'text.secondary',
        border: 1,
        borderColor: active ? `${color}40` : 'divider',
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: `${color}12`,
          borderColor: `${color}30`,
          color: color,
        },
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// PageHeader — icon box + title + subtitle with optional timestamp badge
// ---------------------------------------------------------------------------
export function PageHeader({
  icon,
  title,
  subtitle,
  timestamp,
  action,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  timestamp?: string | null
  action?: ReactNode
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(20,184,166,0.05))',
                border: '1px solid rgba(20,184,166,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.35rem', sm: '1.6rem' },
                color: 'text.primary',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {title}
            </Typography>
          </Box>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.8rem',
              pl: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {subtitle}
            {timestamp && (
              <Box
                component="span"
                sx={{
                  fontSize: '0.65rem',
                  color: 'rgba(20,184,166,0.7)',
                  fontFamily: 'monospace',
                  bgcolor: 'rgba(20,184,166,0.06)',
                  px: 1,
                  py: 0.25,
                  borderRadius: '4px',
                  border: '1px solid rgba(20,184,166,0.12)',
                }}
              >
                {timestamp}
              </Box>
            )}
          </Typography>
        </Box>
        {action}
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// EmptyState — radial gradient bg, centered icon + message
// ---------------------------------------------------------------------------
export function EmptyState({
  icon,
  message,
  submessage,
  children,
}: {
  icon?: ReactNode
  message: string
  submessage?: string
  children?: ReactNode
}) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.04) 0%, transparent 70%)',
        },
      }}
    >
      {icon && <Box sx={{ mb: 1.5, position: 'relative' }}>{icon}</Box>}
      <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500, position: 'relative' }}>
        {message}
      </Typography>
      {submessage && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem', mt: 0.5, opacity: 0.6, position: 'relative' }}>
          {submessage}
        </Typography>
      )}
      {children && <Box sx={{ position: 'relative', mt: 2 }}>{children}</Box>}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// DrawerHeader — colored ::before accent bar, ambient ::after glow
// ---------------------------------------------------------------------------
export function DrawerHeader({
  color,
  children,
  onClose,
}: {
  color: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        p: 2.5,
        pb: 2,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)`,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: `linear-gradient(180deg, ${color}06, transparent)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        {children}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            bgcolor: (theme) => theme.palette.custom.subtleBg,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            width: 32,
            height: 32,
            '&:hover': {
              bgcolor: (theme) => theme.palette.custom.hoverBg,
            },
          }}
        >
          <CloseIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// ResultCount — monospace result count for filter bars
// ---------------------------------------------------------------------------
export function ResultCount({ count, label = 'result' }: { count: number; label?: string }) {
  return (
    <Typography
      sx={{
        ml: 'auto',
        fontSize: '0.7rem',
        color: 'text.secondary',
        fontFamily: 'monospace',
        display: { xs: 'none', sm: 'block' },
      }}
    >
      {count} {label}{count !== 1 ? 's' : ''}
    </Typography>
  )
}
