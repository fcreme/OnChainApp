import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../../theme'
import AnimatedRoutes from '../AnimatedRoutes'

// The route graph reaches src/lib/web3, which builds a live wagmi config at import
// time. The routes under test never use it, so keep the test off the network.
vi.mock('../../../lib/web3', () => ({
  config: {},
  TESTNET_CONFIG: { chainId: 11155111, name: 'Sepolia', tokens: {} },
  RECOMMENDED_WALLETS: [],
}))

function renderAt(path: string) {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <AnimatedRoutes />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('AnimatedRoutes', () => {
  it('renders a not-found page for an unknown path', () => {
    renderAt('/definitely-not-a-route')

    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
  })

  it('offers a client-side link back to the dashboard from the not-found page', () => {
    renderAt('/definitely-not-a-route')

    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('still renders a known route rather than the not-found page', () => {
    renderAt('/audit')

    expect(screen.getByText('Audit Trail')).toBeInTheDocument()
    expect(screen.queryByText(/page not found/i)).not.toBeInTheDocument()
  })
})
