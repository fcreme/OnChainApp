import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      bgTertiary: string
      subtleBorder: string
      subtleBg: string
      hoverBg: string
      scrollbarTrack: string
      scrollbarThumb: string
    }
  }
  interface PaletteOptions {
    custom?: {
      bgTertiary?: string
      subtleBorder?: string
      subtleBg?: string
      hoverBg?: string
      scrollbarTrack?: string
      scrollbarThumb?: string
    }
  }
}

const darkPalette = {
  mode: 'dark' as const,
  primary: { main: '#14B8A6', light: '#2DD4BF', dark: '#0D9488', contrastText: '#ffffff' },
  secondary: { main: '#0D9488', light: '#14B8A6', dark: '#0F766E', contrastText: '#ffffff' },
  success: { main: '#a4cf5e', light: '#bfdf8a', dark: '#8ab83e' },
  warning: { main: '#ffb347', light: '#ffc875', dark: '#e09530' },
  error: { main: '#f45b5b', light: '#f78080', dark: '#d43d3d' },
  info: { main: '#14B8A6', light: '#2DD4BF', dark: '#0D9488' },
  background: { default: '#111116', paper: '#17171c' },
  text: { primary: '#e8e8e8', secondary: '#8a8a9a' },
  divider: 'rgba(255, 255, 255, 0.08)',
  custom: {
    bgTertiary: '#1d1d22',
    subtleBorder: 'rgba(255, 255, 255, 0.12)',
    subtleBg: 'rgba(255, 255, 255, 0.03)',
    hoverBg: 'rgba(255, 255, 255, 0.05)',
    scrollbarTrack: '#17171c',
    scrollbarThumb: '#2a2a35',
  },
}

const lightPalette = {
  mode: 'light' as const,
  primary: { main: '#14B8A6', light: '#2DD4BF', dark: '#0D9488', contrastText: '#ffffff' },
  secondary: { main: '#0D9488', light: '#14B8A6', dark: '#0F766E', contrastText: '#ffffff' },
  success: { main: '#a4cf5e', light: '#bfdf8a', dark: '#8ab83e' },
  warning: { main: '#ffb347', light: '#ffc875', dark: '#e09530' },
  error: { main: '#f45b5b', light: '#f78080', dark: '#d43d3d' },
  info: { main: '#14B8A6', light: '#2DD4BF', dark: '#0D9488' },
  background: { default: '#f5f5f8', paper: '#ffffff' },
  text: { primary: '#1a1a2e', secondary: '#5a5a6a' },
  divider: 'rgba(0, 0, 0, 0.08)',
  custom: {
    bgTertiary: '#eeeef2',
    subtleBorder: 'rgba(0, 0, 0, 0.12)',
    subtleBg: 'rgba(0, 0, 0, 0.02)',
    hoverBg: 'rgba(0, 0, 0, 0.04)',
    scrollbarTrack: '#eeeef2',
    scrollbarThumb: '#c0c0cc',
  },
}

export function getTheme(mode: 'light' | 'dark') {
  const palette = mode === 'dark' ? darkPalette : lightPalette
  const isDark = mode === 'dark'

  return createTheme({
    palette,
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' },
      h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em' },
      h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
      h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
      h5: { fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.4 },
      h6: { fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: '0.875rem', lineHeight: 1.6 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.5px' },
    },
    shape: { borderRadius: 8 },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: palette.custom.scrollbarTrack },
            '&::-webkit-scrollbar-thumb': { background: palette.custom.scrollbarThumb, borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: isDark ? '#3a3a48' : '#a0a0b0' },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: '0.8125rem',
            fontWeight: 500,
            textTransform: 'none',
            boxShadow: 'none',
            letterSpacing: '0.01em',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { boxShadow: 'none' },
            '&:active': { transform: 'scale(0.98)' },
          },
          contained: {
            backgroundColor: '#14B8A6',
            color: '#ffffff',
            '&:hover': { backgroundColor: '#0D9488' },
            '&.Mui-disabled': { backgroundColor: isDark ? 'rgba(20, 184, 166, 0.25)' : 'rgba(20, 184, 166, 0.3)', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)' },
          },
          outlined: {
            borderColor: palette.divider,
            color: palette.text.primary,
            '&:hover': {
              borderColor: '#14B8A6',
              backgroundColor: 'rgba(20, 184, 166, 0.08)',
            },
          },
          text: {
            color: palette.text.secondary,
            '&:hover': { backgroundColor: palette.custom.hoverBg, color: palette.text.primary },
          },
          sizeSmall: {
            padding: '5px 12px',
            fontSize: '0.75rem',
          },
          sizeLarge: {
            padding: '10px 24px',
            fontSize: '0.875rem',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            background: palette.background.paper,
            border: `1px solid ${palette.divider}`,
            boxShadow: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              backgroundColor: palette.custom.subtleBg,
              border: `1px solid ${palette.divider}`,
              '&:hover': { borderColor: palette.custom.subtleBorder },
              '&.Mui-focused': {
                borderColor: '#14B8A6',
                boxShadow: '0 0 0 2px rgba(20, 184, 166, 0.2)',
              },
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            },
            '& .MuiInputLabel-root': {
              color: palette.text.secondary,
              '&.Mui-focused': { color: '#14B8A6' },
            },
            '& .MuiInputBase-input': { color: palette.text.primary },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: palette.custom.subtleBg,
            border: `1px solid ${palette.divider}`,
            '&:hover': { borderColor: palette.custom.subtleBorder },
            '&.Mui-focused': {
              borderColor: '#14B8A6',
              boxShadow: '0 0 0 2px rgba(20, 184, 166, 0.2)',
            },
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            background: palette.background.paper,
            border: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            height: 28,
            backgroundColor: palette.custom.hoverBg,
            border: `1px solid ${palette.divider}`,
            color: palette.text.primary,
          },
          outlined: {
            borderColor: palette.custom.subtleBorder,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              backgroundColor: palette.background.default,
              borderBottom: `1px solid ${palette.divider}`,
              color: palette.text.secondary,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${palette.divider}`,
            padding: '10px 12px',
            color: palette.text.secondary,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': { backgroundColor: 'rgba(20, 184, 166, 0.04)' },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: palette.background.default,
            borderBottom: `1px solid ${palette.divider}`,
            boxShadow: 'none',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: palette.custom.subtleBg,
            border: `1px solid ${palette.divider}`,
            padding: '8px 16px',
            '& .MuiAlert-icon': { fontSize: '1.25rem', marginRight: '8px' },
            '& .MuiAlert-message': { padding: '4px 0' },
            '& .MuiAlertTitle-root': { fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: '#14B8A6',
            textDecoration: 'none',
            '&:hover': { color: '#2DD4BF', textDecoration: 'underline' },
          },
        },
      },
    },
  })
}

export const theme = getTheme('dark')
