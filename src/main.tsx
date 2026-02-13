import React, { useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { config } from './lib/web3'
import { getTheme } from './theme'
import { useThemeStore } from './stores/useThemeStore'
import App from './App'
import '@rainbow-me/rainbowkit/styles.css'
import './styles/responsive.css'

const queryClient = new QueryClient()

const rkOptions = { accentColor: '#14B8A6', accentColorForeground: '#fff', borderRadius: 'small' as const, overlayBlur: 'none' as const }

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode)

  const muiTheme = useMemo(() => getTheme(mode), [mode])
  const rkTheme = useMemo(
    () => (mode === 'dark' ? darkTheme(rkOptions) : lightTheme(rkOptions)),
    [mode]
  )

  useEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])

  return (
    <RainbowKitProvider theme={rkTheme}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </RainbowKitProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeWrapper>
          <App />
        </ThemeWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
